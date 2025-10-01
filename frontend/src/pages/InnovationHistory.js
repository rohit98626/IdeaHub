import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Grid,
  Alert,
  Snackbar,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  AutoAwesome as InnovationIcon,
  Psychology as ExpandIcon,
  Lightbulb as SuggestIcon,
  Timeline as HistoryIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const InnovationHistory = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedResult, setSelectedResult] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const { innovationResultsAPI } = await import('../services/api');
      const data = await innovationResultsAPI.getResults();
      setResults(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching innovation results:', error);
      setSnackbar({ open: true, message: 'Error fetching innovation history', severity: 'error' });
      setLoading(false);
    }
  };

  const handleDeleteResult = async (resultId) => {
    if (!window.confirm('Are you sure you want to delete this innovation result?')) {
      return;
    }

    try {
      const { innovationResultsAPI } = await import('../services/api');
      await innovationResultsAPI.deleteResult(resultId);
      setSnackbar({ open: true, message: 'Innovation result deleted successfully!', severity: 'success' });
      fetchResults(); // Refresh the list
    } catch (error) {
      console.error('Error deleting innovation result:', error);
      setSnackbar({ open: true, message: 'Error deleting innovation result', severity: 'error' });
    }
  };

  const handleDownloadPDF = async (result) => {
    try {
      const { innovationResultsAPI } = await import('../services/api');
      const resultId = result._id || result.id;
      
      console.log('Downloading PDF for result:', resultId);
      const pdfBlob = await innovationResultsAPI.downloadPDF(resultId);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const type = result.type || 'innovation';
      link.download = `${type}_${timestamp}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'PDF downloaded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      setSnackbar({ open: true, message: 'Error downloading PDF. Please try again.', severity: 'error' });
    }
  };

  const handleViewResult = (result) => {
    setSelectedResult(result);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedResult(null);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'combination':
        return <InnovationIcon />;
      case 'expansion':
        return <ExpandIcon />;
      case 'suggestions':
        return <SuggestIcon />;
      default:
        return <HistoryIcon />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'combination':
        return 'primary';
      case 'expansion':
        return 'secondary';
      case 'suggestions':
        return 'success';
      default:
        return 'default';
    }
  };

  const filteredResults = results.filter(result => {
    switch (selectedTab) {
      case 0:
        return true; // All
      case 1:
        return result.type === 'combination';
      case 2:
        return result.type === 'expansion';
      case 3:
        return result.type === 'suggestions';
      default:
        return true;
    }
  });

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Innovation History
        </Typography>
        <Typography>Loading innovation history...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Innovation History
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {results.length} total innovations
        </Typography>
      </Box>

      <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)} sx={{ mb: 3 }}>
        <Tab label="All" />
        <Tab label="Combinations" />
        <Tab label="Expansions" />
        <Tab label="Suggestions" />
      </Tabs>

      {filteredResults.length === 0 ? (
        <Alert severity="info">
          No innovation results found. Try creating some combinations, expansions, or suggestions in the Innovation Engine!
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredResults.map((result) => (
            <Grid item xs={12} md={6} lg={4} key={result._id || result.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 1, color: `${getTypeColor(result.type)}.main` }}>
                      {getTypeIcon(result.type)}
                    </Box>
                    <Chip
                      label={result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                      color={getTypeColor(result.type)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="h6" gutterBottom>
                    {result.title}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {result.content.length > 150 
                      ? `${result.content.substring(0, 150)}...` 
                      : result.content
                    }
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(result.created_at)}
                    </Typography>
                    
                    {result.novelty_score && (
                      <Chip
                        label={`Novelty: ${(result.novelty_score * 100).toFixed(0)}%`}
                        color="primary"
                        size="small"
                      />
                    )}
                    {result.feasibility_score && (
                      <Chip
                        label={`Feasibility: ${(result.feasibility_score * 100).toFixed(0)}%`}
                        color="secondary"
                        size="small"
                      />
                    )}
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Tooltip title="Download PDF">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDownloadPDF(result)}
                        color="success"
                      >
                        <DownloadIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="View Details">
                      <IconButton 
                        size="small" 
                        onClick={() => handleViewResult(result)}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        size="small" 
                        onClick={() => handleDeleteResult(result._id || result.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getTypeIcon(selectedResult?.type)}
            <Typography variant="h6">{selectedResult?.title}</Typography>
            <Chip
              label={selectedResult?.type.charAt(0).toUpperCase() + selectedResult?.type.slice(1)}
              color={getTypeColor(selectedResult?.type)}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedResult && (
            <Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
                {selectedResult.content}
              </Typography>
              
              {(selectedResult.expansion_suggestions && selectedResult.expansion_suggestions.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Expansion Suggestions:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedResult.expansion_suggestions.map((suggestion, index) => (
                      <Chip 
                        key={index} 
                        label={typeof suggestion === 'string' ? suggestion : suggestion.suggestion || suggestion} 
                        variant="outlined" 
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {(selectedResult.suggestions && selectedResult.suggestions.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Suggestions:
                  </Typography>
                  {selectedResult.suggestions.map((suggestion, index) => (
                    <Box key={index} sx={{ mb: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="body2">{suggestion.suggestion}</Typography>
                      {suggestion.feasibility_score && (
                        <Chip
                          label={`Feasibility: ${(suggestion.feasibility_score * 100).toFixed(0)}%`}
                          color="secondary"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              )}

              <Typography variant="caption" color="text.secondary">
                Created: {formatDate(selectedResult.created_at)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => handleDownloadPDF(selectedResult)} 
            startIcon={<DownloadIcon />}
            color="primary"
          >
            Download PDF
          </Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default InnovationHistory;
