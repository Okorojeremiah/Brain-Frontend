// src/App.jsx
import { ChatProvider } from "./components/ChatProvider.jsx"; 
import { AuthProvider } from "./Auth/AuthProvider.jsx";
import AppRoutes from "./routes.jsx";  

function App() {
  return (
    <AuthProvider>
      <ChatProvider>
        <AppRoutes />  
      </ChatProvider>
    </AuthProvider>
  );
}

export default App;
