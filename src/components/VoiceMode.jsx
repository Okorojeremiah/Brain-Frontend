// src/components/VoiceMode.js
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import styles from "../styles/VoiceMode.module.css";
import axios from "../api";



const VoiceMode = ({ toggleVoiceMode, currentChatId }) => {
    const [isConversationActive, setIsConversationActive] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const audioRef = useRef(null);
    const recognitionRef = useRef(null);
  
    // Initialize the SpeechRecognition instance once.
    useEffect(() => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return;
      }
  
      recognitionRef.current = new SpeechRecognition();
      // We process one sentence (or utterance) at a time.
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = "en-US";
  
      // When a result is obtained, process it.
      recognitionRef.current.onresult = async (event) => {
        const resultTranscript = event.results[0][0].transcript;
        setTranscript(resultTranscript);
        // Stop recognition to avoid overlapping with the AI’s audio.
        recognitionRef.current.stop();
  
        try {
          // Get the AI-generated audio (as an object URL) from the backend.
          const audioBlobUrl = await sendVoiceMessage(resultTranscript, currentChatId);
          setAudioUrl(audioBlobUrl);
        } catch (error) {
          console.error("Error processing voice message:", error);
        }
      };
  
      // Restart recognition automatically if an error occurs and conversation is active.
      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        if (isConversationActive) {
          recognitionRef.current.start();
        }
      };
  
      // When recognition ends (for example, if the user pauses without speaking),
      // automatically restart it if no AI response is playing.
      recognitionRef.current.onend = () => {
        // If conversation is active and there is no audio response pending,
        // restart listening.
        if (isConversationActive && !audioUrl) {
          recognitionRef.current.start();
        }
      };
    }, [currentChatId, isConversationActive, audioUrl]);
  
    // When the audioUrl changes, play the AI response. Once it finishes, resume listening.
    useEffect(() => {
      if (audioUrl && audioRef.current) {
        // Play the AI's response.
        audioRef.current.playbackRate = 1.5;
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        // When the response audio ends, clear the audioUrl and resume listening.
        audioRef.current.onended = () => {
          setAudioUrl("");
          if (isConversationActive && recognitionRef.current) {
            recognitionRef.current.start();
          }
        };
      }
    }, [audioUrl, isConversationActive]);
  
    // Start the continuous conversation.
    const startConversation = () => {
      setIsConversationActive(true);
      // Start speech recognition.
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
    };
  
    // Stop the conversation.
    const stopConversation = () => {
      setIsConversationActive(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (audioRef.current) {
        // Stop any playing audio.
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };


    const sendVoiceMessage = async (transcribedText, chatId) => {
        try {
            // Set responseType to "blob" to receive binary MP3 data.
            const response = await axios.post(
            "/user/chat/voice",
            { transcribed_text: transcribedText, chat_id: chatId },
            { responseType: "blob" }
            );
            // Convert the blob into an object URL for audio playback.
            const audioUrl = window.URL.createObjectURL(
            new Blob([response.data], { type: "audio/mpeg" })
            );
            return audioUrl;
        } catch (error) {
            console.error("Error sending voice message:", error);
            throw error;
        }
    };

  
    return (
      <div className={styles.voiceModePage}>
        <button onClick={toggleVoiceMode} className={styles.backButton}>
          ← Back to Chat
        </button>
        <h1>Voice Conversation Mode</h1>
        <div className={styles.voiceContainer}>
          {isConversationActive ? (
            <button onClick={stopConversation} className={styles.voiceButton}>
              Stop Conversation
            </button>
          ) : (
            <button onClick={startConversation} className={styles.voiceButton}>
              Start Conversation
            </button>
          )}
          <div className={styles.transcript}>
            <strong>You:</strong> {transcript}
          </div>
          {/* The audio element is hidden but used for playback. */}
          <audio ref={audioRef} controls style={{ display: "none" }} />
        </div>
      </div>
    );
  };
  
  VoiceMode.propTypes = {
    toggleVoiceMode: PropTypes.func.isRequired,
    currentChatId: PropTypes.number,
  };
  
  VoiceMode.defaultProps = {
    currentChatId: null,
  };
  
export default VoiceMode;