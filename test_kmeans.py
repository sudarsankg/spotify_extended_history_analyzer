import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import torch

X = np.random.rand(100, 9)
kmeans = KMeans(n_clusters=8, random_state=42, n_init='auto')
kmeans.fit(X)
print("KMeans done")
