import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";
// import axios from "../api";
import logo from "../assets/logo1.jpeg";
import { useAuth } from "./AuthProvider";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // try {
    //   const response = await axios.post("/auth/login", {
    //     email: email,
    //     password: password,
    //   });

    //   if (response.status === 200) {
    //     const data = response.data;
    //     localStorage.setItem("token", data.access_token);
    //     navigate("/chat");
    //   } else {
    //     setError(response.data.error || "Login failed. Please try again.");
    //   }
    // } catch (err) {
    //   setError(err.response?.data?.error || "An error occurred. Please try again.");
    // }

    try {
      await login(email, password); // Use the login function from AuthContext
      navigate("/chat");
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred. Please try again.");
    }
  };

  return (
    <div className={styles.homepage}>
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img src={logo} alt="Rosabon Logo" className={styles.logo} />
          <span className={styles.brand}>TCG Brain<sup>™</sup></span>
        </div>
      </header>
      <form onSubmit={handleSubmit} className={styles.authForm}>
        <h2>Login</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>
          Don&apos;t have an account? <a href="/register">Sign Up</a>
        </p>
      </form>
      <footer className={styles.footer}>
      TheConceptGroup Company © 2024. All Rights Reserved
      </footer>
    </div>
  );
};

export default Login;
