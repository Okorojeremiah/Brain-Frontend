import ReactDOM from "react-dom/client"; // Import the createRoot API
import App from "./App";
// import "./styles/global.css"; 

// Get the root element
const rootElement = document.getElementById("root");

// Create a root and render the app
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);
