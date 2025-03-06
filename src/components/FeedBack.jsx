// src/components/Feedback.jsx
import { useState } from "react";
import styles from "../styles/Feedback.module.css";
import axios from "../api";
import PropTypes from "prop-types";

const Feedback = ({ onClose }) => {
    const [feedback, setFeedback] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim()) {
            setErrorMessage("Feedback cannot be empty.");
            return;
        }

        setIsSubmitting(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const response = await axios.post("/feedback", { feedback });
            if (response.status === 200) {
                setSuccessMessage("Thank you for your feedback!");
                setFeedback("");
                setTimeout(onClose, 2000); // Close the dialog after 2 seconds
            }
        } catch (error) {
            console.error("Error submitting feedback:", error);
            setErrorMessage(error.message || "An error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.feedbackContainer}>
            <h2 className={styles.feedbackTitle}>We Value Your Feedback</h2>
            <button onClick={onClose} className={styles.closeButton}>
                ×
            </button>
            <form onSubmit={handleSubmit} className={styles.feedbackForm}>
                <textarea
                    className={styles.feedbackTextarea}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Type your feedback here..."
                />
                <button
                    type="submit"
                    className={styles.feedbackButton}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </button>
            </form>
            {successMessage && (
                <div className={styles.feedbackSuccessMessage}>{successMessage}</div>
            )}
            {errorMessage && (
                <div className={styles.feedbackErrorMessage}>{errorMessage}</div>
            )}
        </div>
    );
};

Feedback.propTypes = {
    onClose: PropTypes.func.isRequired, // onClose must be a function and is required
};

export default Feedback;