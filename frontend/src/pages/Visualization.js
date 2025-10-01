import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';

function Visualization() {
  const [visualizationType, setVisualizationType] = useState('clusters');
  const [loading, setLoading] = useState(true);
  const [graphData, setGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, [visualizationType]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      
      // Import API services
      const { ideasAPI, clustersAPI, innovationResultsAPI } = await import('../services/api');
      
      // Fetch all data in parallel
      const [ideasResponse, clustersResponse, innovationsResponse] = await Promise.all([
        ideasAPI.getIdeas(),
        clustersAPI.getClusters(),
        innovationResultsAPI.getResults()
      ]);
      
      // Process ideas data
      const ideas = Array.isArray(ideasResponse) ? ideasResponse : ideasResponse.ideas || [];
      
      // Process clusters data
      const clusters = Array.isArray(clustersResponse) ? clustersResponse : [];
      
      // Process innovations data
      const innovations = Array.isArray(innovationsResponse) ? innovationsResponse : [];
      
      // Build nodes array
      const nodes = [];
      const edges = [];
      
      // Add idea nodes
      ideas.forEach(idea => {
        nodes.push({
          id: idea._id || idea.id,
          label: idea.title,
          type: 'idea',
          novelty: idea.novelty_score || 0,
          cluster: null, // Will be set based on cluster membership
          created_at: idea.created_at
        });
      });
      
      // Add cluster nodes and create edges
      clusters.forEach(cluster => {
        const clusterNodeId = `cluster_${cluster._id || cluster.id}`;
        nodes.push({
          id: clusterNodeId,
          label: cluster.name,
          type: 'cluster',
          size: cluster.idea_count || cluster.ideas?.length || cluster.idea_ids?.length || 0,
          description: cluster.description
        });
        
        // Create edges from ideas to clusters
        if (cluster.ideas && cluster.ideas.length > 0) {
          cluster.ideas.forEach(idea => {
            edges.push({
              source: idea._id || idea.id,
              target: clusterNodeId,
              type: 'belongs_to'
            });
            
            // Update the idea node's cluster reference
            const ideaNode = nodes.find(n => n.id === (idea._id || idea.id));
            if (ideaNode) {
              ideaNode.cluster = clusterNodeId;
            }
          });
        }
      });
      
      // Add innovation nodes (combinations, expansions, suggestions)
      innovations.forEach(innovation => {
        const innovationNodeId = `innovation_${innovation._id || innovation.id}`;
        nodes.push({
          id: innovationNodeId,
          label: innovation.title,
          type: innovation.type,
          novelty: innovation.novelty_score || innovation.feasibility_score || 0,
          created_at: innovation.created_at
        });
        
        // Create edges from source ideas to innovations
        if (innovation.source_idea_ids && innovation.source_idea_ids.length > 0) {
          innovation.source_idea_ids.forEach(ideaId => {
            edges.push({
              source: ideaId,
              target: innovationNodeId,
              type: 'combined_into'
            });
          });
        } else if (innovation.source_idea_id) {
          edges.push({
            source: innovation.source_idea_id,
            target: innovationNodeId,
            type: 'expanded_from'
          });
        }
      });
      
      // Add similarity edges between ideas with similar novelty scores
      for (let i = 0; i < ideas.length; i++) {
        for (let j = i + 1; j < ideas.length; j++) {
          const idea1 = ideas[i];
          const idea2 = ideas[j];
          const novelty1 = idea1.novelty_score || 0;
          const novelty2 = idea2.novelty_score || 0;
          
          // Create similarity edge if novelty scores are close
          if (Math.abs(novelty1 - novelty2) < 0.2) {
            edges.push({
              source: idea1._id || idea1.id,
              target: idea2._id || idea2.id,
              type: 'similar'
            });
          }
        }
      }
      
      setGraphData({
        nodes,
        edges
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching graph data:', error);
      setLoading(false);
      
      // Set empty data on error
      setGraphData({
        nodes: [],
        edges: []
      });
    }
  };



  const renderClusterVisualization = () => {
    if (!graphData) return null;

    const clusters = graphData.nodes.filter(node => node.type === 'cluster');
    const ideas = graphData.nodes.filter(node => node.type === 'idea');

    if (clusters.length === 0) {
      return (
        <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
            No clusters found. Generate clusters from your ideas to see them here!
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        <Grid container spacing={3}>
          {clusters.map((cluster) => {
            // Find ideas that belong to this cluster
            const clusterIdeas = ideas.filter(idea => idea.cluster === cluster.id);
            
            return (
              <Grid item xs={12} md={6} key={cluster.id}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    {cluster.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {clusterIdeas.length} ideas in this cluster
                  </Typography>
                  
                  {cluster.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {cluster.description}
                    </Typography>
                  )}
                  
                  {clusterIdeas.length > 0 ? (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {clusterIdeas.map((idea) => (
                        <Chip
                          key={idea.id}
                          label={idea.label}
                          onClick={() => setSelectedNode(idea)}
                          color={selectedNode?.id === idea.id ? 'primary' : 'default'}
                          variant={selectedNode?.id === idea.id ? 'filled' : 'outlined'}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No ideas assigned to this cluster yet.
                    </Typography>
                  )}
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  const renderTimelineVisualization = () => {
    if (!graphData) return null;

    // Get all nodes with creation dates and sort by date
    const allNodes = graphData.nodes
      .filter(node => node.created_at)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    
    if (allNodes.length === 0) {
      return (
        <Box sx={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
            No items with creation dates found. Create some ideas and innovations to see the timeline!
          </Typography>
        </Box>
      );
    }
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Creation Timeline
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {allNodes.map((node, index) => (
            <Paper key={node.id} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  bgcolor: node.type === 'idea' ? 'primary.main' : 
                           node.type === 'combination' ? 'secondary.main' :
                           node.type === 'expansion' ? 'success.main' :
                           node.type === 'suggestions' ? 'warning.main' : 'info.main',
                }}
              />
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                <strong>{node.label}</strong> ({node.type})
              </Typography>
              {node.novelty > 0 && (
                <Chip
                  label={`${(node.novelty * 100).toFixed(0)}%`}
                  size="small"
                  color={node.novelty > 0.8 ? 'success' : node.novelty > 0.6 ? 'warning' : 'default'}
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {new Date(node.created_at).toLocaleDateString()}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Idea Visualization
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>View Type</InputLabel>
            <Select
              value={visualizationType}
              label="View Type"
              onChange={(e) => setVisualizationType(e.target.value)}
            >
              <MenuItem value="clusters">Cluster View</MenuItem>
              <MenuItem value="timeline">Timeline</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchGraphData}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Visualization Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            Visualization Controls
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Download">
              <IconButton size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>

      {/* Selected Node Details */}
      {selectedNode && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected: {selectedNode.label}
          </Typography>
          <Typography variant="body2">
            Type: {selectedNode.type} | 
            {selectedNode.novelty && ` Novelty: ${(selectedNode.novelty * 100).toFixed(0)}%`}
            {selectedNode.size && ` | Ideas: ${selectedNode.size}`}
          </Typography>
        </Alert>
      )}

      {/* Main Visualization Area */}
      {loading ? (
        <LinearProgress />
      ) : (
        <Paper sx={{ p: 3 }}>
          {visualizationType === 'clusters' && renderClusterVisualization()}
          {visualizationType === 'timeline' && renderTimelineVisualization()}
        </Paper>
      )}

      {/* Legend */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Graph Legend
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Node Types
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#1976d2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>💡</Typography>
                </Box>
                <Typography variant="caption">Ideas - Your original concepts</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#9c27b0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>⚡</Typography>
                </Box>
                <Typography variant="caption">Combinations - Merged ideas</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>📈</Typography>
                </Box>
                <Typography variant="caption">Expansions - Detailed developments</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#ff9800', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>💡</Typography>
                </Box>
                <Typography variant="caption">Suggestions - AI recommendations</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 20, height: 20, bgcolor: '#00bcd4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'white', fontSize: '10px' }}>●</Typography>
                </Box>
                <Typography variant="caption">Clusters - Grouped ideas</Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Connections & Scores
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 30, height: 3, bgcolor: '#4caf50' }} />
                <Typography variant="caption">Belongs to cluster</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 30, height: 3, bgcolor: '#9c27b0' }} />
                <Typography variant="caption">Combined into innovation</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 30, height: 3, bgcolor: '#ff9800', borderStyle: 'dashed', borderWidth: '2px' }} />
                <Typography variant="caption">Similar ideas</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#4caf50', borderRadius: '50%' }} />
                <Typography variant="caption">High novelty (80%+)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#ff9800', borderRadius: '50%' }} />
                <Typography variant="caption">Medium novelty (60-80%)</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 12, height: 12, bgcolor: '#f44336', borderRadius: '50%' }} />
                <Typography variant="caption">Low novelty (&lt;60%)</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default Visualization;
