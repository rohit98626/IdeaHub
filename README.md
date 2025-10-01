# 💡 Idea Innovation Hub

A personal innovation partner that transforms scattered thoughts into creative, actionable ideas using machine learning.

## 🎯 Problem Statement

Most people generate random ideas but fail to organize, connect, or expand them. Existing note-taking tools (Notion, Obsidian, Evernote) only store information — they don't help generate innovation. There is no personal tool that takes your scattered thoughts and transforms them into new, creative, and practical ideas.

## ✨ Features

- 🧠 **Idea Bank**: Collect notes, text, images, and voice recordings
- 🔗 **Smart Clustering**: Group similar ideas using ML embeddings
- ⭐ **Novelty Detection**: Score how unique your ideas are
- 🚀 **Idea Combination**: Mix unrelated concepts to generate hybrid ideas
- 📈 **Expansion Engine**: Transform raw notes into detailed project proposals
- 🕸️ **Knowledge Graph**: Visualize interconnected ideas and connections
- 🎤 **Voice Input**: Speech-to-text for capturing ideas on the go
- 📊 **Analytics**: Track your innovation journey and progress

## 🛠️ Tech Stack

### Frontend
- **React 18** with Material-UI
- **D3.js & Cytoscape.js** for visualization
- **Axios** for API communication
- **React Router** for navigation

### Backend
- **FastAPI** with async support
- **MongoDB** with Motor (async driver)
- **Sentence-BERT** for embeddings
- **Scikit-learn** for clustering
- **Google Gemini API** for idea generation
- **SpeechRecognition** for voice processing

### ML & AI
- **Sentence-Transformers**: Text embeddings
- **K-means/Agglomerative Clustering**: Idea grouping
- **Cosine Similarity**: Novelty detection
- **Gemini API**: Idea combination and expansion

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB (local or cloud)
- Google Gemini API key

### 1. Clone and Setup
```bash
git clone <repository-url>
cd idea-innovation-hub

# Run setup script
python setup.py
```

### 2. Configure Environment
```bash
# Backend
cd backend
cp env.example .env
# Edit .env with your MongoDB URL and API keys

# Frontend
cd ../frontend
cp env.example .env
# Edit .env with your backend URL
```

### 3. Start the Application
```bash
# From project root
python start.py
```

Or start manually:
```bash
# Terminal 1 - Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd frontend
npm install
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend       │    │   ML Services   │
│   (React)       │◄──►│   (FastAPI)      │◄──►│  (SBERT/Gemini) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │   MongoDB    │
                       │   Database   │
                       └──────────────┘
```

## 📋 Core Workflow

1. **Input**: User adds ideas via text, voice, or file upload
2. **Processing**: System generates embeddings and calculates novelty scores
3. **Clustering**: Similar ideas are grouped using ML algorithms
4. **Innovation**: AI combines and expands ideas into actionable concepts
5. **Visualization**: Knowledge graph shows idea relationships and connections

## 🎮 Usage

### Adding Ideas
- Type directly in the Idea Bank
- Use voice input for quick capture
- Upload files (text, images, audio)
- Import from other tools

### Smart Clustering
- System automatically groups similar ideas
- Manual cluster generation and editing
- View cluster summaries and relationships

### Innovation Tools
- **Combine**: Select 2+ ideas to create hybrid concepts
- **Expand**: Transform raw ideas into detailed proposals
- **Suggest**: Get AI-powered development recommendations

### Visualization
- Network graph of idea connections
- Cluster-based organization
- Timeline view of idea evolution
- Interactive exploration tools

## 🔧 Configuration

### Backend Environment Variables
```env
# Database
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=idea_innovation_hub

# APIs
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Authentication
SECRET_KEY=your-secret-key
```

### Frontend Environment Variables
```env
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_ENABLE_VOICE_INPUT=true
REACT_APP_ENABLE_VISUALIZATION=true
```

## 📊 Evaluation Metrics

- **Novelty Accuracy**: System correctly labels old vs new ideas
- **Cluster Quality**: Silhouette score for idea grouping
- **User Feedback**: Did system help create new, useful ideas?
- **Diversity Metric**: Measure uniqueness of generated combinations

## 🔮 Future Enhancements

- Patent-check APIs integration
- Market feasibility predictors
- Collaboration features
- Mobile app development
- Advanced visualization tools
- Integration with popular note-taking apps
- Real-time collaboration
- Advanced analytics and insights

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Sentence-Transformers for embeddings
- Google Gemini for AI capabilities
- Material-UI for beautiful components
- FastAPI for the excellent framework
- MongoDB for flexible data storage

## 📞 Support

- Create an issue for bug reports
- Start a discussion for feature requests
- Check the documentation in `backend/README.md` and `frontend/README.md`

---

**Transform your scattered thoughts into innovative solutions! 🚀**
