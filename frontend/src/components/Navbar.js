/**
 * Navigation Sidebar Component
 * ===========================
 * 
 * This component provides the main navigation sidebar for the application.
 * It includes:
 * - Navigation menu items with icons
 * - User profile section
 * - Logout functionality
 * - Responsive design for mobile devices
 * - Active route highlighting
 * 
 * Features:
 * - Material-UI drawer with persistent sidebar
 * - Icon-based navigation with descriptive text
 * - User profile display with avatar
 * - Mobile-responsive with toggle functionality
 * - Route-based active state highlighting
 */

import React, { useState, useEffect } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Lightbulb as IdeaIcon,
  Group as ClusterIcon,
  AutoAwesome as InnovationIcon,
  History as InnovationHistoryIcon,
  AccountTree as VisualizationIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  ExitToApp as LogoutIcon,
  Menu as MenuIcon,
  LightMode as LightModeIcon,
  DarkMode as DarkModeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

/** Width of the sidebar drawer in pixels */
const drawerWidth = 240;

/**
 * Navigation menu items configuration
 * Each item includes display text, icon, and route path
 */
const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Idea Bank', icon: <IdeaIcon />, path: '/ideas' },
  { text: 'Clusters', icon: <ClusterIcon />, path: '/clusters' },
  { text: 'Innovation', icon: <InnovationIcon />, path: '/innovation' },
  { text: 'Innovation History', icon: <InnovationHistoryIcon />, path: '/innovation-history' },
  { text: 'Visualization', icon: <VisualizationIcon />, path: '/visualization' },
  { text: 'Help & Support', icon: <HelpIcon />, path: '/help' },
  { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

/**
 * Navigation Sidebar Component
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Callback function for logout action
 */
function Navbar({ onLogout }) {
  // =============================================================================
  // REACT HOOKS AND STATE
  // =============================================================================
  
  const navigate = useNavigate();        // Router navigation hook
  const location = useLocation();        // Current route location
  const [mobileOpen, setMobileOpen] = useState(false);  // Mobile drawer state
  const { themeMode, toggleTheme } = useTheme();  // Theme context
  
  // User data state with default values
  const [userData, setUserData] = useState({
    username: 'User',
    email: 'user@example.com',
    fullName: 'User'
  });

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { authAPI } = await import('../services/api');
        const user = await authAPI.getCurrentUser();
        setUserData({
          username: user.username || 'User',
          email: user.email || 'user@example.com',
          fullName: user.full_name || 'User'
        });
      } catch (error) {
        console.error('Failed to load user data:', error);
        // Keep default values if API fails
      }
    };

    loadUserData();
  }, []);

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          💡 Idea Hub
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Innovation Partner
        </Typography>
      </Box>

      <Divider />

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                  '& .MuiListItemIcon-root': {
                    color: 'white',
                  },
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* User Section */}
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', mr: 1 }}>
            {userData.username.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" fontWeight="medium">
              {userData.fullName || userData.username}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {userData.email}
            </Typography>
          </Box>
        </Box>
        
        {/* Theme Toggle Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <IconButton
            onClick={toggleTheme}
            sx={{
              bgcolor: 'background.paper',
              border: 1,
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
            title={themeMode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {themeMode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
          </IconButton>
        </Box>
        
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: 1,
            color: 'error.main',
            '&:hover': {
              backgroundColor: 'error.light',
              color: 'white',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile menu button */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ 
          position: 'fixed', 
          top: 16, 
          left: 16, 
          zIndex: 1300,
          display: { sm: 'none' },
          bgcolor: 'primary.main',
          color: 'white',
          '&:hover': {
            bgcolor: 'primary.dark',
          },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
        open
      >
        {drawer}
      </Drawer>
    </>
  );
}

export default Navbar;
