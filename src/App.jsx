// src/App.jsx
import { ChatProvider } from "./components/ChatProvider.jsx"; 
import { AuthProvider } from "./Auth/AuthProvider.jsx";
import AppRoutes from "./routes.jsx";  
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { useAuth } from "./Auth/AuthProvider.jsx";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
      <ChatProvider>
        <AppContent />  
      </ChatProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return <AppRoutes />;
}

export default App;
