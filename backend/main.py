import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"

import random
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import time
import os

import hashlib

# SET SEEDS FOR CONSISTENCY
def set_seed(seed):
    if seed is None:
        seed = random.randint(0, 1000000)
    torch.manual_seed(seed)
    np.random.seed(seed)
    random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False
    return seed

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TrackWeight(BaseModel):
    name: str
    count: int

class UserHistory(BaseModel):
    top_tracks: List[TrackWeight]
    seed: Optional[int] = None
    mode: Optional[str] = "diverse"
    method: Optional[str] = "autoencoder" # "autoencoder" or "clustering"

class SimilarRequest(BaseModel):
    track_id: str
    mode: Optional[str] = "diverse"

class TasteCheckRequest(BaseModel):
    track_id: str
    top_tracks: List[TrackWeight]
    seed: Optional[int] = None

# --- UPGRADED PYTORCH AUTOENCODER CLASS ---
class TasteAutoencoder(nn.Module):
    def __init__(self, input_dim=9, latent_dim=3):
        super(TasteAutoencoder, self).__init__()
        # Encoder: 9 -> 32 -> 3 (latent)
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 32),
            nn.LeakyReLU(),
            nn.Linear(32, latent_dim)
        )
        # Decoder: 3 -> 32 -> 9
        self.decoder = nn.Sequential(
            nn.Linear(latent_dim, 32),
            nn.LeakyReLU(),
            nn.Linear(32, input_dim)
        )

    def forward(self, x):
        encoded = self.encoder(x)
        decoded = self.decoder(encoded)
        return decoded

# --- GLOBAL MODEL CACHE ---
cached_brain = {
    "fingerprint": None,
    "model": None,
    "scaler": None,
    "matched_names": []
}

# Load the database
print("Loading Parquet database into RAM...")
master_df = pd.read_parquet('clean_spotify_features.parquet')
features_columns = ['danceability', 'energy', 'loudness', 'speechiness', 'acousticness', 'instrumentalness', 'liveness', 'valence', 'tempo']
master_df = master_df.dropna(subset=features_columns)
master_df['name_lower'] = master_df['name'].str.lower()

# DE-DUPLICATION HELPER
def get_deduplicated_top_n(df, sort_col, ascending=True, n=20):
    """
    Prevents same-song duplicates by grouping by name and audio footprint.
    Keeps the version with the highest popularity.
    """
    # Group by name and features to identify identical recordings
    # We round features slightly to catch near-identical versions if they exist
    df_temp = df.copy()
    for col in features_columns:
        df_temp[f'{col}_round'] = df_temp[col].round(4)
    
    group_cols = ['name_lower'] + [f'{col}_round' for col in features_columns]
    
    # Sort by the request's sorting criteria (AI score or similarity)
    df_temp = df_temp.sort_values(by=sort_col, ascending=ascending)
    
    # Drop duplicates, keeping the first occurrence (which is the best match)
    deduped = df_temp.drop_duplicates(subset=group_cols, keep='first')
    
    return deduped.head(n)

hits_pool = master_df.sort_values(by='popularity', ascending=False).head(10000).copy()
diverse_pool = master_df.sort_values(by='popularity', ascending=False).head(100000).copy()

print(f"Server ready. De-duplication Logic Enabled.")

def get_data_fingerprint(data: List[TrackWeight], seed: int):
    raw_str = "".join([f"{t.name}{t.count}" for t in data]) + str(seed)
    return hashlib.md5(raw_str.encode()).hexdigest()

def train_or_load_model(data: List[TrackWeight], seed: int):
    global cached_brain
    fingerprint = get_data_fingerprint(data, seed)
    
    if cached_brain["fingerprint"] == fingerprint:
        print(f"🚀 [CACHE HIT] Using existing trained model.")
        return cached_brain["model"], cached_brain["scaler"], cached_brain["matched_names"]

    print(f"🧠 [CACHE MISS] Training brand new model...")
    name_to_count = { t.name.lower().strip(): t.count for t in data }
    unique_names = list(name_to_count.keys())
    matched_unique = master_df[master_df['name_lower'].isin(unique_names)].drop_duplicates(subset=['name_lower'])
    
    weighted_features = []
    for _, row in matched_unique.iterrows():
        count = name_to_count.get(row['name_lower'], 1)
        capped_count = min(count, 100)
        feat = row[features_columns].values
        for _ in range(capped_count): weighted_features.append(feat)
            
    if len(weighted_features) < 10: return None, None, []
    
    scaler = StandardScaler()
    scaled_matrix = scaler.fit_transform(np.array(weighted_features))
    X_train = torch.FloatTensor(scaled_matrix)
    model = TasteAutoencoder()
    optimizer = optim.Adam(model.parameters(), lr=0.008)
    
    model.train()
    for epoch in range(3500):
        optimizer.zero_grad()
        loss = nn.MSELoss()(model(X_train), X_train)
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 1000 == 0:
            print(f"   Training Step [{epoch+1}/3500], Loss: {loss.item():.4f}")
            
    print(f"Training complete. Final loss: {loss.item():.4f}")
    cached_brain = {"fingerprint": fingerprint, "model": model, "scaler": scaler, "matched_names": matched_unique['name_lower'].tolist()}
    return model, scaler, cached_brain["matched_names"]

def get_clustering_recommendations(data: List[TrackWeight], pool: pd.DataFrame, known_names: List[str], seed: int, n=20):
    """
    Cluster user tracks and find similar songs from the pool using cosine similarity to cluster centers.
    """
    set_seed(seed)
    name_to_count = { t.name.lower().strip(): t.count for t in data }
    unique_names = list(name_to_count.keys())
    matched_unique = master_df[master_df['name_lower'].isin(unique_names)].drop_duplicates(subset=['name_lower'])
    
    if len(matched_unique) < 5:
        return None
    
    # Weight features by play count for clustering
    weighted_features = []
    for _, row in matched_unique.iterrows():
        count = name_to_count.get(row['name_lower'], 1)
        capped_count = min(count, 50) # Cap for performance
        feat = row[features_columns].values
        for _ in range(capped_count): weighted_features.append(feat)
    
    scaler = StandardScaler()
    scaled_matrix = scaler.fit_transform(np.array(weighted_features))
    
    # Perform K-Means clustering (e.g., k=8 for variety)
    n_clusters = min(8, len(matched_unique))
    kmeans = KMeans(n_clusters=n_clusters, random_state=seed, n_init='auto')
    kmeans.fit(scaled_matrix)
    centroids = kmeans.cluster_centers_

    # Map each of the user's UNIQUE matched tracks to a cluster
    # We use the scaled features of the unique tracks (no duplicates)
    unique_scaled = scaler.transform(matched_unique[features_columns].values)
    user_labels = kmeans.predict(unique_scaled)
    
    # Find the most-played song for each cluster label
    anchor_songs = {}
    for i in range(n_clusters):
        cluster_track_indices = np.where(user_labels == i)[0]
        if len(cluster_track_indices) > 0:
            cluster_tracks = matched_unique.iloc[cluster_track_indices].copy()
            # Add back the counts to find the top one
            cluster_tracks['play_count'] = cluster_tracks['name_lower'].map(name_to_count)
            top_track = cluster_tracks.sort_values('play_count', ascending=False).iloc[0]
            anchor_songs[i] = top_track['name']
        else:
            anchor_songs[i] = "Unknown"

    # Find candidates not in known tracks
    current_recs_df = pool[~pool['name_lower'].isin(known_names)].copy()
    X_cand = scaler.transform(current_recs_df[features_columns].values)
    
    # Calculate cosine similarity to each cluster centroid
    sim_to_centroids = cosine_similarity(X_cand, centroids)
    
    # Find which cluster each candidate is closest to
    closest_cluster_idx = np.argmax(sim_to_centroids, axis=1)
    max_sim = np.max(sim_to_centroids, axis=1)
    
    current_recs_df['ai_score'] = max_sim
    current_recs_df['cluster_id'] = closest_cluster_idx

    # DIVERSE SAMPLING: Take the top songs from EACH cluster
    # This ensures "extremes" are represented
    diverse_results = []
    songs_per_cluster = max(2, n // n_clusters)
    
    for i in range(n_clusters):
        cluster_candidates = current_recs_df[current_recs_df['cluster_id'] == i]
        if cluster_candidates.empty:
            continue
            
        # Get top deduplicated songs for THIS cluster
        top_in_cluster = get_deduplicated_top_n(cluster_candidates, 'ai_score', ascending=False, n=songs_per_cluster)
        
        for _, r in top_in_cluster.iterrows():
            diverse_results.append({
                "id": r['id'], 
                "name": r['name'], 
                "score": float(r['ai_score']), 
                "popularity": int(r['popularity']),
                "anchor_song": anchor_songs.get(i, "Your Taste")
            })
            
    # Final sort by similarity score across all clusters and limit to n
    diverse_results = sorted(diverse_results, key=lambda x: x['score'], reverse=True)[:n]
    return diverse_results

def get_cluster_visualization(matched_unique, name_to_count, centroids, scaler, seed):
    """
    Project user tracks to 2D for plotting and return cluster metadata.
    """
    if len(matched_unique) < 5:
        return None
        
    # Project to 2D using PCA
    pca = PCA(n_components=2, random_state=seed)
    # We use all unique matched songs for the map
    X_unique_scaled = scaler.transform(matched_unique[features_columns].values)
    X_2d = pca.fit_transform(X_unique_scaled)
    centroids_2d = pca.transform(centroids)
    
    # Map back to original feature space for the '9 embeddings' view
    # Centroids are already in scaled space, we can un-scale them if we want raw values
    # but scaled values (0 to 1-ish) are often better for radar charts
    
    points = []
    # Pre-calculate cluster labels for all unique tracks
    kmeans_temp = KMeans(n_clusters=len(centroids), init=centroids, n_init=1)
    kmeans_temp.fit(centroids) # Just to initialize the object if needed, but it's already fitted in a way
    user_labels = kmeans_temp.predict(X_unique_scaled)
    
    for i, row in enumerate(matched_unique.iterrows()):
        _, data = row
        points.append({
            "x": float(X_2d[i, 0]),
            "y": float(X_2d[i, 1]),
            "name": data['name'],
            "cluster": int(user_labels[i])
        })
        
    cluster_metadata = []
    for i, centroid in enumerate(centroids):
        # Find user songs belonging to this cluster
        cluster_track_indices = np.where(user_labels == i)[0]
        top_songs = []
        mean_song = "Unknown"
        if len(cluster_track_indices) > 0:
            cluster_tracks = matched_unique.iloc[cluster_track_indices].copy()
            cluster_tracks['play_count'] = cluster_tracks['name_lower'].map(name_to_count)
            
            # 1. Find Top 5 by play count
            top_5_df = cluster_tracks.sort_values('play_count', ascending=False).head(5)
            top_songs = top_5_df['name'].tolist()

            # 2. Find the song most similar to the centroid (the "Mean Song")
            cluster_features_scaled = X_unique_scaled[cluster_track_indices]
            # Reshape centroid for similarity calculation
            centroid_reshaped = centroid.reshape(1, -1)
            sims = cosine_similarity(cluster_features_scaled, centroid_reshaped).flatten()
            best_idx = np.argmax(sims)
            mean_song = cluster_tracks.iloc[best_idx]['name']

        cluster_metadata.append({
            "id": i,
            "center_x": float(centroids_2d[i, 0]),
            "center_y": float(centroids_2d[i, 1]),
            "features": {feat: float(val) for feat, val in zip(features_columns, centroid)},
            "top_songs": top_songs,
            "mean_song": mean_song
        })
        
    return {"points": points, "clusters": cluster_metadata}

@app.post("/analyze")
async def analyze_user_taste(data: UserHistory):
    effective_seed = set_seed(data.seed)
    model, scaler, known_names = train_or_load_model(data.top_tracks, effective_seed)
    if model is None: return {"status": "error", "message": "Need more data."}
    
    pool = hits_pool if data.mode == "hits" else diverse_pool
    
    if data.method == "clustering":
        # Get centroids for recommendations
        name_to_count = { t.name.lower().strip(): t.count for t in data.top_tracks }
        unique_names = list(name_to_count.keys())
        matched_unique = master_df[master_df['name_lower'].isin(unique_names)].drop_duplicates(subset=['name_lower'])
        
        # We need the weighted features for the TRUE centroids used in recs
        weighted_features = []
        for _, row in matched_unique.iterrows():
            count = name_to_count.get(row['name_lower'], 1)
            capped_count = min(count, 50)
            feat = row[features_columns].values
            for _ in range(capped_count): weighted_features.append(feat)
        
        # Fit K-Means on WEIGHTED features
        n_clusters = min(8, len(matched_unique))
        temp_scaler = StandardScaler()
        X_weighted_scaled = temp_scaler.fit_transform(np.array(weighted_features))
        kmeans = KMeans(n_clusters=n_clusters, random_state=effective_seed, n_init='auto')
        kmeans.fit(X_weighted_scaled)
        centroids = kmeans.cluster_centers_
        
        recs = get_clustering_recommendations(data.top_tracks, pool, known_names, effective_seed)
        viz = get_cluster_visualization(matched_unique, name_to_count, centroids, temp_scaler, effective_seed)
        
        return {"status": "success", "recommendations": recs, "cluster_viz": viz}
    
    # Default Autoencoder method... (rest of the function)
    current_recs_df = pool[~pool['name_lower'].isin(known_names)].copy()
    X_cand = torch.FloatTensor(scaler.transform(current_recs_df[features_columns].values))
    model.eval()
    with torch.no_grad():
        mse = torch.mean((model(X_cand) - X_cand)**2, dim=1).numpy()
    
    current_recs_df['ai_score'] = mse
    # Apply De-duplication
    top_recs = get_deduplicated_top_n(current_recs_df, 'ai_score', ascending=True, n=20)
    
    results = [{"id": r['id'], "name": r['name'], "score": float(r['ai_score']), "popularity": int(r['popularity'])} for _, r in top_recs.iterrows()]
    return {"status": "success", "recommendations": results}

@app.post("/deep_analyze")
async def deep_analyze_user_taste(data: UserHistory):
    effective_seed = set_seed(data.seed)
    model, scaler, known_names = train_or_load_model(data.top_tracks, effective_seed)
    if model is None: return {"status": "error", "message": "Need more data."}
    
    if data.method == "clustering":
        # Get centroids for recommendations
        name_to_count = { t.name.lower().strip(): t.count for t in data.top_tracks }
        unique_names = list(name_to_count.keys())
        matched_unique = master_df[master_df['name_lower'].isin(unique_names)].drop_duplicates(subset=['name_lower'])
        
        weighted_features = []
        for _, row in matched_unique.iterrows():
            count = name_to_count.get(row['name_lower'], 1)
            capped_count = min(count, 50)
            feat = row[features_columns].values
            for _ in range(capped_count): weighted_features.append(feat)
        
        n_clusters = min(8, len(matched_unique))
        temp_scaler = StandardScaler()
        X_weighted_scaled = temp_scaler.fit_transform(np.array(weighted_features))
        kmeans = KMeans(n_clusters=n_clusters, random_state=effective_seed, n_init='auto')
        kmeans.fit(X_weighted_scaled)
        centroids = kmeans.cluster_centers_

        recs = get_clustering_recommendations(data.top_tracks, master_df, known_names, effective_seed)
        viz = get_cluster_visualization(matched_unique, name_to_count, centroids, temp_scaler, effective_seed)
        
        return {"status": "success", "recommendations": recs, "cluster_viz": viz}

    all_candidates = master_df[~master_df['name_lower'].isin(known_names)].copy()
    all_mses = []
    model.eval()
    with torch.no_grad():
        for i in range(0, len(all_candidates), 500000):
            chunk = all_candidates.iloc[i:i+500000]
            X_chunk = torch.FloatTensor(scaler.transform(chunk[features_columns].values))
            all_mses.append(torch.mean((model(X_chunk) - X_chunk)**2, dim=1).numpy())
    
    all_candidates['ai_score'] = np.concatenate(all_mses)
    # Apply De-duplication
    top_recs = get_deduplicated_top_n(all_candidates, 'ai_score', ascending=True, n=20)
    
    results = [{"id": r['id'], "name": r['name'], "score": float(r['ai_score']), "popularity": int(r['popularity'])} for _, r in top_recs.iterrows()]
    return {"status": "success", "recommendations": results}

@app.post("/similar")
async def find_similar_songs(data: SimilarRequest):
    source_song = master_df[master_df['id'] == data.track_id]
    if source_song.empty: return {"status": "error", "message": "Song not found."}
    source_features = source_song[features_columns].values
    pool = hits_pool if data.mode == "hits" else diverse_pool
    candidates = pool[pool['id'] != data.track_id].copy()
    scaler = StandardScaler()
    scaled_cand = scaler.fit_transform(candidates[features_columns].values)
    scaled_source = scaler.transform(source_features)
    similarities = cosine_similarity(scaled_source, scaled_cand).flatten()
    candidates['similarity'] = similarities
    
    # Apply De-duplication (higher similarity is better)
    top_10 = get_deduplicated_top_n(candidates, 'similarity', ascending=False, n=10)
    
    results = [{"id": row['id'], "name": row['name'], "score": float(row['similarity']), "popularity": int(row['popularity'])} for _, row in top_10.iterrows()]
    return {"status": "success", "source_name": source_song.iloc[0]['name'], "recommendations": results}

@app.post("/check_taste")
async def check_taste_match(data: TasteCheckRequest):
    effective_seed = set_seed(data.seed)
    model, scaler, _ = train_or_load_model(data.top_tracks, effective_seed)
    if model is None: return {"status": "error", "message": "Need more data."}
    source_song = master_df[master_df['id'] == data.track_id]
    if source_song.empty: return {"status": "error", "message": "Song not found."}
    X_input = torch.FloatTensor(scaler.transform(source_song[features_columns].values))
    model.eval()
    with torch.no_grad():
        mse = torch.mean((model(X_input) - X_input)**2).item()
    return {"status": "success", "name": source_song.iloc[0]['name'], "match_score": 1 - mse}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
