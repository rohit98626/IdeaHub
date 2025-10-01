"""
Simple embedding service that doesn't require sentence-transformers
Use this as a fallback when sentence-transformers is not available
"""

import hashlib
import math
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class SimpleEmbeddingService:
    """Simple embedding service using basic text processing"""
    
    def __init__(self):
        self.model_name = "simple-hash-based"
        
    async def load_model(self):
        """Load the simple model (no-op for simple service)"""
        logger.info("Using simple hash-based embedding service")
        
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate a simple embedding based on text features"""
        try:
            # Clean and preprocess text
            cleaned_text = self._preprocess_text(text)
            
            # Generate simple embedding based on text features
            embedding = self._text_to_embedding(cleaned_text)
            
            return embedding
            
        except Exception as e:
            logger.error(f"Error generating simple embedding: {e}")
            # Return a random embedding as fallback
            return [0.1] * 128
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts"""
        try:
            embeddings = []
            for text in texts:
                embedding = await self.generate_embedding(text)
                embeddings.append(embedding)
            return embeddings
            
        except Exception as e:
            logger.error(f"Error generating batch embeddings: {e}")
            return [[0.1] * 128] * len(texts)
    
    def _preprocess_text(self, text: str) -> str:
        """Preprocess text for embedding generation"""
        # Remove extra whitespace and convert to lowercase
        text = " ".join(text.split()).lower()
        return text.strip()
    
    def _text_to_embedding(self, text: str) -> List[float]:
        """Convert text to a simple embedding vector"""
        # Create a 128-dimensional embedding based on text features
        
        # Use multiple hash algorithms for better differentiation
        text_hash_md5 = hashlib.md5(text.encode()).hexdigest()
        text_hash_sha1 = hashlib.sha1(text.encode()).hexdigest()
        text_hash_sha256 = hashlib.sha256(text.encode()).hexdigest()
        
        # Character frequency features
        char_counts = {}
        for char in text:
            char_counts[char] = char_counts.get(char, 0) + 1
        
        # Word-based features
        words = text.split()
        word_count = len(words)
        
        # Create embedding vector
        embedding = []
        
        # MD5 hash-based components (16 dimensions)
        for i in range(16):
            hash_val = int(text_hash_md5[i*2:(i+1)*2], 16)
            embedding.append(hash_val / 255.0 - 0.5)
        
        # SHA1 hash-based components (16 dimensions)
        for i in range(16):
            hash_val = int(text_hash_sha1[i*2:(i+1)*2], 16)
            embedding.append(hash_val / 255.0 - 0.5)
        
        # SHA256 hash-based components (16 dimensions)
        for i in range(16):
            hash_val = int(text_hash_sha256[i*2:(i+1)*2], 16)
            embedding.append(hash_val / 255.0 - 0.5)
        
        # Character frequency components (32 dimensions)
        for i in range(32):
            char_code = i + ord('a')
            char = chr(char_code) if char_code <= ord('z') else ' '
            freq = char_counts.get(char, 0)
            embedding.append(min(freq / max(len(text), 1), 1.0))
        
        # Word-based components (32 dimensions)
        for i in range(32):
            if i < word_count:
                word = words[i]
                # Use different hash for each word position
                word_hash = hashlib.sha256((word + str(i)).encode()).hexdigest()
                val = int(word_hash[:2], 16) / 255.0
            else:
                val = 0.0
            embedding.append(val)
        
        # Text length and other features (16 dimensions)
        embedding.append(min(len(text) / 1000.0, 1.0))  # Text length
        embedding.append(min(word_count / 100.0, 1.0))   # Word count
        embedding.append(len(set(words)) / max(word_count, 1))  # Vocabulary diversity
        
        # Add position-based features for better differentiation
        for i in range(12):
            if i < len(words):
                word = words[i]
                # Position-weighted hash
                pos_hash = hashlib.md5((word + str(i * 7)).encode()).hexdigest()
                val = int(pos_hash[:2], 16) / 255.0
            else:
                val = 0.0
            embedding.append(val)
        
        # Fill remaining dimensions with zeros
        while len(embedding) < 128:
            embedding.append(0.0)
        
        # Normalize the embedding
        magnitude = math.sqrt(sum(x*x for x in embedding))
        if magnitude > 0:
            embedding = [x / magnitude for x in embedding]
        
        return embedding
    
    def calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between two embeddings"""
        try:
            # Calculate cosine similarity
            dot_product = sum(a * b for a, b in zip(embedding1, embedding2))
            norm1 = math.sqrt(sum(a * a for a in embedding1))
            norm2 = math.sqrt(sum(a * a for a in embedding2))
            
            if norm1 == 0 or norm2 == 0:
                return 0.0
            
            similarity = dot_product / (norm1 * norm2)
            return float(similarity)
            
        except Exception as e:
            logger.error(f"Error calculating similarity: {e}")
            return 0.0


# Global instance
simple_embedding_service = SimpleEmbeddingService()
