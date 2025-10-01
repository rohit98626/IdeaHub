"""
Novelty detection service for scoring idea uniqueness
"""

import numpy as np
from typing import List, Dict, Tuple, Optional
import logging
from app.core.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class NoveltyService:
    """Service for detecting novelty in ideas"""
    
    def __init__(self):
        self.novelty_threshold = settings.NOVELTY_THRESHOLD
        self.similarity_threshold = settings.SIMILARITY_THRESHOLD
    
    async def calculate_novelty_score(self, new_embedding: List[float], existing_embeddings: List[List[float]]) -> Dict:
        """
        Calculate novelty score for a new idea
        
        Args:
            new_embedding: Embedding of the new idea
            existing_embeddings: List of embeddings from existing ideas
        
        Returns:
            Dictionary containing novelty score and similar ideas
        """
        try:
            if not existing_embeddings:
                return {
                    "novelty_score": 1.0,
                    "similarity_scores": [],
                    "similar_ideas": [],
                    "is_novel": True
                }
            
            # Calculate similarities with existing ideas
            similarities = []
            for i, existing_embedding in enumerate(existing_embeddings):
                similarity = embedding_service.calculate_similarity(new_embedding, existing_embedding)
                similarities.append({
                    "index": i,
                    "similarity": similarity
                })
            
            # Sort by similarity (highest first)
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            
            # Calculate novelty score
            # Novelty = 1 - max_similarity (closer to 0 = more novel)
            max_similarity = similarities[0]["similarity"] if similarities else 0.0
            novelty_score = 1.0 - max_similarity
            
            # Find similar ideas (above threshold)
            similar_ideas = [
                sim for sim in similarities 
                if sim["similarity"] > self.similarity_threshold
            ]
            
            # Determine if idea is novel
            is_novel = novelty_score > self.novelty_threshold
            
            return {
                "novelty_score": novelty_score,
                "similarity_scores": similarities,
                "similar_ideas": similar_ideas,
                "is_novel": is_novel,
                "max_similarity": max_similarity
            }
            
        except Exception as e:
            logger.error(f"Error calculating novelty score: {e}")
            return {
                "novelty_score": 0.5,
                "similarity_scores": [],
                "similar_ideas": [],
                "is_novel": False,
                "max_similarity": 0.0
            }
    
    async def batch_novelty_scoring(self, new_embeddings: List[List[float]], existing_embeddings: List[List[float]]) -> List[Dict]:
        """Calculate novelty scores for multiple new ideas"""
        try:
            results = []
            
            for new_embedding in new_embeddings:
                result = await self.calculate_novelty_score(new_embedding, existing_embeddings)
                results.append(result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch novelty scoring: {e}")
            return []
    
    def detect_anomalies(self, embeddings: List[List[float]], threshold: float = 0.8) -> List[int]:
        """
        Detect anomalous (highly novel) ideas using statistical methods
        
        Args:
            embeddings: List of idea embeddings
            threshold: Threshold for anomaly detection
        
        Returns:
            List of indices of anomalous ideas
        """
        try:
            if len(embeddings) < 3:
                return []
            
            embeddings_array = np.array(embeddings)
            
            # Calculate pairwise similarities
            similarities = []
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    similarity = embedding_service.calculate_similarity(
                        embeddings[i], embeddings[j]
                    )
                    similarities.append(similarity)
            
            if not similarities:
                return []
            
            # Calculate statistics
            mean_similarity = np.mean(similarities)
            std_similarity = np.std(similarities)
            
            # Find anomalies (ideas with low similarity to others)
            anomalies = []
            for i, embedding in enumerate(embeddings):
                # Calculate average similarity to all other embeddings
                other_similarities = []
                for j, other_embedding in enumerate(embeddings):
                    if i != j:
                        similarity = embedding_service.calculate_similarity(embedding, other_embedding)
                        other_similarities.append(similarity)
                
                if other_similarities:
                    avg_similarity = np.mean(other_similarities)
                    # If similarity is significantly below mean, it's an anomaly
                    if avg_similarity < (mean_similarity - threshold * std_similarity):
                        anomalies.append(i)
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    def calculate_diversity_score(self, embeddings: List[List[float]]) -> float:
        """
        Calculate diversity score for a collection of ideas
        
        Args:
            embeddings: List of idea embeddings
        
        Returns:
            Diversity score (0-1, higher = more diverse)
        """
        try:
            if len(embeddings) < 2:
                return 0.0
            
            # Calculate average pairwise distance (inverse of similarity)
            distances = []
            for i in range(len(embeddings)):
                for j in range(i + 1, len(embeddings)):
                    similarity = embedding_service.calculate_similarity(
                        embeddings[i], embeddings[j]
                    )
                    distance = 1.0 - similarity
                    distances.append(distance)
            
            if not distances:
                return 0.0
            
            # Diversity is the average distance
            diversity = np.mean(distances)
            return float(diversity)
            
        except Exception as e:
            logger.error(f"Error calculating diversity score: {e}")
            return 0.0


# Global instance
novelty_service = NoveltyService()
