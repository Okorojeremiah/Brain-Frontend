import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext"; // Import useTheme
import axios from "../api";
import styles from "../styles/Chat.module.css";
import PropTypes from 'prop-types';


const Profile = ({ onClose }) => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme(); 
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    department: "",
    job_role: "",
  });
  const [isEditing, setIsEditing] = useState(false);

  console.log("Current theme:", theme);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        department: user.department || "",
        job_role: user.job_role || "",
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    axios.put(`/user/profile/update/${user.id}`, profile)
      .then(() => {
        setIsEditing(false);
      })
      .catch(error => {
        console.error("Failed to update profile:", error);
      });
  };

  const handleToggleTheme = () => {
    console.log("Toggling theme from", theme);
    toggleTheme();
  };

  return (
    <div className={styles.profileContainer}>
      <button onClick={onClose} className={styles.closeButton}>×</button>
      <h2>Profile</h2>
      {isEditing ? (
        <div className={styles.profileForm}>
          <label>
            Name:
            <input
              type="text"
              name="name"
              value={profile.name}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Email:
            <input
              type="email"
              name="email"
              value={profile.email}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Department:
            <input
              type="text"
              name="department"
              value={profile.department}
              onChange={handleInputChange}
            />
          </label>
          <label>
            Job Role:
            <input
              type="text"
              name="job_role"
              value={profile.job_role}
              onChange={handleInputChange}
            />
          </label>
          <button onClick={handleSave}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      ) : (
        <div className={styles.profileDetails}>
          <p><strong>Name:</strong> {profile.name}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Department:</strong> {profile.department}</p>
          <p><strong>Job Role:</strong> {profile.job_role}</p>
          <button onClick={() => setIsEditing(true)}>Edit Profile</button>
        </div>
      )}
      <div className={styles.themeToggle}>
        <label>Theme:</label>
        <button
          className={`${styles.toggleBtn} ${theme === "dark" ? styles.toggled : ""}`}
          onClick={handleToggleTheme}
        >
          <div className={styles.thumb}></div>
        </button>
      </div>
    </div>
  );
};

Profile.propTypes = {
  onClose: PropTypes.func.isRequired,
};

export default Profile;