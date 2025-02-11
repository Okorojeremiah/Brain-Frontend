import { useState } from "react";
import axios from "../api"; 

const UploadComponent = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Handle file selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]); // Save the selected file
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setMessage("No file selected!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // Append the file to the form data

    setLoading(true);
    try {
      const response = await axios.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data", // Indicate the content type
        },
      });
      setMessage(response.data.message); // Set success message from backend
    } catch (error) {
      setMessage(error.response?.data?.error || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload File"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default UploadComponent;
