import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  AutoAwesome as InnovationIcon,
  Lightbulb as IdeaIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalIdeas: 0,
    totalClusters: 0,
    averageNovelty: 0,
    totalInnovations: 0,
    topNovelIdeas: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
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
      const totalIdeas = ideas.length;
      
      // Calculate average novelty score
      const noveltyScores = ideas
        .filter(idea => idea.novelty_score !== undefined && idea.novelty_score !== null)
        .map(idea => idea.novelty_score);
      const averageNovelty = noveltyScores.length > 0 
        ? noveltyScores.reduce((sum, score) => sum + score, 0) / noveltyScores.length 
        : 0;
      
      // Get top novel ideas (top 3)
      const topNovelIdeas = ideas
        .filter(idea => idea.novelty_score !== undefined && idea.novelty_score !== null)
        .sort((a, b) => b.novelty_score - a.novelty_score)
        .slice(0, 3)
        .map(idea => ({
          id: idea._id || idea.id,
          title: idea.title,
          novelty: idea.novelty_score
        }));
      
      // Process clusters data
      const clusters = Array.isArray(clustersResponse) ? clustersResponse : [];
      const totalClusters = clusters.length;
      
      // Process innovations data
      const innovations = Array.isArray(innovationsResponse) ? innovationsResponse : [];
      const totalInnovations = innovations.length;
      
      setStats({
        totalIdeas,
        totalClusters,
        averageNovelty,
        totalInnovations,
        topNovelIdeas,
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
      
      // Fallback to empty state
      setStats({
        totalIdeas: 0,
        totalClusters: 0,
        averageNovelty: 0,
        totalInnovations: 0,
        topNovelIdeas: [],
      });
    }
  };

  const StatCard = ({ title, value, icon, color = 'primary', onClick }) => (
    <Card 
      sx={{ 
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-4px)' } : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}.main`,
              color: 'white',
              p: 1,
              borderRadius: 2,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
      </CardContent>
    </Card>
  );

  const QuickActionCard = ({ title, description, icon, color, onClick }) => (
    <Card sx={{ cursor: 'pointer' }} onClick={onClick}>
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

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDashboardData}
        >
          Refresh
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Ideas"
            value={stats.totalIdeas}
            icon={<IdeaIcon />}
            color="primary"
            onClick={() => navigate('/ideas')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Clusters"
            value={stats.totalClusters}
            icon={<GroupIcon />}
            color="secondary"
            onClick={() => navigate('/clusters')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Novelty"
            value={(stats.averageNovelty * 100).toFixed(0) + '%'}
            icon={<TrendingUpIcon />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Innovations"
            value={stats.totalInnovations}
            icon={<InnovationIcon />}
            color="warning"
            onClick={() => navigate('/innovation-history')}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <QuickActionCard
                  title="Add Idea"
                  description="Capture a new thought or concept"
                  icon={<AddIcon />}
                  color="primary"
                  onClick={() => navigate('/ideas')}
                />
              </Grid>
              <Grid item xs={6}>
                <QuickActionCard
                  title="Combine Ideas"
                  description="Merge concepts for innovation"
                  icon={<InnovationIcon />}
                  color="secondary"
                  onClick={() => navigate('/innovation')}
                />
              </Grid>
              <Grid item xs={6}>
                <QuickActionCard
                  title="View Clusters"
                  description="Explore grouped ideas"
                  icon={<GroupIcon />}
                  color="success"
                  onClick={() => navigate('/clusters')}
                />
              </Grid>
              <Grid item xs={6}>
                <QuickActionCard
                  title="Visualization"
                  description="See idea connections"
                  icon={<TrendingUpIcon />}
                  color="warning"
                  onClick={() => navigate('/visualization')}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Top Novel Ideas */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Most Novel Ideas
            </Typography>
            {stats.topNovelIdeas.length > 0 ? (
              <List>
                {stats.topNovelIdeas.map((idea, index) => (
                  <ListItem
                    key={idea.id}
                    secondaryAction={
                      <Chip
                        label={`${(idea.novelty * 100).toFixed(0)}%`}
                        color={idea.novelty > 0.8 ? 'success' : idea.novelty > 0.6 ? 'warning' : 'default'}
                        size="small"
                      />
                    }
                  >
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={idea.title}
                      secondary={`Novelty Score: ${(idea.novelty * 100).toFixed(0)}%`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No ideas with novelty scores yet. Create some ideas to see them here!
              </Typography>
            )}
            <Button
              fullWidth
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => navigate('/ideas')}
            >
              View All Ideas
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            {stats.totalIdeas > 0 || stats.totalInnovations > 0 || stats.totalClusters > 0 ? (
              <List>
                {stats.totalInnovations > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <InnovationIcon color="secondary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Generated ${stats.totalInnovations} innovation${stats.totalInnovations !== 1 ? 's' : ''}`}
                      secondary="Visit Innovation History to see details"
                    />
                  </ListItem>
                )}
                {stats.totalClusters > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <GroupIcon color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Created ${stats.totalClusters} cluster${stats.totalClusters !== 1 ? 's' : ''}`}
                      secondary="Visit Clusters to explore grouped ideas"
                    />
                  </ListItem>
                )}
                {stats.totalIdeas > 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <IdeaIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Added ${stats.totalIdeas} idea${stats.totalIdeas !== 1 ? 's' : ''}`}
                      secondary="Visit Idea Bank to manage your ideas"
                    />
                  </ListItem>
                )}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No activity yet. Start by adding your first idea!
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
