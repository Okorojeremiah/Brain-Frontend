import { useState, useEffect, useRef } from "react";
import styles from "../styles/VoiceMode.module.css";
import PropTypes from "prop-types"; 
import axios from "../api";

const VoiceMode = ({ toggleVoiceMode, currentChatId }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [audioUrl, setAudioUrl] = useState("");
    const audioRef = useRef(null);

    // Function to start/stop voice recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one sentence
    recognition.interimResults = false; // Only final results
    recognition.lang = "en-US"; // Set language

    // Handle start/stop listening
    const toggleListening = () => {
        if (isListening) {
            recognition.stop(); // Stop listening
            setIsListening(false);
        } else {
            try {
                recognition.start(); // Start listening
                setIsListening(true);
            } catch (error) {
                console.error("Error starting speech recognition:", error);
                alert("Unable to start speech recognition. Please check your microphone and try again.");
            }
        }
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript); // Update the transcript state
        handleResponse(transcript); // Send the transcript to the backend
        setIsListening(false); // Stop listening after getting the result
    };

    // Handle errors
    recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);

        // Display user-friendly error messages
        if (event.error === "no-speech") {
            alert("No speech detected. Please try again.");
        } else if (event.error === "network") {
            alert("Network error. Please check your internet connection.");
        } else {
            alert("An error occurred during speech recognition. Please try again.");
        }
    };

    // Function to handle AI response
     const handleResponse = async (text) => {
        try {
            const res = await axios.post("/user/chat/voice", { 
                transcribed_text: text,
                chat_id: currentChatId });

            const data = res.data;
            if (data.error) {
                console.error("Error in voice mode:", data.error);
                alert("An error occurred: " + data.error);
            } else {
                // const baseURL = axios.defaults.baseURL || ""; // Get the base URL from Axios config
                // const fullAudioUrl = data.audio_url.startsWith("/")
                //     ? `${baseURL}${data.audio_url}` // Prepend base URL if relative
                //     : data.audio_url; // Use as-is if already absolute
    
                // console.log("Full Audio URL:", fullAudioUrl);
                // setAudioUrl(fullAudioUrl); // Update the audio URL
                // Get the AI-generated response text
                const aiResponse = data.response_text;
                console.log("AI Response:", aiResponse);
                
                // Generate speech from text using Web Speech API
                const utterance = new SpeechSynthesisUtterance(aiResponse);
                utterance.lang = "en-US";
                window.speechSynthesis.speak(utterance);
            }
        } catch (error) {
            console.error("Error sending voice input:", error);
            alert("An error occurred while processing your request. Please try again.");
        }
    };

    // Automatically play the audio when the URL changes
    useEffect(() => {
        if (audioUrl && audioRef.current) {
            audioRef.current.play(); // Play the audio automatically
        }
    }, [audioUrl]);


    return (
        <div className={styles.voiceModePage}>
            <button onClick={toggleVoiceMode} className={styles.backButton}>← Back to Chat</button>
            <h1>Voice Mode</h1>
            <div className={styles.voiceContainer}>
                <button onClick={toggleListening} className={styles.voiceButton}>
                    {isListening ? "Stop Listening" : "Start Listening"}
                </button>
                <div className={styles.transcript}>
                    <strong>You:</strong> {transcript}
                </div>
                {/* Hidden audio element */}
                <audio ref={audioRef} src={audioUrl} controls style={{ display: "none" }} />
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