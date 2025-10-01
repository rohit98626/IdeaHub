import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Snackbar,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
  ContactMail as ContactIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Send as SendIcon,
  QuestionAnswer as FAQIcon,
  Support as SupportIcon,
  BugReport as BugIcon,
  Feedback as FeedbackIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

function Help() {
  const { themeMode, language } = useTheme();
  const { getTranslation } = useLanguage();
  
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    type: 'general'
  });
  const [sending, setSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const handleContactFormChange = (field, value) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmitContact = async () => {
    try {
      setSending(true);
      
      // Simulate API call - replace with actual contact API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSnackbar({
        open: true,
        message: getTranslation('thank_you_message', language),
        severity: 'success'
      });
      
      setContactForm({
        name: '',
        email: '',
        subject: '',
        message: '',
        type: 'general'
      });
      setContactDialogOpen(false);
    } catch (error) {
      setSnackbar({
        open: true,
        message: getTranslation('failed_to_send', language),
        severity: 'error'
      });
    } finally {
      setSending(false);
    }
  };

  const faqData = [
    {
      question: 'How do I create my first idea?',
      answer: 'To create your first idea, go to the Ideas page and click the "Create New Idea" button. You can add a title, description, and tags to organize your thoughts.'
    },
    {
      question: 'What is clustering and how does it work?',
      answer: 'Clustering automatically groups similar ideas together based on their content and themes. This helps you discover patterns and connections between your ideas.'
    },
    {
      question: 'How do I use the AI innovation features?',
      answer: 'The innovation features allow you to combine multiple ideas or expand on existing ones using AI. Go to the Innovation page to try combining ideas or expanding individual concepts.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Go to Settings → Data Management → Export My Data. You can choose what to include and export in JSON or CSV format.'
    },
    {
      question: 'How do I change my password?',
      answer: 'Go to Settings → Security → Change Password. You\'ll need to enter your current password and then your new password.'
    },
    {
      question: 'What API keys do I need?',
      answer: 'You need a Gemini API key for AI-powered features. Get one from Google AI Studio and add it in Settings → API Configuration.'
    },
    {
      question: 'How do I enable dark mode?',
      answer: 'You can toggle dark mode using the theme button in the sidebar, or go to Settings → Preferences → Theme and select Dark mode.'
    },
    {
      question: 'Can I use the app in different languages?',
      answer: 'Yes! Go to Settings → Preferences → Language to choose from English, Hindi, Spanish, French, or German.'
    }
  ];

  const contactMethods = [
    {
      icon: <EmailIcon />,
      title: 'Email Support',
      description: 'Get help via email',
      contact: 'support@ideahub.com',
      action: 'Send Email'
    },
    {
      icon: <PhoneIcon />,
      title: 'Phone Support',
      description: 'Call us for immediate assistance',
      contact: '+91 7357707100',
      action: 'Call Now'
    },
    {
      icon: <LocationIcon />,
      title: 'Office Address',
      description: 'Visit our office',
      contact: '24/7 panchvati colony, vadodara, gujarat, india',
      action: 'Get Directions'
    }
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <HelpIcon />
        {getTranslation('help_support', language)}
      </Typography>

      <Grid container spacing={3}>
        {/* Quick Help Section */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FAQIcon />
                {getTranslation('frequently_asked_questions', language)}
              </Typography>
              
              {faqData.map((faq, index) => (
                <Accordion key={index} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Methods */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ContactIcon />
                {getTranslation('contact_us', language)}
              </Typography>
              
              {contactMethods.map((method, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <ListItemIcon sx={{ minWidth: 'auto', mr: 1 }}>
                      {method.icon}
                    </ListItemIcon>
                    <Typography variant="subtitle2" fontWeight="medium">
                      {method.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {method.description}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {method.contact}
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      if (method.title === 'Email Support') {
                        window.location.href = `mailto:${method.contact}`;
                      } else if (method.title === 'Phone Support') {
                        window.location.href = `tel:${method.contact}`;
                      }
                    }}
                  >
                    {method.action}
                  </Button>
                  {index < contactMethods.length - 1 && <Divider sx={{ mt: 2 }} />}
                </Box>
              ))}
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<SendIcon />}
                onClick={() => setContactDialogOpen(true)}
                sx={{ mt: 2 }}
              >
                {getTranslation('send_message', language)}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Getting Started Guide */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SupportIcon />
                Getting Started Guide
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      1. Create Ideas
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Start by adding your ideas with titles, descriptions, and tags to organize your thoughts.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="secondary" gutterBottom>
                      2. Generate Clusters
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Use the clustering feature to automatically group similar ideas and discover patterns.
                    </Typography>
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main" gutterBottom>
                      3. Innovate
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Combine ideas or expand existing ones using AI-powered innovation tools.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Feature Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <BugIcon />
                Feature Overview
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <HelpIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Idea Management
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create, edit, and organize your ideas with tags and categories.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <BugIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      AI Clustering
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically group similar ideas using machine learning.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <FeedbackIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Innovation Tools
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Combine and expand ideas with AI-powered creativity tools.
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ textAlign: 'center', p: 2 }}>
                    <SupportIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Data Export
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Export your ideas and data in multiple formats for backup.
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Contact Form Dialog */}
      <Dialog open={contactDialogOpen} onClose={() => setContactDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ContactIcon />
            {getTranslation('contact_us', language)}
          </Box>
          <IconButton onClick={() => setContactDialogOpen(false)}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={getTranslation('your_name', language)}
                value={contactForm.name}
                onChange={(e) => handleContactFormChange('name', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={getTranslation('email_address', language)}
                type="email"
                value={contactForm.email}
                onChange={(e) => handleContactFormChange('email', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={getTranslation('subject', language)}
                value={contactForm.subject}
                onChange={(e) => handleContactFormChange('subject', e.target.value)}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={getTranslation('message_type', language)}
                select
                value={contactForm.type}
                onChange={(e) => handleContactFormChange('type', e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="general">{getTranslation('general_question', language)}</option>
                <option value="bug">{getTranslation('bug_report', language)}</option>
                <option value="feature">{getTranslation('feature_request', language)}</option>
                <option value="support">{getTranslation('technical_support', language)}</option>
                <option value="feedback">{getTranslation('feedback', language)}</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={getTranslation('message', language)}
                multiline
                rows={4}
                value={contactForm.message}
                onChange={(e) => handleContactFormChange('message', e.target.value)}
                required
                placeholder="Please describe your question or issue in detail..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setContactDialogOpen(false)}>
            {getTranslation('cancel', language)}
          </Button>
          <Button
            onClick={handleSubmitContact}
            variant="contained"
            disabled={sending || !contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message}
            startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {sending ? getTranslation('sending', language) : getTranslation('send_message', language)}
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

export default Help;
