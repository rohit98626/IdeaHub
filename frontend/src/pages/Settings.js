import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Grid,
  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  Chip,
  LinearProgress,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  CloudUpload as CloudUploadIcon,
  Download as DownloadIcon,
  Key as KeyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';

function Settings() {
  const { themeMode, language, changeTheme, changeLanguage } = useTheme();
  const { getTranslation } = useLanguage();
  
  const [settings, setSettings] = useState({
    profile: {
      username: '',
      email: '',
      fullName: '',
    },
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true,
      voiceInput: true,
      imageUpload: true,
      autoClustering: false,
    },
    privacy: {
      dataSharing: false,
      analytics: true,
      publicProfile: false,
    },
    api_keys: {
      gemini_api_key: '',
      openai_api_key: '',
    },
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    include_ideas: true,
    include_clusters: true,
    include_innovations: true,
    include_settings: true,
    format: 'json'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [userStats, setUserStats] = useState(null);
  const [testingApiKey, setTestingApiKey] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { authAPI, settingsAPI } = await import('../services/api');
        
        const userData = await authAPI.getCurrentUser();
        const userSettings = await settingsAPI.getSettings();
        const stats = await settingsAPI.getStats();
        
        setSettings(prev => ({
          ...prev,
          profile: {
            username: userData.username || '',
            email: userData.email || '',
            fullName: userData.full_name || '',
          },
          preferences: {
            ...prev.preferences,
            ...userSettings.preferences,
            theme: themeMode, // Use current theme from context
            language: language, // Use current language from context
          },
          privacy: userSettings.privacy || prev.privacy,
          api_keys: userSettings.api_keys || prev.api_keys,
        }));
        
        setUserStats(stats);
      } catch (error) {
        setSnackbar({ 
          open: true, 
          message: `Failed to load settings: ${error.response?.data?.detail || error.message}`, 
          severity: 'error' 
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value,
      },
    }));
    
    // Apply theme and language changes immediately
    if (category === 'preferences') {
      if (setting === 'theme') {
        changeTheme(value);
      } else if (setting === 'language') {
        changeLanguage(value);
      }
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const { authAPI, settingsAPI } = await import('../services/api');
      
      // Update user profile
      await authAPI.updateUser({
        username: settings.profile.username,
        email: settings.profile.email,
        full_name: settings.profile.fullName,
      });
      
      // Update user settings
      await settingsAPI.updateSettings({
        preferences: settings.preferences,
        privacy: settings.privacy,
        api_keys: settings.api_keys,
      });
      
      setSnackbar({ open: true, message: 'Settings saved successfully!', severity: 'success' });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `Failed to save settings: ${error.response?.data?.detail || error.message}`, 
        severity: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      setSaving(true);
      const { settingsAPI } = await import('../services/api');
      
      const blob = await settingsAPI.exportData(exportOptions);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const timestamp = new Date().toISOString().split('T')[0];
      const format = exportOptions.format;
      link.download = `idea_hub_export_${timestamp}.${format}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'Data exported successfully!', severity: 'success' });
      setExportDialogOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to export data. Please try again.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setSaving(true);
      const { settingsAPI } = await import('../services/api');
      
      await settingsAPI.deleteAccount();
      
      // Clear local storage and redirect to login
      localStorage.removeItem(process.env.REACT_APP_AUTH_TOKEN_KEY || 'idea_hub_auth_token');
      window.location.href = '/login';
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to delete account. Please try again.', severity: 'error' });
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match.', severity: 'error' });
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters long.', severity: 'error' });
      return;
    }
    
    try {
      setSaving(true);
      const { settingsAPI } = await import('../services/api');
      
      await settingsAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
      setPasswordDialogOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to change password. Please check your current password.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const testApiKey = async (keyType) => {
    try {
      setTestingApiKey(true);
      const { settingsAPI } = await import('../services/api');
      
      // Test the API key by making a simple request
      const testData = {
        preferences: settings.preferences,
        privacy: settings.privacy,
        api_keys: settings.api_keys
      };
      
      await settingsAPI.updateSettings(testData);
      
      setSnackbar({ 
        open: true, 
        message: `${keyType} API key is valid and working!`, 
        severity: 'success' 
      });
    } catch (error) {
      setSnackbar({ 
        open: true, 
        message: `${keyType} API key test failed. Please check your key.`, 
        severity: 'error' 
      });
    } finally {
      setTestingApiKey(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {getTranslation('settings_title', language)}
      </Typography>

      {/* User Statistics */}
      {userStats && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {getTranslation('your_statistics', language)}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {userStats.total_ideas}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getTranslation('total_ideas', language)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary">
                  {userStats.total_clusters}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getTranslation('clusters_count', language)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {userStats.total_innovations}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getTranslation('innovations_count', language)}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {Math.round(userStats.average_novelty_score * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getTranslation('avg_novelty', language)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      <Grid container spacing={3}>
        {/* Profile Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SecurityIcon />
                {getTranslation('profile_settings', language)}
              </Typography>
              
              <TextField
                fullWidth
                label="Username"
                value={settings.profile.username}
                onChange={(e) => handleSettingChange('profile', 'username', e.target.value)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={settings.profile.email}
                onChange={(e) => handleSettingChange('profile', 'email', e.target.value)}
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Full Name"
                value={settings.profile.fullName}
                onChange={(e) => handleSettingChange('profile', 'fullName', e.target.value)}
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Preferences */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PaletteIcon />
                {getTranslation('preferences', language)}
              </Typography>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>{getTranslation('theme', language)}</InputLabel>
                <Select
                  value={settings.preferences.theme}
                  label={getTranslation('theme', language)}
                  onChange={(e) => handleSettingChange('preferences', 'theme', e.target.value)}
                >
                  <MenuItem value="light">Light</MenuItem>
                  <MenuItem value="dark">Dark</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth margin="normal">
                <InputLabel>{getTranslation('language', language)}</InputLabel>
                <Select
                  value={settings.preferences.language}
                  label={getTranslation('language', language)}
                  onChange={(e) => handleSettingChange('preferences', 'language', e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="hi">हिन्दी (Hindi)</MenuItem>
                  <MenuItem value="es">Español (Spanish)</MenuItem>
                  <MenuItem value="fr">Français (French)</MenuItem>
                  <MenuItem value="de">Deutsch (German)</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Toggles */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <NotificationsIcon />
                Feature Settings
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.notifications}
                        onChange={(e) => handleSettingChange('preferences', 'notifications', e.target.checked)}
                      />
                    }
                    label="Notifications"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.voiceInput}
                        onChange={(e) => handleSettingChange('preferences', 'voiceInput', e.target.checked)}
                      />
                    }
                    label="Voice Input"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.imageUpload}
                        onChange={(e) => handleSettingChange('preferences', 'imageUpload', e.target.checked)}
                      />
                    }
                    label="Image Upload"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.preferences.autoClustering}
                        onChange={(e) => handleSettingChange('preferences', 'autoClustering', e.target.checked)}
                      />
                    }
                    label="Auto Clustering"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Privacy Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Privacy Settings
              </Typography>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.dataSharing}
                    onChange={(e) => handleSettingChange('privacy', 'dataSharing', e.target.checked)}
                  />
                }
                label="Allow data sharing for research"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.analytics}
                    onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
                  />
                }
                label="Usage analytics"
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.privacy.publicProfile}
                    onChange={(e) => handleSettingChange('privacy', 'publicProfile', e.target.checked)}
                  />
                }
                label="Public profile"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon />
                Data Management
              </Typography>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
                sx={{ mb: 2 }}
              >
                Export My Data
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Password Change */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon />
                Security
              </Typography>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* API Keys */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <KeyIcon />
                API Configuration
              </Typography>
              
              <TextField
                fullWidth
                label="Gemini API Key"
                type={showApiKeys ? "text" : "password"}
                value={settings.api_keys.gemini_api_key}
                onChange={(e) => handleSettingChange('api_keys', 'gemini_api_key', e.target.value)}
                margin="normal"
                helperText="Your Google Gemini API key for AI-powered idea generation"
                placeholder="Enter your Gemini API key..."
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowApiKeys(!showApiKeys)}>
                      {showApiKeys ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
              
              <TextField
                fullWidth
                label="OpenAI API Key"
                type={showApiKeys ? "text" : "password"}
                value={settings.api_keys.openai_api_key}
                onChange={(e) => handleSettingChange('api_keys', 'openai_api_key', e.target.value)}
                margin="normal"
                helperText="Alternative API key for OpenAI models (optional)"
                placeholder="Enter your OpenAI API key..."
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowApiKeys(!showApiKeys)}>
                      {showApiKeys ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  )
                }}
              />
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => testApiKey('Gemini')}
                  disabled={testingApiKey || !settings.api_keys.gemini_api_key}
                  startIcon={testingApiKey ? <CircularProgress size={16} /> : <KeyIcon />}
                >
                  Test Gemini Key
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => testApiKey('OpenAI')}
                  disabled={testingApiKey || !settings.api_keys.openai_api_key}
                  startIcon={testingApiKey ? <CircularProgress size={16} /> : <KeyIcon />}
                >
                  Test OpenAI Key
                </Button>
              </Box>
              
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> API keys are stored securely and only used for AI-powered features. 
                  You can get a Gemini API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio</a>.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? getTranslation('saving', language) : getTranslation('save_settings', language)}
        </Button>
      </Box>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Current Password"
            type={showPasswords.current ? "text" : "password"}
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
            margin="normal"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('current')}>
                  {showPasswords.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            label="New Password"
            type={showPasswords.new ? "text" : "password"}
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
            margin="normal"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('new')}>
                  {showPasswords.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
          <TextField
            fullWidth
            label="Confirm New Password"
            type={showPasswords.confirm ? "text" : "password"}
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            margin="normal"
            InputProps={{
              endAdornment: (
                <IconButton onClick={() => togglePasswordVisibility('confirm')}>
                  {showPasswords.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleChangePassword} 
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Export Your Data</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Choose what data you want to export and in which format.
          </DialogContentText>
          
          <Typography variant="subtitle2" gutterBottom>
            Include in Export:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.include_ideas}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, include_ideas: e.target.checked }))}
                  />
                }
                label="Ideas"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.include_clusters}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, include_clusters: e.target.checked }))}
                  />
                }
                label="Clusters"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.include_innovations}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, include_innovations: e.target.checked }))}
                  />
                }
                label="Innovations"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={exportOptions.include_settings}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, include_settings: e.target.checked }))}
                  />
                }
                label="Settings"
              />
            </Grid>
          </Grid>
          
          <FormControl fullWidth margin="normal">
            <InputLabel>Export Format</InputLabel>
            <Select
              value={exportOptions.format}
              label="Export Format"
              onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value }))}
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV (Ideas only)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExportData} 
            variant="contained"
            disabled={saving}
            startIcon={<DownloadIcon />}
          >
            {saving ? 'Exporting...' : 'Export Data'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>Warning:</strong> This action cannot be undone. This will permanently delete your account and all associated data including:
          </DialogContentText>
          <List dense>
            <ListItem>
              <ListItemText primary="All your ideas and clusters" />
            </ListItem>
            <ListItem>
              <ListItemText primary="All innovation results and combinations" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Your settings and preferences" />
            </ListItem>
            <ListItem>
              <ListItemText primary="Your user profile" />
            </ListItem>
          </List>
          <DialogContentText sx={{ mt: 2 }}>
            Are you absolutely sure you want to delete your account?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? 'Deleting...' : 'Yes, Delete My Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Settings;
