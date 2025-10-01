/**
 * Idea Innovation Hub - Main App Component
 * =======================================
 * 
 * This is the root component that orchestrates the entire React application.
 * It handles:
 * - Authentication state management
 * - Routing between different pages
 * - Theme configuration with Material-UI
 * - Layout structure with sidebar navigation
 * - Protected routes (requires authentication)
 * 
 * Application Structure:
 * - Unauthenticated users: Login/Register pages only
 * - Authenticated users: Full application with sidebar navigation
 * - Responsive design with Material-UI components
 * - Token-based authentication with localStorage persistence
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CssBaseline from '@mui/material/CssBaseline';
import { Box } from '@mui/material';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Import page components
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import IdeaBank from './pages/IdeaBank';
import Clusters from './pages/Clusters';
import Innovation from './pages/Innovation';
import InnovationHistory from './pages/InnovationHistory';
import Visualization from './pages/Visualization';
import Help from './pages/Help';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';


/**
 * Main App Component
 * 
 * This component manages the entire application state and routing.
 * It handles authentication, theme, and layout for all pages.
 */
function App() {
  // Authentication state
  const [user, setUser] = React.useState(null);      // Current user data
  const [loading, setLoading] = React.useState(true); // Loading state

  /**
   * Check authentication status on app startup
   * Looks for stored JWT token in localStorage
   */
  React.useEffect(() => {
    // Check if user has a valid token stored
    const token = localStorage.getItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token');
    if (token) {
      // TODO: Validate token with backend API
      // For now, just set user if token exists
      setUser({ token });
    }
    setLoading(false);  // Finished loading
  }, []);

  /**
   * Handle user login
   * Stores authentication token and updates user state
   */
  const handleLogin = (userData) => {
    setUser(userData);
    // Persist token to localStorage for future sessions
    localStorage.setItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token', userData.token);
  };

  /**
   * Handle user logout
   * Clears authentication state and stored token
   */
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token');
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <CustomThemeProvider>
        <LanguageProvider>
          <CssBaseline />
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
            <div>Loading...</div>
          </Box>
        </LanguageProvider>
      </CustomThemeProvider>
    );
  }

  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <CssBaseline />
        <Router>
        {user ? (
          // =============================================================================
          // AUTHENTICATED USER LAYOUT
          // =============================================================================
          <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar Navigation */}
            <Navbar onLogout={handleLogout} />
            
            {/* Main Content Area */}
            <Box component="main" sx={{ flexGrow: 1, p: 3, ml: '240px' }}>
              <Routes>
                {/* Redirect root to dashboard */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                
                {/* Protected Routes - All pages require authentication */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ideas" element={<IdeaBank />} />
                <Route path="/clusters" element={<Clusters />} />
                <Route path="/innovation" element={<Innovation />} />
                <Route path="/innovation-history" element={<InnovationHistory />} />
                <Route path="/visualization" element={<Visualization />} />
                <Route path="/help" element={<Help />} />
                <Route path="/settings" element={<Settings />} />
                
                {/* Catch-all route - redirect to dashboard */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Box>
          </Box>
        ) : (
          // =============================================================================
          // UNAUTHENTICATED USER LAYOUT
          // =============================================================================
          <Routes>
            {/* Public Routes - No authentication required */}
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="/register" element={<Register onLogin={handleLogin} />} />
            
            {/* Catch-all route - redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
        </Router>
      </LanguageProvider>
    </CustomThemeProvider>
  );
}

export default App;
