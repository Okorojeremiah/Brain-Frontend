import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "../api";
import { ChatContext } from "../context/ChatContext";



const DEFAULT_ERROR_MESSAGE = "An error occurred. Please try again.";

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]); 
  const [currentChatId, setCurrentChatId] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("/user/chat_history");
      console.log("Response:", response); 

      setChatHistory(response.data.map(chat => ({
        ...chat,
        name: chat.name || "Untitled chat", // Fallback for missing names
      })));
    } catch (error) {
      console.error("Failed to fetch chat history:", error);
    }
  };
  

  const loadChat = useCallback(async (chatId) => {
    try {
      const response = await axios.get(`/user/chat_history/${chatId}`);
      setMessages(response.data.messages);
      console.log(response.data.messages);
    } catch (error) {
      console.error("Failed to load chat messages:", error);
    }
  }, []);

  const sendMessage = async (chatId, userInput) => {
    const userMessage = { sender: "User", content: userInput };
    setMessages((prev) => [...prev, userMessage]);
    

    try {
      const response = await axios.post("/user/chat/messages", { 
        chat_id: chatId,
        user_message: userInput });
      const assistantMessage = {
        sender: "Brain",
        content: response.data?.answer || "No response available.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "Brain", content: DEFAULT_ERROR_MESSAGE },
      ]);
       console.error(error); 
    }
  };

  const renameChat = async (chatId, newName) => {
    try {
      const response = await axios.put(`/user/chat_history/edit_chat_name/${chatId}`, {
        name: newName,
      });
  
      // Update chat history with the new name
      setChatHistory((prevChatHistory) =>
        prevChatHistory.map((chat) =>
          chat.id === chatId ? { ...chat, name: newName } : chat
        )
      );
  
      return response.data;
    } catch (error) {
      console.error("Error updating chat name:", error);
      return { error: "Failed to update chat name" };
    }
  };
  

  const updateMessage = async (index, chatId,  newMessage) => {
    const messageData = { chat_id: chatId, user_message: newMessage };
    try {
      const response = await axios.post("/user/chat/messages", messageData);
  
      // Update the message list with the new response
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        updatedMessages[index] = {
          ...updatedMessages[index],
          content: newMessage,
        };
        updatedMessages.push({ sender: "Brain", content: response.data?.answer});
        return updatedMessages;
      });
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`/user/chat_history/delete_chat/${chatId}`);
      
      // Remove the deleted chat from the chat history
      setChatHistory((prevChatHistory) =>
        prevChatHistory.filter((chat) => chat.id !== chatId)
      );

      if (currentChatId === chatId) {
          setCurrentChatId(null);
      }
  
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };
  
  

  const uploadDocument = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const uploadedFileMessage = {
        sender: "User",
        content: `File uploaded: ${response.data.file_name}`,
      };

      setMessages((prev) => [...prev, uploadedFileMessage]);
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Failed to upload the document. Please try again.");
    }
  };

  const createChat = async () => {
    try {
      const response = await axios.post("/user/chat");
      const newChat = response.data;
      setMessages([]); 
      setChatHistory((prev) => [...prev, newChat]); 
      return newChat
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  return (
    <ChatContext.Provider 
    value={{ 
      messages, 
      setMessages, 
      chatHistory,
      sendMessage, 
      uploadDocument, 
      updateMessage, 
      createChat,
      loadChat,
      renameChat,
      deleteChat,
      currentChatId, 
      setCurrentChatId
      }}>
      {children}
    </ChatContext.Provider>
  );
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
