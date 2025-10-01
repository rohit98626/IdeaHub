"""
Innovation service for idea combination and expansion using AI
"""

import google.generativeai as genai
from typing import List, Dict, Optional, Tuple
import logging
import json
import random
from app.core.config import settings
from app.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)


class InnovationService:
    """Service for generating innovative ideas through combination and expansion"""
    
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        self._setup_gemini()
    
    def _setup_gemini(self):
        try:
            if self.api_key:
                genai.configure(api_key=self.api_key)
                try:
                    self.model = genai.GenerativeModel('gemini-2.5-flash')
                    logger.info("Gemini API configured successfully with gemini-2.5-flash")
                except Exception as e1:
                    try:
                        self.model = genai.GenerativeModel('gemini-pro')
                        logger.info("Gemini API configured successfully with gemini-pro")
                    except Exception as e2:
                        try:
                            self.model = genai.GenerativeModel('gemini-1.5-pro')
                            logger.info("Gemini API configured successfully with gemini-1.5-pro")
                        except Exception as e3:
                            logger.error(f"Error setting up Gemini API with all models: {e1}, {e2}, {e3}")
                            self.model = None
            else:
                logger.warning("Gemini API key not provided - using fallback mode")
                self.model = None
        except Exception as e:
            logger.error(f"Error setting up Gemini API: {e}")
            self.model = None
    
    async def combine_ideas(self, ideas: List[Dict], combination_type: str = "creative") -> Dict:
        """
        Combine multiple ideas into a new hybrid idea
        
        Args:
            ideas: List of idea dictionaries with content
            combination_type: Type of combination (creative, practical, innovative)
        
        Returns:
            Dictionary containing combined idea and metadata
        """
        try:
            if len(ideas) < 2:
                raise ValueError("At least 2 ideas required for combination")
            
            # Extract idea contents
            idea_contents = [idea.get("content", "") for idea in ideas]
            idea_titles = [idea.get("title", f"Idea {i+1}") for i, idea in enumerate(ideas)]
            
            # Create combination prompt
            prompt = self._create_combination_prompt(idea_contents, idea_titles, combination_type)
            
            # Generate combined idea
            if self.model:
                response = self.model.generate_content(prompt)
                combined_content = response.text.strip()
            else:
                # Fallback to simple combination
                combined_content = self._fallback_combination(idea_contents)
            
            # Generate embedding for the combined idea
            combined_embedding = await embedding_service.generate_embedding(combined_content)
            
            # Calculate novelty score
            existing_embeddings = [idea.get("embedding", []) for idea in ideas if idea.get("embedding")]
            novelty_result = await self._calculate_combination_novelty(combined_embedding, existing_embeddings)
            
            # Generate expansion suggestions
            expansion_suggestions = await self._generate_expansion_suggestions(combined_content)
            
            return {
                "combined_content": combined_content,
                "source_ideas": [idea.get("id", "") for idea in ideas],
                "novelty_score": novelty_result.get("novelty_score", 0.5),
                "expansion_suggestions": expansion_suggestions,
                "combination_type": combination_type,
                "embedding": combined_embedding
            }
            
        except Exception as e:
            logger.error(f"Error combining ideas: {e}")
            raise
    
    async def expand_idea(self, idea: Dict, expansion_type: str = "comprehensive") -> Dict:
        """
        Expand a raw idea into a detailed proposal
        
        Args:
            idea: Idea dictionary with content
            expansion_type: Type of expansion (mobile_app, research_paper, startup, comprehensive)
        
        Returns:
            Dictionary containing expanded idea and metadata
        """
        try:
            idea_content = idea.get("content", "")
            idea_title = idea.get("title", "Untitled Idea")
            
            # Create expansion prompt
            prompt = self._create_expansion_prompt(idea_content, idea_title, expansion_type)
            
            # Generate expansion
            if self.model:
                response = self.model.generate_content(prompt)
                expanded_content = response.text.strip()
            else:
                # Fallback expansion
                expanded_content = self._fallback_expansion(idea_content, expansion_type)
            
            # Generate feasibility score
            feasibility_score = await self._calculate_feasibility_score(expanded_content, expansion_type)
            
            return {
                "expanded_content": expanded_content,
                "source_idea_id": idea.get("id", ""),
                "expansion_type": expansion_type,
                "feasibility_score": feasibility_score,
                "original_content": idea_content
            }
            
        except Exception as e:
            logger.error(f"Error expanding idea: {e}")
            raise
    
    def _create_combination_prompt(self, idea_contents: List[str], idea_titles: List[str], combination_type: str) -> str:
        """Create prompt for idea combination"""
        ideas_text = "\n\n".join([f"Idea {i+1} ({title}):\n{content}" for i, (title, content) in enumerate(zip(idea_titles, idea_contents))])
        
        combination_instructions = {
            "creative": "Create a highly creative and imaginative hybrid concept",
            "practical": "Focus on practical applications and real-world feasibility",
            "innovative": "Generate breakthrough innovations and novel approaches"
        }
        
        instruction = combination_instructions.get(combination_type, combination_instructions["creative"])
        
        return f"""
You are an expert innovation consultant. Your task is to combine the following ideas into a single, coherent, and innovative concept.

{instruction}

Ideas to combine:
{ideas_text}

Please create a new hybrid idea that:
1. Synthesizes the best elements from all input ideas
2. Creates novel connections between different concepts
3. Maintains practical feasibility
4. Includes a clear title and detailed description
5. Suggests potential applications or next steps

Format your response as:
Title: [Creative title for the combined idea]
Description: [Detailed description of the hybrid concept]
Applications: [Potential use cases or implementations]
Next Steps: [Specific actions to develop this idea]
"""
    
    def _create_expansion_prompt(self, idea_content: str, idea_title: str, expansion_type: str) -> str:
        """Create prompt for idea expansion"""
        
        expansion_templates = {
            "mobile_app": """
Transform this idea into a detailed mobile app concept:

Original Idea: {idea_title}
{idea_content}

Provide:
1. App Overview and Core Features
2. Target Audience and User Personas
3. Technical Architecture
4. User Experience Flow
5. Monetization Strategy
6. Development Timeline and Resources
7. Competitive Analysis
8. Marketing Strategy
""",
            "research_paper": """
Develop this idea into a comprehensive research paper proposal:

Original Idea: {idea_title}
{idea_content}

Provide:
1. Research Question and Objectives
2. Literature Review and Background
3. Methodology and Approach
4. Expected Outcomes and Contributions
5. Timeline and Resources
6. Potential Collaborators
7. Publication Strategy
8. Impact Assessment
""",
            "startup": """
Transform this idea into a startup business plan:

Original Idea: {idea_title}
{idea_content}

Provide:
1. Business Model and Value Proposition
2. Market Analysis and Size
3. Target Customers and Go-to-Market Strategy
4. Revenue Streams and Financial Projections
5. Team Requirements and Roles
6. Funding Strategy and Requirements
7. Risk Assessment and Mitigation
8. Growth Strategy and Scaling
""",
            "comprehensive": """
Expand this idea into a comprehensive project proposal:

Original Idea: {idea_title}
{idea_content}

Provide:
1. Project Overview and Objectives
2. Detailed Implementation Plan
3. Required Resources and Budget
4. Timeline and Milestones
5. Risk Assessment
6. Success Metrics
7. Stakeholder Analysis
8. Next Steps and Action Items
"""
        }
        
        template = expansion_templates.get(expansion_type, expansion_templates["comprehensive"])
        return template.format(idea_title=idea_title, idea_content=idea_content)
    
    def _fallback_combination(self, idea_contents: List[str]) -> str:
        """Fallback combination when API is not available"""
        combined = f"""Title: Hybrid Innovation Concept
Description: This innovative concept combines elements from {len(idea_contents)} different ideas to create a novel approach.

Key Elements Combined:
"""
        for i, content in enumerate(idea_contents, 1):
            combined += f"{i}. {content[:150]}{'...' if len(content) > 150 else ''}\n"
        
        combined += f"""
Applications: 
- Cross-domain innovation platform
- Multi-perspective problem solving
- Integrated solution development
- Collaborative ideation tool

Next Steps:
1. Identify common themes across all ideas
2. Develop prototype combining key features
3. Test feasibility with target users
4. Refine based on feedback and validation
5. Scale successful elements

This combination leverages the strengths of each individual idea while creating new possibilities through their intersection."""
        return combined
    
    def _fallback_expansion(self, idea_content: str, expansion_type: str) -> str:
        """Fallback expansion when API is not available"""
        expansion_templates = {
            "mobile_app": f"""Mobile App Development Plan:

Original Idea: {idea_content}

App Overview:
- Core functionality based on the original concept
- User-friendly interface design
- Cross-platform compatibility (iOS/Android)

Development Phases:
1. MVP Development (3-6 months)
2. User Testing and Feedback (1-2 months)
3. Feature Enhancement (2-4 months)
4. Launch and Marketing (1-2 months)

Technical Requirements:
- Frontend: React Native or Flutter
- Backend: Node.js or Python
- Database: MongoDB or PostgreSQL
- Cloud: AWS or Google Cloud

Monetization:
- Freemium model with premium features
- In-app purchases or subscriptions
- Advertisement integration""",
            
            "research_paper": f"""Research Paper Proposal:

Original Idea: {idea_content}

Research Objectives:
- Investigate the core concepts and implications
- Analyze current state and future potential
- Develop theoretical framework

Methodology:
- Literature review and analysis
- Case studies and examples
- Expert interviews and surveys
- Data collection and analysis

Expected Outcomes:
- Novel insights and findings
- Practical applications
- Future research directions

Timeline: 6-12 months
Resources: Research team, funding, access to data""",
            
            "startup": f"""Startup Business Plan:

Original Idea: {idea_content}

Business Model:
- Value proposition based on the core concept
- Target market identification
- Revenue streams and pricing strategy

Market Analysis:
- Market size and opportunity
- Competitive landscape
- Customer segments and needs

Operations:
- Product development roadmap
- Team structure and hiring
- Technology infrastructure
- Marketing and sales strategy

Financial Projections:
- Funding requirements
- Revenue projections (3-5 years)
- Break-even analysis
- Exit strategies""",
            
            "comprehensive": f"""Comprehensive Project Plan:

Original Idea: {idea_content}

Project Overview:
- Clear objectives and scope
- Stakeholder identification
- Success metrics and KPIs

Implementation Strategy:
- Phased approach with milestones
- Resource allocation and budget
- Risk assessment and mitigation
- Quality assurance processes

Timeline: 6-18 months
Budget: Variable based on scope
Team: Multi-disciplinary approach

Next Steps:
1. Detailed feasibility study
2. Stakeholder alignment
3. Resource procurement
4. Implementation kickoff"""
        }
        
        return expansion_templates.get(expansion_type, expansion_templates["comprehensive"])
    
    async def _calculate_combination_novelty(self, combined_embedding: List[float], existing_embeddings: List[List[float]]) -> Dict:
        """Calculate novelty score for combined idea"""
        try:
            if not existing_embeddings:
                return {"novelty_score": 1.0}
            
            similarities = []
            for existing_embedding in existing_embeddings:
                if existing_embedding:
                    similarity = embedding_service.calculate_similarity(combined_embedding, existing_embedding)
                    similarities.append(similarity)
            
            max_similarity = max(similarities) if similarities else 0.0
            novelty_score = 1.0 - max_similarity
            
            return {"novelty_score": novelty_score}
            
        except Exception as e:
            logger.error(f"Error calculating combination novelty: {e}")
            return {"novelty_score": 0.5}
    
    async def _generate_expansion_suggestions(self, content: str) -> List[str]:
        """Generate expansion suggestions for an idea"""
        suggestions = [
            "Develop into a mobile application",
            "Create a research paper or study",
            "Start a business or startup",
            "Build a web platform or service",
            "Design a physical product",
            "Create educational content or course",
            "Develop a community or network",
            "Create a tool or utility"
        ]
        
        # Randomly select 3-5 suggestions
        return random.sample(suggestions, min(len(suggestions), 5))
    
    async def _calculate_feasibility_score(self, content: str, expansion_type: str) -> float:
        """Calculate feasibility score for expanded idea"""
        try:
            # Simple heuristic-based feasibility scoring
            feasibility_factors = {
                "mobile_app": 0.7,  # Generally feasible
                "research_paper": 0.8,  # Very feasible
                "startup": 0.5,  # Moderate feasibility
                "comprehensive": 0.6  # Moderate feasibility
            }
            
            base_score = feasibility_factors.get(expansion_type, 0.6)
            
            # Adjust based on content length and detail
            content_length = len(content)
            if content_length > 1000:
                base_score += 0.1  # More detailed = more feasible
            elif content_length < 200:
                base_score -= 0.1  # Less detailed = less feasible
            
            return min(max(base_score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating feasibility score: {e}")
            return 0.5


# Global instance
innovation_service = InnovationService()
