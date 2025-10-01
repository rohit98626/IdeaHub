"""
Simplified clustering service that doesn't require scikit-learn
Use this as a fallback when scikit-learn is not available
"""

import math
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class SimpleClusteringService:
    """Simplified clustering service using basic algorithms"""
    
    def __init__(self):
        self.max_clusters = 10
    
    def cluster_ideas(self, embeddings: List[List[float]], n_clusters: Optional[int] = None) -> Dict:
        """
        Simple clustering based on cosine similarity
        This is a fallback when scikit-learn is not available
        """
        try:
            if len(embeddings) < 2:
                return {
                    "labels": [0] * len(embeddings),
                    "centroids": embeddings,
                    "n_clusters": 1,
                    "silhouette_score": 0.0
                }
            
            # Determine number of clusters
            if n_clusters is None:
                # Be very aggressive about creating multiple clusters
                if len(embeddings) >= 10:
                    n_clusters = min(max(3, len(embeddings) // 3), self.max_clusters)
                elif len(embeddings) >= 5:
                    n_clusters = min(max(2, len(embeddings) // 2), self.max_clusters)
                elif len(embeddings) >= 3:
                    n_clusters = 2
                else:
                    n_clusters = 1
            
            # Simple clustering based on cosine similarity
            labels = self._simple_clustering(embeddings, n_clusters)
            
            # Calculate centroids
            centroids = self._calculate_centroids(embeddings, labels, n_clusters)
            
            # Simple silhouette score approximation
            silhouette = self._simple_silhouette_score(embeddings, labels)
            
            return {
                "labels": labels,
                "centroids": centroids,
                "n_clusters": n_clusters,
                "silhouette_score": silhouette
            }
            
        except Exception as e:
            logger.error(f"Error in simple clustering: {e}")
            # Return single cluster as fallback
            return {
                "labels": [0] * len(embeddings),
                "centroids": embeddings,
                "n_clusters": 1,
                "silhouette_score": 0.0
            }
    
    def _simple_clustering(self, embeddings: List[List[float]], n_clusters: int) -> List[int]:
        """Simple clustering algorithm based on distance"""
        if n_clusters >= len(embeddings):
            return list(range(len(embeddings)))
        
        # Initialize clusters randomly
        labels = [0] * len(embeddings)
        cluster_centers = []
        
        # Select initial cluster centers
        step = len(embeddings) // n_clusters
        for i in range(n_clusters):
            center_idx = min(i * step, len(embeddings) - 1)
            cluster_centers.append(embeddings[center_idx])
        
        # Simple k-means-like algorithm
        for iteration in range(10):  # Max 10 iterations
            changed = False
            
            # Assign each point to closest cluster
            for i, embedding in enumerate(embeddings):
                min_distance = float('inf')
                best_cluster = 0
                
                for j, center in enumerate(cluster_centers):
                    distance = self._cosine_distance(embedding, center)
                    if distance < min_distance:
                        min_distance = distance
                        best_cluster = j
                
                if labels[i] != best_cluster:
                    labels[i] = best_cluster
                    changed = True
            
            # Update cluster centers
            for j in range(n_clusters):
                cluster_points = [embeddings[i] for i in range(len(embeddings)) if labels[i] == j]
                if cluster_points:
                    cluster_centers[j] = self._average_embedding(cluster_points)
            
            if not changed:
                break
        
        return labels
    
    def _cosine_distance(self, vec1: List[float], vec2: List[float]) -> float:
        """Calculate cosine distance between two vectors"""
        try:
            # Calculate dot product
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            
            # Calculate magnitudes
            magnitude1 = math.sqrt(sum(a * a for a in vec1))
            magnitude2 = math.sqrt(sum(a * a for a in vec2))
            
            if magnitude1 == 0 or magnitude2 == 0:
                return 1.0  # Maximum distance
            
            # Calculate cosine similarity
            cosine_similarity = dot_product / (magnitude1 * magnitude2)
            
            # Convert to distance (1 - similarity)
            return 1.0 - cosine_similarity
            
        except Exception:
            return 1.0  # Maximum distance on error
    
    def _average_embedding(self, embeddings: List[List[float]]) -> List[float]:
        """Calculate average of multiple embeddings"""
        if not embeddings:
            return []
        
        n = len(embeddings)
        dim = len(embeddings[0])
        
        average = [0.0] * dim
        for embedding in embeddings:
            for i in range(dim):
                average[i] += embedding[i]
        
        return [val / n for val in average]
    
    def _calculate_centroids(self, embeddings: List[List[float]], labels: List[int], n_clusters: int) -> List[List[float]]:
        """Calculate cluster centroids"""
        try:
            centroids = []
            
            for i in range(n_clusters):
                cluster_points = [embeddings[j] for j in range(len(embeddings)) if labels[j] == i]
                if cluster_points:
                    centroid = self._average_embedding(cluster_points)
                    centroids.append(centroid)
                else:
                    # Empty cluster - use zero vector
                    centroids.append([0.0] * len(embeddings[0]))
            
            return centroids
            
        except Exception as e:
            logger.error(f"Error calculating centroids: {e}")
            return [[0.0] * len(embeddings[0])] * n_clusters
    
    def _simple_silhouette_score(self, embeddings: List[List[float]], labels: List[int]) -> float:
        """Simple silhouette score approximation"""
        try:
            if len(set(labels)) <= 1:
                return 0.0
            
            total_score = 0.0
            count = 0
            
            for i in range(len(embeddings)):
                # Calculate average distance to points in same cluster
                same_cluster_distances = []
                other_cluster_distances = []
                
                for j in range(len(embeddings)):
                    if i != j:
                        distance = self._cosine_distance(embeddings[i], embeddings[j])
                        if labels[i] == labels[j]:
                            same_cluster_distances.append(distance)
                        else:
                            other_cluster_distances.append(distance)
                
                if same_cluster_distances and other_cluster_distances:
                    avg_same = sum(same_cluster_distances) / len(same_cluster_distances)
                    avg_other = sum(other_cluster_distances) / len(other_cluster_distances)
                    
                    silhouette = (avg_other - avg_same) / max(avg_other, avg_same)
                    total_score += silhouette
                    count += 1
            
            return total_score / count if count > 0 else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating silhouette score: {e}")
            return 0.0
    
    def get_cluster_summary(self, embeddings: List[List[float]], labels: List[int], texts: List[str]) -> List[Dict]:
        """Get summary information for each cluster"""
        try:
            clusters = {}
            
            # Group texts by cluster
            for i, (text, label) in enumerate(zip(texts, labels)):
                if label not in clusters:
                    clusters[label] = {
                        "cluster_id": int(label),
                        "texts": [],
                        "embeddings": [],
                        "size": 0
                    }
                
                clusters[label]["texts"].append(text)
                clusters[label]["embeddings"].append(embeddings[i])
                clusters[label]["size"] += 1
            
            # Calculate cluster statistics
            cluster_summaries = []
            for cluster_data in clusters.values():
                # Find most representative text (closest to centroid)
                cluster_embeddings = cluster_data["embeddings"]
                centroid = self._average_embedding(cluster_embeddings)
                
                distances = [self._cosine_distance(emb, centroid) for emb in cluster_embeddings]
                representative_idx = min(range(len(distances)), key=distances.__getitem__)
                
                cluster_summaries.append({
                    "cluster_id": cluster_data["cluster_id"],
                    "size": cluster_data["size"],
                    "representative_text": cluster_data["texts"][representative_idx],
                    "all_texts": cluster_data["texts"]
                })
            
            return cluster_summaries
            
        except Exception as e:
            logger.error(f"Error generating cluster summary: {e}")
            return []


# Global instance
simple_clustering_service = SimpleClusteringService()
