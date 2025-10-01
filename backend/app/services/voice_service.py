"""
Voice service for speech-to-text functionality
"""

try:
    import speech_recognition as sr
    from pydub import AudioSegment
    SPEECH_RECOGNITION_AVAILABLE = True
except ImportError:
    SPEECH_RECOGNITION_AVAILABLE = False
    print("Warning: speech_recognition or pydub not available. Voice functionality will be limited.")

from typing import Optional, Dict
import logging
import tempfile
import os

logger = logging.getLogger(__name__)


class VoiceService:
    """Service for converting speech to text"""
    
    def __init__(self):
        if SPEECH_RECOGNITION_AVAILABLE:
            try:
                self.recognizer = sr.Recognizer()
                self.microphone = sr.Microphone()
                
                # Adjust for ambient noise
                with self.microphone as source:
                    self.recognizer.adjust_for_ambient_noise(source, duration=1)
                self.available = True
            except Exception as e:
                logger.error(f"Failed to initialize voice service: {e}")
                self.available = False
        else:
            self.available = False
    
    async def transcribe_audio_file(self, audio_file_path: str, language: str = "en-US") -> Dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_file_path: Path to the audio file
            language: Language code for transcription
        
        Returns:
            Dictionary containing transcribed text and metadata
        """
        if not self.available:
            return {
                "text": "Voice recognition service not available. Please check if speech_recognition and pydub are installed.",
                "language": language,
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": "Voice service not available"
            }
        
        try:
            # Convert audio file to WAV format if needed
            audio = AudioSegment.from_file(audio_file_path)
            
            # Create temporary WAV file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                audio.export(temp_file.name, format="wav")
                
                # Transcribe using speech recognition
                with sr.AudioFile(temp_file.name) as source:
                    audio_data = self.recognizer.record(source)
                
                # Perform transcription
                text = self.recognizer.recognize_google(audio_data, language=language)
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                return {
                    "text": text,
                    "language": language,
                    "confidence": 0.9,  # Google Speech API doesn't provide confidence
                    "duration": len(audio) / 1000,  # Duration in seconds
                    "success": True
                }
                
        except sr.UnknownValueError:
            logger.error("Could not understand audio")
            return {
                "text": "",
                "language": language,
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": "Could not understand audio"
            }
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            return {
                "text": "",
                "language": language,
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": f"Speech recognition service error: {e}"
            }
        except Exception as e:
            logger.error(f"Error transcribing audio: {e}")
            return {
                "text": "",
                "language": language,
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": f"Error transcribing audio: {e}"
            }
    
    async def transcribe_microphone_input(self, timeout: int = 10, phrase_time_limit: float = 3.0) -> Dict:
        """
        Transcribe audio from microphone input
        
        Args:
            timeout: Maximum time to wait for speech
            phrase_time_limit: Maximum time for a single phrase
        
        Returns:
            Dictionary containing transcribed text and metadata
        """
        if not self.available:
            return {
                "text": "Voice recognition service not available. Please check if speech_recognition and pydub are installed.",
                "language": "en-US",
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": "Voice service not available"
            }
        
        try:
            with self.microphone as source:
                # Listen for audio with timeout
                audio_data = self.recognizer.listen(
                    source, 
                    timeout=timeout, 
                    phrase_time_limit=phrase_time_limit
                )
            
            # Perform transcription
            text = self.recognizer.recognize_google(audio_data)
            
            return {
                "text": text,
                "language": "en-US",
                "confidence": 0.9,
                "duration": len(audio_data.frame_data) / audio_data.sample_rate,
                "success": True
            }
            
        except sr.WaitTimeoutError:
            logger.warning("No speech detected within timeout period")
            return {
                "text": "",
                "language": "en-US",
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": "No speech detected within timeout period"
            }
        except sr.UnknownValueError:
            logger.error("Could not understand speech")
            return {
                "text": "",
                "language": "en-US",
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": "Could not understand speech"
            }
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            return {
                "text": "",
                "language": "en-US",
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": f"Speech recognition service error: {e}"
            }
        except Exception as e:
            logger.error(f"Error transcribing microphone input: {e}")
            return {
                "text": "",
                "language": "en-US",
                "confidence": 0.0,
                "duration": 0,
                "success": False,
                "error": f"Error transcribing microphone input: {e}"
            }
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return {
            "en-US": "English (United States)",
            "en-GB": "English (United Kingdom)",
            "es-ES": "Spanish (Spain)",
            "es-MX": "Spanish (Mexico)",
            "fr-FR": "French (France)",
            "de-DE": "German (Germany)",
            "it-IT": "Italian (Italy)",
            "pt-BR": "Portuguese (Brazil)",
            "ru-RU": "Russian (Russia)",
            "ja-JP": "Japanese (Japan)",
            "ko-KR": "Korean (South Korea)",
            "zh-CN": "Chinese (Simplified)",
        }


# Global instance
voice_service = VoiceService()
