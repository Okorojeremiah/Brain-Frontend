import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import axios from "../api";
import { ChatContext } from "../context/ChatContext";

const DEFAULT_ERROR_MESSAGE = "An error occurred. Please try again.";

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);

  
  const loadChat = useCallback(async (chatId) => {
    try {
      const response = await axios.get(`/user/chat_history/${chatId}`);
      setMessages(response.data.messages);
      console.log("Loaded messages:", response.data.messages);
    } catch (error) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.details ||
        "Failed to load chat messages.";
      console.error("Failed to load chat messages:", errorMessage);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const fetchCurrentChatId = async () => {
      try {
        const response = await axios.get("/user/chat/current");
        
        if (response.data.chatId) {
          setCurrentChatId(response.data.chatId);
        }
      } catch (error) {
        console.error("Failed to fetch current chat ID:", error);
      }
    };

    fetchCurrentChatId();
  }, []);

  useEffect(() => {
    const updateCurrentChatId = async () => {
      console.log("A Fetched current chat ID:", currentChatId);
      if (currentChatId) {
        try {
          await axios.post("/user/chat/set_current", { chatId: currentChatId });
        } catch (error) {
          console.error("Failed to update current chat ID:", error);
        }
      }
    };

    updateCurrentChatId();
  }, [currentChatId]);

  useEffect(() => {
    if (currentChatId) {
      console.log("Loading chat for ID:", currentChatId);
      loadChat(currentChatId);
    }
  }, [currentChatId, loadChat]);

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

  const sendMessage = async (chatId, userInput) => {
    const userMessage = { sender: "User", content: userInput };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await axios.post("/user/chat/messages", {
        chat_id: chatId,
        user_message: userInput,
      });

      const { answer, chat: updatedChat } = response.data;

    // If the backend updated the chat name (e.g. after the first message), update chatHistory immediately.
    if (updatedChat && updatedChat.name) {
      setChatHistory((prevHistory) =>
        prevHistory.map((chat) =>
          chat.id === chatId ? { ...chat, name: updatedChat.name } : chat
        )
      );
      await fetchHistory()
    }

      const assistantMessage = {
        sender: "Brain",
        content: answer || "No response available.",
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

  const updateMessage = async (userMessageIndex, chatId, newContent) => {
    const userMessage = messages[userMessageIndex];
    const aiMessage = messages[userMessageIndex + 1];

    if (!userMessage || !aiMessage) {
      console.error("Unable to find corresponding messages for update.");
      return;
    }

    try {
      const response = await axios.put("/user/chat/messages/update_full", {
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
        newContent,
      });

      // The response is expected to have updated_user_message and updated_ai_message.
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        // Update the user message at the given index.
        updatedMessages[userMessageIndex] = {
          ...updatedMessages[userMessageIndex],
          content: response.data.updated_user_message.content,
          edits: response.data.updated_user_message.edits,
          edit_count: response.data.updated_user_message.edit_count,
          timestamp: response.data.updated_user_message.timestamp,
        };
        // Update the corresponding AI message (assumed to be at index + 1).
        updatedMessages[userMessageIndex + 1] = {
          ...updatedMessages[userMessageIndex + 1],
          content: response.data.updated_ai_message.content,
          edits: response.data.updated_ai_message.edits,
          edit_count: response.data.updated_ai_message.edit_count,
          timestamp: response.data.updated_ai_message.timestamp,
        };
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
  
      // Fetch the user's profile to check if they are a superuser and get their department
      const userProfileResponse = await axios.get("/user/profile");
      const isSuperuser = userProfileResponse.data?.is_superuser || false;
      const userDepartment = userProfileResponse.data?.department || "";
  
      // Determine the API endpoint based on the user's role
      const endpoint = isSuperuser ? "documents/admin/upload" : "documents/upload";
  
      // Add the user's department to the form data (for superusers only)
      if (isSuperuser) {
        formData.append("department", userDepartment);
      }
  
      const response = await axios.post(endpoint, formData, {
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
