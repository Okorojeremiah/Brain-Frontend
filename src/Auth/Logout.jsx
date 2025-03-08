// LogoutButton.jsx
import { useContext } from "react";
// import axios from "../api";
import { ChatContext } from "../context/ChatContext"; 
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";

const LogoutButton = () => {
  const chatContext = useContext(ChatContext);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      // await axios.post("/auth/logout", {}, {
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("token")}`, 
      //   },
      // });

      // // Clear user session data.
      // localStorage.removeItem("token");
      await logout();
      // localStorage.removeItem("user");
      
      if (chatContext?.setMessages) {
        chatContext.setMessages([]);
      }

      navigate("/login"); 
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return <button onClick={handleLogout}>Logout</button>;
};

export default LogoutButton;
