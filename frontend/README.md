# Idea Innovation Hub - Frontend

React frontend for the Idea Innovation Hub application.

## Features

- 🎨 **Modern UI**: Material-UI components with responsive design
- 💡 **Idea Management**: Create, edit, and organize ideas
- 🔗 **Smart Clustering**: Visualize idea clusters and relationships
- 🚀 **Innovation Tools**: Combine and expand ideas
- 📊 **Analytics Dashboard**: Track your innovation journey
- 🎤 **Voice Input**: Speech-to-text for idea capture
- 📱 **Responsive**: Works on desktop, tablet, and mobile

## Tech Stack

- **Framework**: React 18
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Visualization**: D3.js, Cytoscape.js
- **Icons**: Material Icons

## Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Backend server running

### Installation

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm start
   ```

The app will be available at `http://localhost:3000`

## Environment Variables

Copy `env.example` to `.env` and configure:

```env
# API Configuration
REACT_APP_API_BASE_URL=http://localhost:8000
REACT_APP_API_VERSION=v1

# Authentication
REACT_APP_AUTH_TOKEN_KEY=idea_hub_auth_token

# Feature Flags
REACT_APP_ENABLE_VOICE_INPUT=true
REACT_APP_ENABLE_IMAGE_UPLOAD=true
REACT_APP_ENABLE_VISUALIZATION=true

# Development
REACT_APP_DEBUG=true
```

## Available Scripts

- `npm start` - Start development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

## Project Structure

```
frontend/src/
├── components/
│   └── Navbar.js              # Navigation component
├── pages/
│   ├── Dashboard.js           # Main dashboard
│   ├── IdeaBank.js            # Idea management
│   ├── Clusters.js            # Cluster visualization
│   ├── Innovation.js          # Innovation tools
│   ├── Visualization.js       # Knowledge graph
│   ├── Settings.js            # User settings
│   ├── Login.js               # Login page
│   └── Register.js            # Registration page
├── services/
│   └── api.js                 # API client
├── utils/
│   └── helpers.js             # Utility functions
├── App.js                     # Main app component
├── index.js                   # Entry point
└── index.css                  # Global styles
```

## Components

### Dashboard
Main overview page with:
- Statistics cards
- Quick actions
- Recent activity
- Top novel ideas

### Idea Bank
Idea management interface:
- Create/edit ideas
- Search and filter
- Voice input
- File upload
- Novelty scoring

### Clusters
Cluster visualization:
- Generate clusters
- View cluster details
- Explore relationships
- Cluster management

### Innovation
Innovation tools:
- Combine ideas
- Expand ideas
- Generate suggestions
- View combinations/expansions

### Visualization
Knowledge graph visualization:
- Network graph
- Cluster view
- Timeline view
- Interactive exploration

### Settings
User preferences:
- Profile settings
- Feature toggles
- Privacy settings
- Data management

## Features

### Voice Input
Speech-to-text functionality for capturing ideas:
- Click microphone button
- Speak your idea
- Automatic transcription
- Language selection

### File Upload
Upload files as ideas:
- Text files
- Images (with OCR)
- Audio files (with transcription)
- Drag and drop support

### Smart Search
Semantic search across ideas:
- Natural language queries
- Similarity-based results
- Filter by novelty
- Tag-based filtering

### Responsive Design
Mobile-first responsive design:
- Collapsible navigation
- Touch-friendly interfaces
- Optimized layouts
- Progressive Web App features

## API Integration

The frontend communicates with the backend via REST API:

```javascript
// Example API call
import { api } from './services/api';

// Get user's ideas
const ideas = await api.get('/ideas');

// Create new idea
const newIdea = await api.post('/ideas', {
  title: 'My Idea',
  content: 'Idea description',
  tags: ['innovation', 'tech']
});

// Combine ideas
const combination = await api.post('/innovation/combine', {
  idea_ids: ['1', '2'],
  combination_type: 'creative'
});
```

## State Management

Currently using React's built-in state management:
- `useState` for component state
- `useEffect` for side effects
- Context API for global state (if needed)

For complex applications, consider adding:
- Redux Toolkit
- Zustand
- Jotai

## Styling

Using Material-UI (MUI) for consistent styling:
- Theme customization
- Responsive breakpoints
- Dark/light mode support
- Component variants

Custom styling in `index.css`:
- Global styles
- Utility classes
- Animation keyframes
- Custom scrollbars

## Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Bundle analysis
- Lazy loading components
- Memoization with React.memo

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch
```

## Building for Production

```bash
# Build optimized bundle
npm run build

# Serve production build locally
npx serve -s build
```

## Deployment

### Netlify
1. Connect repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Configure environment variables

### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Configure environment variables

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Troubleshooting

### Common Issues

1. **API Connection Error**
   - Check backend server is running
   - Verify API_BASE_URL in .env
   - Check CORS configuration

2. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Styling Issues**
   - Check Material-UI theme configuration
   - Verify CSS imports
   - Check for conflicting styles

4. **Performance Issues**
   - Enable React DevTools Profiler
   - Check bundle size with webpack-bundle-analyzer
   - Optimize images and assets

## License

This project is licensed under the MIT License.
