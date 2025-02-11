import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Auth/Login";
import Register from "./Auth/Register";
import ChatContainer from "./components/ChatContainer";
import AuthGuard from "./Auth/AuthGuard";  



const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Route for login and register */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        {/* <Route path="/chat" element={<ChatContainer />} /> */}
        
        {/* Protect the /chat route */}
        <Route path="/chat" element={<AuthGuard><ChatContainer /></AuthGuard>} />

        {/* 404 Not Found Route */}
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
