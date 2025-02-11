import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode }  from "jwt-decode"; 
import PropTypes from "prop-types";

const AuthGuard = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = () => {
      const token = localStorage.getItem("token");
      if (token) {
        const decodedToken = jwtDecode(token); 
        const currentTime = Date.now() / 1000;
        if (decodedToken.exp < currentTime) {
          alert("Your session has expired. Please log in again.");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      } else {
        navigate("/login");
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 60000); 

    return () => clearInterval(interval); 
  }, [navigate]);

  const token = localStorage.getItem("token");
  if (!token) {
    return null; 
  }

  return children; 
};

AuthGuard.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthGuard;
