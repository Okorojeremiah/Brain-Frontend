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
      setChatHistory(
        response.data.map((chat) => ({
          ...chat,
          name: chat.name || "Untitled chat", // Fallback for missing names
        }))
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to fetch chat history.";
      console.error("Failed to fetch chat history:", errorMessage);
    }
  };

  const loadChat = useCallback(async (chatId) => {
    try {
      const response = await axios.get(`/user/chat_history/${chatId}`);
      setMessages(response.data.messages);
      console.log(response.data.messages);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to load chat messages.";
      console.error("Failed to load chat messages:", errorMessage);
    }
  }, []);

  const sendMessage = async (chatId, userInput) => {
    const userMessage = { sender: "User", content: userInput };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post("/user/chat/messages", {
        chat_id: chatId,
        user_message: userInput,
      });
      const assistantMessage = {
        sender: "Brain",
        content: response.data?.answer || "No response available.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        DEFAULT_ERROR_MESSAGE;
      setMessages((prev) => [
        ...prev,
        { sender: "Brain", content: errorMessage },
      ]);
      console.error("Error sending message:", errorMessage);
      alert(errorMessage);
    }
  };

  const renameChat = async (chatId, newName) => {
    try {
      const response = await axios.put(
        `/user/chat_history/edit_chat_name/${chatId}`,
        {
          name: newName,
        }
      );

      // Update chat history with the new name
      setChatHistory((prevChatHistory) =>
        prevChatHistory.map((chat) =>
          chat.id === chatId ? { ...chat, name: newName } : chat
        )
      );

      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to update chat name";
      console.error("Error updating chat name:", errorMessage);
      return { error: errorMessage };
    }
  };

  const updateMessage = async (index, chatId, newMessage) => {
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
        updatedMessages.push({
          sender: "Brain",
          content: response.data?.answer,
        });
        return updatedMessages;
      });
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Error updating message";
      console.error("Error updating message:", errorMessage);
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
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Error deleting chat";
      console.error("Error deleting chat:", errorMessage);
      alert(errorMessage);
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
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to upload the document. Please try again.";
      console.error("Error uploading document:", errorMessage);
      alert(errorMessage);
    }
  };

  const createChat = async () => {
    try {
      const response = await axios.post("/user/chat");
      const newChat = response.data;
      setMessages([]);
      setChatHistory((prev) => [...prev, newChat]);
      return newChat;
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Error creating chat";
      console.error("Error creating chat:", errorMessage);
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
        setCurrentChatId,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

ChatProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
