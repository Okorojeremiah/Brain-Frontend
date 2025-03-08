import { useState, useEffect, useContext } from "react";
import axios from "../api";
import PropTypes from "prop-types";
import { AuthContext } from "../context/AuthContext";


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get("/user/profile");
          console.log("Fetched user data on mount:", response.data);
          setUser(response.data);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser(null);
      } finally {
        setLoading(false); // Set loading to false after fetch
      }
    };

    fetchUserData();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await axios.post("/auth/login", { email, password });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      // Fetch user profile after login
      const profileResponse = await axios.get("/user/profile");
      console.log("Fetched user data after login:", profileResponse.data);
      setUser(profileResponse.data);
      return profileResponse.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axios.post("/auth/logout", {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
    } catch (error) {
      console.error("Error during logout request:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
