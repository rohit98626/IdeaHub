import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  LinearProgress,
  Alert,
  Snackbar,
  Divider,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as InnovationIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Star as StarIcon,
  Lightbulb as IdeaIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

function Innovation() {
  const [ideas, setIdeas] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [expansions, setExpansions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [combineDialogOpen, setCombineDialogOpen] = useState(false);
  const [expandDialogOpen, setExpandDialogOpen] = useState(false);
  const [selectedIdeas, setSelectedIdeas] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [combinationType, setCombinationType] = useState('creative');
  const [expansionType, setExpansionType] = useState('comprehensive');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { ideasAPI } = await import('../services/api');
      const response = await ideasAPI.getIdeas();
      const ideasList = Array.isArray(response) ? response : [];
      setIdeas(ideasList);
    } catch (error) {
      setIdeas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleIdeaSelect = (ideaId, isSelected) => {
    if (isSelected) {
      setSelectedIdeas([...selectedIdeas, ideaId]);
    } else {
      setSelectedIdeas(selectedIdeas.filter(id => id !== ideaId));
    }
  };

  const handleCombineIdeas = async () => {
    try {
      if (selectedIdeas.length < 2) {
        setSnackbar({ open: true, message: 'Please select at least 2 ideas', severity: 'error' });
        return;
      }

      console.log('Combining ideas:', selectedIdeas, 'Type:', combinationType);
      const { innovationAPI } = await import('../services/api');
      const response = await innovationAPI.combineIdeas(selectedIdeas, combinationType);
      console.log('Combine ideas response:', response);
      
      // Extract data from nested response structure
      const result = response.result || response;
      console.log('Extracted result:', result);
      
      setGeneratedContent({
        type: 'combination',
        content: result.combined_content || result.content || 'No content generated',
        novelty_score: result.novelty_score || 0.5,
        expansion_suggestions: result.expansion_suggestions || [],
      });
      setCombineDialogOpen(false);
      setSelectedIdeas([]);
      setSnackbar({ open: true, message: 'Ideas combined successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error combining ideas:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Error combining ideas. Please try again.', severity: 'error' });
    }
  };

  const handleExpandIdea = async () => {
    try {
      if (!selectedIdea) {
        setSnackbar({ open: true, message: 'Please select an idea to expand', severity: 'error' });
        return;
      }

      console.log('Expanding idea:', selectedIdea, 'Type:', expansionType);
      const { innovationAPI } = await import('../services/api');
      const response = await innovationAPI.expandIdea(selectedIdea, expansionType);
      console.log('Expand idea response:', response);
      
      // Extract data from nested response structure
      const result = response.result || response;
      console.log('Extracted result:', result);
      
      const idea = ideas.find(i => (i._id || i.id) === selectedIdea);
      setGeneratedContent({
        type: 'expansion',
        content: result.expanded_content || result.content || 'No content generated',
        feasibility_score: result.feasibility_score || 0.5,
        source_idea: idea,
      });
      setExpandDialogOpen(false);
      setSelectedIdea(null);
      setSnackbar({ open: true, message: 'Idea expanded successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error expanding idea:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Error expanding idea. Please try again.', severity: 'error' });
    }
  };

  const handleGenerateSuggestions = async () => {
    try {
      if (ideas.length === 0) {
        setSnackbar({ open: true, message: 'No ideas available for suggestions', severity: 'error' });
        return;
      }

      console.log('Generating suggestions for all ideas...');
      const { innovationAPI } = await import('../services/api');
      
      // Get suggestions for the first idea (you can modify this logic)
      const firstIdea = ideas[0];
      const response = await innovationAPI.getExpansionSuggestions(firstIdea._id || firstIdea.id);
      console.log('Suggestions response:', response);
      
      // Handle suggestions response structure
      const suggestions = response.suggestions || [];
      const suggestionsText = suggestions.map(s => 
        typeof s === 'string' ? s : s.suggestion || 'General suggestion'
      ).join('\n\n');
      
      setGeneratedContent({
        type: 'suggestions',
        content: `AI-Powered Suggestions for: ${firstIdea.title}\n\n${suggestionsText || 'No specific suggestions available.'}`,
        feasibility_score: 0.85,
        source_idea: firstIdea,
      });
      setSnackbar({ open: true, message: 'Suggestions generated successfully!', severity: 'success' });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      console.error('Error details:', error.response?.data || error.message);
      setSnackbar({ open: true, message: 'Error generating suggestions. Please try again.', severity: 'error' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!generatedContent || !generatedContent.saved_result) {
      setSnackbar({ open: true, message: 'No saved result to download', severity: 'error' });
      return;
    }

    try {
      const { innovationResultsAPI } = await import('../services/api');
      const resultId = generatedContent.saved_result._id || generatedContent.saved_result.id;
      
      console.log('Downloading PDF for result:', resultId);
      const pdfBlob = await innovationResultsAPI.downloadPDF(resultId);
      
      // Create download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const type = generatedContent.type || 'innovation';
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

  const InnovationCard = ({ title, description, icon, color, onClick, disabled = false }) => (
    <Card 
      sx={{ 
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'transform 0.2s',
        '&:hover': disabled ? {} : { transform: 'translateY(-4px)' },
      }}
      onClick={disabled ? undefined : onClick}
    >
      <CardContent sx={{ textAlign: 'center', p: 3 }}>
        <Box
          sx={{
            bgcolor: `${color}.main`,
            color: 'white',
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Innovation Engine
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
        >
          Refresh
        </Button>
      </Box>

      {/* Innovation Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <InnovationCard
            title="Combine Ideas"
            description="Merge multiple concepts to create hybrid innovations"
            icon={<InnovationIcon />}
            color="primary"
            onClick={() => setCombineDialogOpen(true)}
            disabled={ideas.length < 2}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InnovationCard
            title="Expand Idea"
            description="Transform raw concepts into detailed project proposals"
            icon={<TrendingUpIcon />}
            color="secondary"
            onClick={() => setExpandDialogOpen(true)}
            disabled={ideas.length < 1}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <InnovationCard
            title="Generate Suggestions"
            description="Get AI-powered recommendations for idea development"
            icon={<StarIcon />}
            color="success"
            onClick={handleGenerateSuggestions}
            disabled={ideas.length === 0}
          />
        </Grid>
      </Grid>

      {/* Generated Content Display */}
      {generatedContent && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              {generatedContent.type === 'combination' ? 'Generated Combination' : 'Generated Expansion'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label={`${generatedContent.type === 'combination' ? 'Novelty' : 'Feasibility'}: ${((generatedContent.novelty_score || generatedContent.feasibility_score || 0.5) * 100).toFixed(0)}%`}
                color={generatedContent.type === 'combination' ? 'primary' : 'secondary'}
              />
              <Tooltip title="Download PDF">
                <IconButton onClick={handleDownloadPDF} color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              <IconButton onClick={() => setGeneratedContent(null)}>
                <CheckCircleIcon />
              </IconButton>
            </Box>
          </Box>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line', mb: 2 }}>
            {generatedContent.content}
          </Typography>
          
          {generatedContent.expansion_suggestions && generatedContent.expansion_suggestions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Expansion Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {generatedContent.expansion_suggestions.map((suggestion, index) => (
                  <Chip 
                    key={index} 
                    label={typeof suggestion === 'string' ? suggestion : suggestion.suggestion || suggestion} 
                    variant="outlined" 
                  />
                ))}
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {/* Combine Ideas Dialog */}
      <Dialog open={combineDialogOpen} onClose={() => setCombineDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Combine Ideas</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select 2 or more ideas to combine into a hybrid innovation:
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Combination Type</InputLabel>
            <Select
              value={combinationType}
              label="Combination Type"
              onChange={(e) => setCombinationType(e.target.value)}
            >
              <MenuItem value="creative">Creative</MenuItem>
              <MenuItem value="practical">Practical</MenuItem>
              <MenuItem value="innovative">Innovative</MenuItem>
            </Select>
          </FormControl>

          <List>
            {ideas.map((idea) => (
              <ListItem key={idea._id || idea.id}>
                <Checkbox
                  checked={selectedIdeas.includes(idea._id || idea.id)}
                  onChange={(e) => handleIdeaSelect(idea._id || idea.id, e.target.checked)}
                />
                <ListItemText
                  primary={idea.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {idea.content}
                      </Typography>
                      <Chip
                        label={`${(idea.novelty_score * 100).toFixed(0)}% novelty`}
                        size="small"
                        color={idea.novelty_score > 0.8 ? 'success' : 'default'}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCombineDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCombineIdeas} 
            variant="contained"
            disabled={selectedIdeas.length < 2}
          >
            Combine Ideas
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expand Idea Dialog */}
      <Dialog open={expandDialogOpen} onClose={() => setExpandDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Expand Idea</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select an idea to expand into a detailed project proposal:
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Expansion Type</InputLabel>
            <Select
              value={expansionType}
              label="Expansion Type"
              onChange={(e) => setExpansionType(e.target.value)}
            >
              <MenuItem value="comprehensive">Comprehensive</MenuItem>
              <MenuItem value="mobile_app">Mobile App</MenuItem>
              <MenuItem value="research_paper">Research Paper</MenuItem>
              <MenuItem value="startup">Startup</MenuItem>
            </Select>
          </FormControl>

          <List>
            {ideas.map((idea) => (
              <ListItem key={idea._id || idea.id}>
                <Checkbox
                  checked={selectedIdea === (idea._id || idea.id)}
                  onChange={(e) => setSelectedIdea(e.target.checked ? (idea._id || idea.id) : null)}
                />
                <ListItemText
                  primary={idea.title}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {idea.content}
                      </Typography>
                      <Chip
                        label={`${(idea.novelty_score * 100).toFixed(0)}% novelty`}
                        size="small"
                        color={idea.novelty_score > 0.8 ? 'success' : 'default'}
                      />
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpandDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleExpandIdea} 
            variant="contained"
            disabled={!selectedIdea}
          >
            Expand Idea
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

export default Innovation;
