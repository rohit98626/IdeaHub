"""
Embedding service for generating vector representations of ideas
"""

import logging
from typing import List, Optional
import numpy as np
from app.core.config import settings

# Try to import sentence-transformers, fall back to simple embedding if not available
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger = logging.getLogger(__name__)
    logger.warning("sentence-transformers not available, using simple embedding fallback")

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating embeddings using Sentence-BERT"""
    
    def __init__(self):
        self.model = None
        self.model_name = settings.SENTENCE_TRANSFORMER_MODEL
        
    async def load_model(self):
        """Load the Sentence-BERT model"""
        try:
            if self.model is None:
                logger.info(f"Loading Sentence-BERT model: {self.model_name}")
                self.model = SentenceTransformer(self.model_name)
                logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text"""
        try:
            # Use simple embedding if sentence-transformers is not available
            if not SENTENCE_TRANSFORMERS_AVAILABLE:
                from app.services.simple_embedding_service import simple_embedding_service
                return await simple_embedding_service.generate_embedding(text)
            
            await self.load_model()
            
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Generate embedding
            embedding = self.model.encode(cleaned_text, convert_to_tensor=False)
            
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            # Fall back to simple embedding
            try:
                from app.services.simple_embedding_service import simple_embedding_service
                logger.warning("Falling back to simple embedding due to error")
                return await simple_embedding_service.generate_embedding(text)
            except Exception as fallback_error:
                logger.error(f"Fallback embedding also failed: {fallback_error}")
                raise
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            # Use simple embedding if sentence-transformers is not available
            if not SENTENCE_TRANSFORMERS_AVAILABLE:
                from app.services.simple_embedding_service import simple_embedding_service
                return await simple_embedding_service.generate_embeddings_batch(texts)
            
            await self.load_model()
            
            # Clean and preprocess texts
            cleaned_texts = [self._preprocess_text(text) for text in texts]
            
            # Generate embeddings
            embeddings = self.model.encode(cleaned_texts, convert_to_tensor=False)
            
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            # Fall back to simple embedding
            try:
                from app.services.simple_embedding_service import simple_embedding_service
                logger.warning("Falling back to simple batch embedding due to error")
                return await simple_embedding_service.generate_embeddings_batch(texts)
            except Exception as fallback_error:
                logger.error(f"Fallback batch embedding also failed: {fallback_error}")
                raise
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for embedding generation"""
        # Remove extra whitespace
        text = " ".join(text.split())
        
        # Remove special characters that might interfere with embedding
        # Keep basic punctuation but remove excessive symbols
        
        return text.strip()
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            vec1 = np.array(embedding1)
            vec2 = np.array(embedding2)
            
            # Calculate cosine similarity
            dot_product = np.dot(vec1, vec2)
            norm1 = np.linalg.norm(vec1)
            norm2 = np.linalg.norm(vec2)
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0


# Global instance
embedding_service = EmbeddingService()
