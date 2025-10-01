import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  LinearProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Mic as MicIcon,
  Upload as UploadIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import VoiceRecorder from '../components/VoiceRecorder';

function IdeaBank() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingIdea, setEditingIdea] = useState(null);
  const [newIdea, setNewIdea] = useState({ title: '', content: '', tags: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);

  useEffect(() => {
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
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

  const handleAddIdea = () => {
    setNewIdea({ title: '', content: '', tags: [] });
    setEditingIdea(null);
    setOpenDialog(true);
  };

  const handleEditIdea = (idea) => {
    setEditingIdea(idea);
    setNewIdea({ ...idea, tags: idea.tags || [] });
    setOpenDialog(true);
  };

  const handleSaveIdea = async () => {
    try {
      if (!newIdea.title.trim() || !newIdea.content.trim()) {
        setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
        return;
      }

      const { ideasAPI } = await import('../services/api');
      
      if (editingIdea) {
        // Update existing idea
        const ideaId = editingIdea._id || editingIdea.id;
        const updatedIdea = await ideasAPI.updateIdea(ideaId, {
          title: newIdea.title,
          content: newIdea.content,
          tags: newIdea.tags,
        });
        setIdeas(ideas.map(idea => (idea._id || idea.id) === ideaId ? updatedIdea : idea));
        setSnackbar({ open: true, message: 'Idea updated successfully', severity: 'success' });
      } else {
        // Create new idea
        const createdIdea = await ideasAPI.createIdea({
          title: newIdea.title,
          content: newIdea.content,
          tags: newIdea.tags,
        });
        setIdeas([createdIdea, ...ideas]);
        setSnackbar({ open: true, message: 'Idea created successfully', severity: 'success' });
      }

      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving idea:', error);
      setSnackbar({ open: true, message: 'Error saving idea. Please try again.', severity: 'error' });
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (window.confirm('Are you sure you want to delete this idea?')) {
      try {
        const { ideasAPI } = await import('../services/api');
        await ideasAPI.deleteIdea(ideaId);
        setIdeas(ideas.filter(idea => idea.id !== ideaId));
        setSnackbar({ open: true, message: 'Idea deleted successfully', severity: 'success' });
      } catch (error) {
        console.error('Error deleting idea:', error);
        setSnackbar({ open: true, message: 'Error deleting idea. Please try again.', severity: 'error' });
      }
    }
  };

  const handleTagInput = (event) => {
    if (event.key === 'Enter' && event.target.value.trim()) {
      const newTag = event.target.value.trim();
      if (!newIdea.tags.includes(newTag)) {
        setNewIdea({ ...newIdea, tags: [...newIdea.tags, newTag] });
      }
      event.target.value = '';
    }
  };

  const removeTag = (tagToRemove) => {
    setNewIdea({ ...newIdea, tags: newIdea.tags.filter(tag => tag !== tagToRemove) });
  };

  const handleVoiceIdeaCreated = (newIdea) => {
    setIdeas(prev => [newIdea, ...prev]);
    setSnackbar({
      open: true,
      message: 'Voice idea created successfully!',
      severity: 'success'
    });
  };

  const handleOpenVoiceRecorder = () => {
    setVoiceRecorderOpen(true);
  };

  const handleCloseVoiceRecorder = () => {
    setVoiceRecorderOpen(false);
  };

  const filteredIdeas = ideas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'high-novelty' && idea.novelty_score > 0.8) ||
                         (selectedFilter === 'recent' && new Date(idea.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  const IdeaCard = ({ idea }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {idea.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${(idea.novelty_score * 100).toFixed(0)}%`}
              color={idea.novelty_score > 0.8 ? 'success' : idea.novelty_score > 0.6 ? 'warning' : 'default'}
              size="small"
            />
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {idea.content}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {idea.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" />
          ))}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {new Date(idea.created_at).toLocaleDateString()}
          </Typography>
          <Box>
            <IconButton size="small" onClick={() => handleEditIdea(idea)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => handleDeleteIdea(idea._id || idea.id)}>
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Idea Bank
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            onClick={fetchIdeas}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddIdea}
          >
            Add Idea
          </Button>
        </Box>
      </Box>

      {/* Search and Filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search ideas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
        />
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={(e) => setFilterAnchor(e.currentTarget)}
        >
          Filter
        </Button>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => { setSelectedFilter('all'); setFilterAnchor(null); }}>
          All Ideas
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('high-novelty'); setFilterAnchor(null); }}>
          High Novelty
        </MenuItem>
        <MenuItem onClick={() => { setSelectedFilter('recent'); setFilterAnchor(null); }}>
          Recent
        </MenuItem>
      </Menu>

      {/* Ideas Grid */}
      {loading ? (
        <LinearProgress />
      ) : filteredIdeas.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          minHeight: '300px',
          textAlign: 'center',
          gap: 2
        }}>
          <Typography variant="h6" color="text.secondary">
            {ideas.length === 0 ? 'No ideas yet' : 'No ideas match your search'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {ideas.length === 0 
              ? 'Start by adding your first idea!' 
              : 'Try adjusting your search or filter criteria'
            }
          </Typography>
          {ideas.length === 0 && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddIdea}
              sx={{ mt: 2 }}
            >
              Add Your First Idea
            </Button>
          )}
          <Button 
            variant="outlined" 
            onClick={fetchIdeas}
            sx={{ mt: 1 }}
          >
            Refresh
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredIdeas.map((idea) => (
            <Grid item xs={12} sm={6} md={4} key={idea._id || idea.id}>
              <IdeaCard idea={idea} />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Fab color="secondary" aria-label="voice" size="small" onClick={handleOpenVoiceRecorder}>
          <MicIcon />
        </Fab>
        <Fab color="primary" aria-label="add" onClick={handleAddIdea}>
          <AddIcon />
        </Fab>
        <Fab color="default" aria-label="upload" size="small">
          <UploadIcon />
        </Fab>
      </Box>

      {/* Add/Edit Idea Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingIdea ? 'Edit Idea' : 'Add New Idea'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            variant="outlined"
            value={newIdea.title}
            onChange={(e) => setNewIdea({ ...newIdea, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Content"
            fullWidth
            multiline
            rows={6}
            variant="outlined"
            value={newIdea.content}
            onChange={(e) => setNewIdea({ ...newIdea, content: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Tags (press Enter to add)"
            fullWidth
            variant="outlined"
            onKeyPress={handleTagInput}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {newIdea.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => removeTag(tag)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveIdea} variant="contained">
            {editingIdea ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Voice Recorder */}
      <VoiceRecorder
        open={voiceRecorderOpen}
        onClose={handleCloseVoiceRecorder}
        onIdeaCreated={handleVoiceIdeaCreated}
      />

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

export default IdeaBank;
