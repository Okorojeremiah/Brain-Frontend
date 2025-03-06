import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Auth.module.css";
import axios from "../api";
import logo from "../assets/logo1.jpeg"

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [jobRole, setJobRole] = useState(""); 
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const departments = [
    "admin",
    "hr",
    "it",
    "reconciliation",
    "marketing",
    "transformation",
    "communication",
    "internal_operation",
    "legal",
    "account",
    "portfolio_risk",
    "underwriter",
    "business_operation",
    "client_experience",
    "recovery",
    "product",
    "sales",
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await axios.post("/auth/register", {
        name: name,
        email: email,
        password: password,
        department: department,
        job_role: jobRole, 
      });

      if (response.status === 201) { 
        navigate("/login");
      } else {
        setError(response.data.error || "Registration failed. Please try again.");
      }
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
        <h2>Register</h2>
        {error && <p className={styles.error}>{error}</p>}
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
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
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
          className={styles.authFormInput} // Add this class for consistent styling
        >
          <option value="" disabled>
            Select Department
          </option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Job Role"
          value={jobRole}
          onChange={(e) => setJobRole(e.target.value)} // Handling job role input
          required
        />
        <button type="submit">Register</button>
        <p>
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
      <footer className={styles.footer}>
      TheConceptGroup Company © 2024. All Rights Reserved
      </footer>
    </div>
  );
};

export default Register;
