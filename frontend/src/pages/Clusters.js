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
  LinearProgress,
  Alert,
  Snackbar,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Group as ClusterIcon,
  Refresh as RefreshIcon,
  AutoAwesome as InnovationIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lightbulb as IdeaIcon,
} from '@mui/icons-material';

function Clusters() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchClusters();
  }, []);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const { clustersAPI } = await import('../services/api');
      const response = await clustersAPI.getClusters();
      const clustersList = Array.isArray(response) ? response : [];
      setClusters(clustersList);
    } catch (error) {
      setClusters([]);
    } finally {
      setLoading(false);
    }
  };

  const generateClusters = async () => {
    try {
      setGenerating(true);
      const { clustersAPI } = await import('../services/api');
      const response = await clustersAPI.generateClusters();
      setSnackbar({ open: true, message: 'Clusters generated successfully!', severity: 'success' });
      fetchClusters(); // Refresh clusters
    } catch (error) {
      setSnackbar({ open: true, message: 'Error generating clusters. Please try again.', severity: 'error' });
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCluster = async (clusterId) => {
    if (!window.confirm('Are you sure you want to delete this cluster? This action cannot be undone.')) {
      return;
    }

    try {
      const { clustersAPI } = await import('../services/api');
      await clustersAPI.deleteCluster(clusterId);
      setSnackbar({ open: true, message: 'Cluster deleted successfully!', severity: 'success' });
      fetchClusters(); // Refresh clusters
    } catch (error) {
      setSnackbar({ open: true, message: 'Error deleting cluster. Please try again.', severity: 'error' });
    }
  };

  const ClusterCard = ({ cluster }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
            {cluster.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={`${cluster.idea_count || cluster.idea_ids?.length || 0} ideas`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <IconButton size="small">
              <EditIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleDeleteCluster(cluster._id || cluster.id)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {cluster.description}
        </Typography>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Ideas in this cluster:
          </Typography>
          {(cluster.ideas || []).slice(0, 3).map((idea) => (
            <Box key={idea._id || idea.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <IdeaIcon fontSize="small" color="primary" />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                {idea.title}
              </Typography>
              <Chip
                label={`${(idea.novelty_score * 100).toFixed(0)}%`}
                size="small"
                color={idea.novelty_score > 0.8 ? 'success' : 'default'}
              />
            </Box>
          ))}
          {(cluster.ideas || []).length > 3 && (
            <Typography variant="caption" color="text.secondary">
              +{(cluster.ideas || []).length - 3} more ideas
            </Typography>
          )}
          {(cluster.ideas || []).length === 0 && (
            <Typography variant="caption" color="text.secondary">
              No ideas loaded yet
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Idea Clusters
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchClusters}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<InnovationIcon />}
            onClick={generateClusters}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate Clusters'}
          </Button>
        </Box>
      </Box>

      {generating && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Analyzing your ideas and creating clusters based on semantic similarity...
        </Alert>
      )}

      {/* Clusters Grid */}
      {loading ? (
        <LinearProgress />
      ) : clusters.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <ClusterIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No clusters found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Generate clusters to organize your ideas by similarity and theme.
          </Typography>
          <Button
            variant="contained"
            startIcon={<InnovationIcon />}
            onClick={generateClusters}
          >
            Generate Clusters
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {clusters.map((cluster) => (
              <Grid item xs={12} md={6} lg={4} key={cluster._id || cluster.id}>
                <ClusterCard cluster={cluster} />
              </Grid>
            ))}
          </Grid>

          {/* Detailed Cluster View */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cluster Details
            </Typography>
            {clusters.map((cluster) => (
              <Accordion key={cluster._id || cluster.id}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6">{cluster.name}</Typography>
                    <Chip label={`${cluster.idea_count || cluster.idea_ids?.length || 0} ideas`} size="small" color="primary" />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {cluster.description}
                  </Typography>
                  <List>
                    {cluster.ideas?.map((idea) => (
                      <ListItem key={idea._id || idea.id}>
                        <ListItemText
                          primary={idea.title}
                          secondary={idea.content}
                        />
                        <ListItemSecondaryAction>
                          <Chip
                            label={`${(idea.novelty_score * 100).toFixed(0)}% novelty`}
                            size="small"
                            color={idea.novelty_score > 0.8 ? 'success' : 'default'}
                          />
                        </ListItemSecondaryAction>
                      </ListItem>
                    )) || (
                      <ListItem>
                        <ListItemText
                          primary="No ideas loaded"
                          secondary="Ideas will be loaded when you view the cluster details"
                        />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Paper>
        </>
      )}

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

export default Clusters;
