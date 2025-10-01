import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  CircularProgress,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Close as CloseIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { ideasAPI } from '../services/api';

const VoiceRecorder = ({ onIdeaCreated, open, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState(null);
  const [supportedLanguages, setSupportedLanguages] = useState({});
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [error, setError] = useState(null);
  const [title, setTitle] = useState('');
  const [tags, setTags] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (open) {
      loadSupportedLanguages();
      resetRecording();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
      }
    };
  }, [audioURL]);

  const loadSupportedLanguages = async () => {
    try {
      const response = await ideasAPI.getSupportedLanguages();
      setSupportedLanguages(response.languages);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    }
  };

  const resetRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    setTranscriptionResult(null);
    setError(null);
    setTitle('');
    setTags('');
    audioChunksRef.current = [];
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const transcribeAudio = async () => {
    if (!audioBlob) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const result = await ideasAPI.transcribeVoice(audioBlob, selectedLanguage);
      setTranscriptionResult(result);
      setTitle(result.suggested_title || '');
      
    } catch (error) {
      console.error('Transcription failed:', error);
      setError('Transcription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const createIdeaFromVoice = async () => {
    if (!audioBlob || !transcriptionResult) return;

    try {
      setIsProcessing(true);
      setError(null);
      
      const idea = await ideasAPI.createVoiceIdea(
        audioBlob,
        selectedLanguage,
        title,
        tags
      );
      
      if (onIdeaCreated) {
        onIdeaCreated(idea);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Failed to create idea:', error);
      setError('Failed to create idea. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MicIcon />
          Voice Idea Recorder
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Language Selection */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Language</InputLabel>
          <Select
            value={selectedLanguage}
            label="Language"
            onChange={(e) => setSelectedLanguage(e.target.value)}
            startAdornment={<LanguageIcon sx={{ mr: 1 }} />}
          >
            {Object.entries(supportedLanguages).map(([code, name]) => (
              <MenuItem key={code} value={code}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Recording Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {isRecording ? (isPaused ? 'Recording Paused' : 'Recording...') : 'Ready to Record'}
              </Typography>
              
              {isRecording && (
                <Typography variant="h4" color="primary" sx={{ mb: 2 }}>
                  {formatTime(recordingTime)}
                </Typography>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                {!isRecording ? (
                  <Tooltip title="Start Recording">
                    <IconButton
                      color="primary"
                      size="large"
                      onClick={startRecording}
                      sx={{ 
                        width: 80, 
                        height: 80,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          backgroundColor: 'primary.dark',
                        }
                      }}
                    >
                      <MicIcon sx={{ fontSize: 40 }} />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <>
                    {!isPaused ? (
                      <Tooltip title="Pause Recording">
                        <IconButton
                          color="warning"
                          size="large"
                          onClick={pauseRecording}
                          sx={{ 
                            width: 60, 
                            height: 60,
                            backgroundColor: 'warning.main',
                            color: 'white',
                          }}
                        >
                          <PauseIcon sx={{ fontSize: 30 }} />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Resume Recording">
                        <IconButton
                          color="success"
                          size="large"
                          onClick={resumeRecording}
                          sx={{ 
                            width: 60, 
                            height: 60,
                            backgroundColor: 'success.main',
                            color: 'white',
                          }}
                        >
                          <PlayIcon sx={{ fontSize: 30 }} />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="Stop Recording">
                      <IconButton
                        color="error"
                        size="large"
                        onClick={stopRecording}
                        sx={{ 
                          width: 60, 
                          height: 60,
                          backgroundColor: 'error.main',
                          color: 'white',
                        }}
                      >
                        <StopIcon sx={{ fontSize: 30 }} />
                      </IconButton>
                    </Tooltip>
                  </>
                )}
              </Box>

              {audioURL && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Recording Complete ({formatTime(recordingTime)})
                  </Typography>
                  <audio controls src={audioURL} style={{ width: '100%' }} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>

        {/* Transcription Section */}
        {audioBlob && !transcriptionResult && (
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Button
              variant="contained"
              onClick={transcribeAudio}
              disabled={isProcessing}
              startIcon={isProcessing ? <CircularProgress size={20} /> : <MicIcon />}
            >
              {isProcessing ? 'Transcribing...' : 'Transcribe Audio'}
            </Button>
          </Box>
        )}

        {/* Transcription Results */}
        {transcriptionResult && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transcription Results
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter idea title"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tags (comma-separated)"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Enter tags"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Transcribed Text:
                  </Typography>
                  <Box sx={{ 
                    p: 2, 
                    backgroundColor: 'grey.100', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.300'
                  }}>
                    {transcriptionResult.text}
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Chip 
                    label={`Confidence: ${Math.round(transcriptionResult.confidence * 100)}%`}
                    color={transcriptionResult.confidence > 0.8 ? 'success' : 'warning'}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Chip 
                    label={`Duration: ${Math.round(transcriptionResult.duration)}s`}
                    color="info"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {isProcessing && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <LinearProgress />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Processing...
            </Typography>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} startIcon={<CloseIcon />}>
          Cancel
        </Button>
        
        {transcriptionResult && (
          <Button
            variant="contained"
            onClick={createIdeaFromVoice}
            disabled={isProcessing || !title.trim()}
            startIcon={isProcessing ? <CircularProgress size={20} /> : <MicIcon />}
          >
            {isProcessing ? 'Creating Idea...' : 'Create Idea'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VoiceRecorder;
