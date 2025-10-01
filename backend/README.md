# Idea Innovation Hub - Backend

FastAPI backend for the Idea Innovation Hub application.

## Features

- 🧠 **ML-Powered Analysis**: Sentence-BERT embeddings, clustering, and novelty detection
- 🚀 **Innovation Engine**: Idea combination and expansion using Gemini API
- 🎤 **Voice Integration**: Speech-to-text functionality
- 🔐 **Authentication**: JWT-based user authentication
- 📊 **Analytics**: User statistics and idea analytics
- 🔄 **Real-time Processing**: Async API endpoints

## Tech Stack

- **Framework**: FastAPI
- **Database**: MongoDB with Motor (async driver)
- **ML**: Sentence-Transformers, Scikit-learn
- **AI**: Google Gemini API
- **Voice**: SpeechRecognition, PyDub
- **Authentication**: JWT with PassLib

## Quick Start

### Prerequisites

- Python 3.8+
- MongoDB (local or cloud)
- Node.js 16+ (for frontend)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd idea-innovation-hub
   ```

2. **Setup backend**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\\Scripts\\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   python main.py
   ```

The API will be available at `http://localhost:8000`

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=idea_innovation_hub

# Authentication
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# APIs
GEMINI_API_KEY=your-gemini-api-key-here
OPENAI_API_KEY=your-openai-api-key-here

# Server
HOST=0.0.0.0
PORT=8000
DEBUG=True
```

## API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication
- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `GET /api/v1/users/me` - Get current user

### Ideas
- `GET /api/v1/ideas/` - Get user's ideas
- `POST /api/v1/ideas/` - Create new idea
- `GET /api/v1/ideas/{id}` - Get specific idea
- `PUT /api/v1/ideas/{id}` - Update idea
- `DELETE /api/v1/ideas/{id}` - Delete idea
- `POST /api/v1/ideas/upload` - Upload file as idea
- `GET /api/v1/ideas/search/{query}` - Search ideas

### Clusters
- `GET /api/v1/clusters/` - Get clusters
- `POST /api/v1/clusters/generate` - Generate clusters
- `GET /api/v1/clusters/{id}` - Get cluster details

### Innovation
- `POST /api/v1/innovation/combine` - Combine ideas
- `POST /api/v1/innovation/expand` - Expand idea
- `GET /api/v1/innovation/combinations` - Get combinations
- `GET /api/v1/innovation/expansions` - Get expansions

## ML Services

### Embedding Service
Generates vector embeddings for ideas using Sentence-BERT:
```python
from app.services.embedding_service import embedding_service

# Generate embedding for a single text
embedding = await embedding_service.generate_embedding("Your idea text")

# Generate embeddings for multiple texts
embeddings = await embedding_service.generate_embeddings_batch(["Idea 1", "Idea 2"])
```

### Clustering Service
Groups similar ideas using K-means or Agglomerative clustering:
```python
from app.services.clustering_service import clustering_service

# Cluster ideas based on embeddings
result = clustering_service.cluster_ideas(embeddings, n_clusters=5)
```

### Novelty Service
Calculates novelty scores for ideas:
```python
from app.services.novelty_service import novelty_service

# Calculate novelty score
result = await novelty_service.calculate_novelty_score(new_embedding, existing_embeddings)
```

### Innovation Service
Combines and expands ideas using AI:
```python
from app.services.innovation_service import innovation_service

# Combine multiple ideas
result = await innovation_service.combine_ideas(ideas, combination_type="creative")

# Expand a single idea
result = await innovation_service.expand_idea(idea, expansion_type="mobile_app")
```

## Development

### Project Structure
```
backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/     # API endpoints
│   ├── core/
│   │   ├── config.py         # Configuration
│   │   └── database.py       # Database connection
│   ├── models/
│   │   ├── idea.py          # Idea models
│   │   └── user.py          # User models
│   └── services/
│       ├── embedding_service.py
│       ├── clustering_service.py
│       ├── novelty_service.py
│       ├── innovation_service.py
│       └── voice_service.py
├── main.py                  # Application entry point
├── requirements.txt         # Dependencies
└── env.example             # Environment template
```

### Running Tests
```bash
pytest
```

### Code Style
```bash
# Format code
black .

# Lint code
flake8 .

# Type checking
mypy .
```

## Deployment

### Docker
```bash
# Build image
docker build -t idea-innovation-hub-backend .

# Run container
docker run -p 8000:8000 idea-innovation-hub-backend
```

### Production Considerations
- Use environment variables for sensitive data
- Set up proper logging
- Configure CORS for production domains
- Use HTTPS in production
- Set up database connection pooling
- Configure rate limiting
- Set up monitoring and health checks

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Gemini API Errors**
   - Verify API key is correct
   - Check API quota and limits
   - Ensure internet connectivity

3. **Import Errors**
   - Activate virtual environment
   - Install all dependencies: `pip install -r requirements.txt`

4. **Port Already in Use**
   - Change PORT in `.env`
   - Kill existing process on port 8000

### Logs
Check logs in the `logs/` directory for detailed error information.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.
