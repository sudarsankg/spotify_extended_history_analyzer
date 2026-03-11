import duckdb

print("Connecting DuckDB to local Parquet shards...")

# Swapped 'artists' for 'id'
query = """
    SELECT 
        id, name, popularity, danceability, energy, 
        key, loudness, mode, speechiness, acousticness, 
        instrumentalness, liveness, valence, tempo
    FROM 'raw_data/*.parquet'
    WHERE popularity > 20
"""

# Execute the query and load into Pandas
print("Crunching 250,000,000 rows on disk...")
master_df = duckdb.query(query).df()

print(f"Success! Extracted {len(master_df):,} high-quality songs.")

# Save the clean, filtered data to a single file for the PyTorch script
output_file = 'clean_spotify_features.parquet'
master_df.to_parquet(output_file, index=False)
print(f"Saved to '{output_file}'.")