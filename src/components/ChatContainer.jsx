import { useContext, useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { ChatContext } from "../context/ChatContext";
import styles from "../styles/Chat.module.css";
import LogoutButton from "../Auth/Logout"
import { AuthContext } from "../context/AuthContext";
import Dropzone from 'dropzone'; 
import VoiceMode from "./VoiceMode"; 
import brainlogo from '../assets/brainlogo.png';


const ChatContainer = () => {
  const { user } = useContext(AuthContext); 
  const { 
    messages, 
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
   } = useContext(ChatContext);
  const [chatId, setChatId] = useState(null); 
  const [input, setInput] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false); 
  const [menuOpen, setMenuOpen] = useState(false); 
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [copiedIndex, setCopiedIndex] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null); 
  const [editedMessage, setEditedMessage] = useState(""); 
  const [visibleChats, setVisibleChats] = useState(5);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  // const [chatMenuOpen, setChatMenuOpen] = useState(null); 
  const [chatMenuInfo, setChatMenuInfo] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatName, setNewChatName] = useState("");

  

  const userFullName =  user ? user.name : "User"; 
  const userFirstName = userFullName.split(" ")[0]; 
  const userInitials = userFullName
    .split(" ")
    .map((name) => name[0])
    .join(""); 

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowWelcomeMessage(false);
    }
  }, [messages]);

  // useEffect(() => {
  //   const handleClickOutside = (event) => {
  //     if (chatMenuOpen && !event.target.closest(`.${styles.chatHistoryItem}`)) {
  //       setChatMenuOpen(null);
  //     }
  //   };
  
  //   document.addEventListener('mousedown', handleClickOutside);
  //   return () => {
  //     document.removeEventListener('mousedown', handleClickOutside);
  //   };
  // }, [chatMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatMenuInfo &&
        !event.target.closest(`.${styles.menuPopup}`) &&
        !event.target.closest(`.${styles.menuButton}`)
      ) {
        setChatMenuInfo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [chatMenuInfo]);


  const toggleVoiceMode = () => {
    setIsVoiceMode((prev) => !prev);
  };

  const toggleShowMoreLess = () => {

    setVisibleChats((prevVisibleChats) => 
      prevVisibleChats === 5 ? chatHistory.length : 5
    );
  };

  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible(!isSidebarVisible);
  }, [isSidebarVisible]);

  const handleChatSelection = useCallback(
    async (selectedChatId) => {
      setLoading(true);
      try {
        setChatId(selectedChatId);
        setCurrentChatId(selectedChatId); 
        await loadChat(selectedChatId); 
      } catch (error) {
        console.error("Failed to load chat:", error);
      } finally {
        setLoading(false);
      }
    },
    [loadChat, setCurrentChatId] 
  );
  

  const handleNewChat = async () => {
      try {
        const response = await createChat(); 
        setChatId(response.chat_id); 
      } catch (error) {
        console.error("Failed to create new chat:", error);
      }
  };

  const handleRename = async (chatId) => {
    if (newChatName.trim()) {
        await renameChat(chatId, newChatName);
        setEditingChatId(null);
        setNewChatName(""); 
    }
};

const handleRenameClick = (chatId) => {
  setEditingChatId(chatId); 
  setNewChatName(chatHistory.find((chat) => chat.id === chatId).name); 
}
// Handle deleting a chat
const handleDelete = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
        await deleteChat(chatId);
        setChatMenuInfo(null); // Close the menu
    }
};

 useEffect(() => {
    const dropzone = new Dropzone(fileInputRef.current, { 
      url: "documents/upload", // Server endpoint for file upload, adjust as necessary
      previewsContainer: false, // Hide the default preview
      clickable: false // Only allow drag and drop, not click to open file dialog
    });

    dropzone.on("addedfile", file => {
      setFile(file);
    });

    return () => dropzone.destroy(); // Clean up on unmount
  }, []);

  
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (input.trim() && !file) { // Text message only
      setLoading(true);
      setInput("");
      try {
        await sendMessage(chatId, input.trim());
      } catch (error) {
        console.error("Error sending message:", error);
      } finally {
        setLoading(false);
      }
    } else if (file) { // File with or without text message
      setLoading(true);
      try {
        await uploadDocument(file);
        if (input.trim()) { // Send text message if present
          await sendMessage(chatId, input.trim());
          setInput(""); //Clear input after send.
        }
        setFile(null);
      } catch (error) {
        console.error("Error uploading document:", error);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const getFileIcon = (file) => {
    if (!file) return null;
  
    const fileType = file.type || file.name.split('.').pop().toLowerCase();
    switch (fileType) {
      case 'application/pdf':
      case 'pdf':
        return 'picture_as_pdf'; // Material Icon for PDF
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
      case 'doc':
      case 'docx':
        return 'description'; // Material Icon for Word
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
      case 'application/vnd.ms-powerpoint':
      case 'ppt':
      case 'pptx':
        return 'slideshow'; // Material Icon for PowerPoint
      default:
        return 'insert_drive_file'; // Generic file icon
    }
  };

  const handleCopy = (message, index) => {
    navigator.clipboard.writeText(message)
      .then(() => {
        setCopiedIndex(index); 
        setTimeout(() => setCopiedIndex(false), 2000); 
      })
      .catch((err) => {
        console.error("Failed to copy message:", err);
      });
  };

  const handleEditClick = (index, message) => {
    setEditingIndex(index); 
    setEditedMessage(message); 
  };

  const handleSaveEdit = async (index) => {
    if (editedMessage.trim()) {
      try {
        await updateMessage(index, chatId, editedMessage.trim()); 
        setEditingIndex(null); 
        setEditedMessage(""); 
      } catch (error) {
        console.error("Error updating message:", error);
      }
    } else {
      alert("Edited message cannot be empty.");
    }
  };


  const removeFile = () => {
    setFile(null);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev); 
  };

  return (
    <div className={styles.app}>
      {isVoiceMode ? (
                <VoiceMode 
                toggleVoiceMode={toggleVoiceMode}
                currentChatId={currentChatId}
                />
            ) : (
                <>
       <header className={styles.header} style={{
        marginLeft: isSidebarVisible ? '20%' : '0',
        width: isSidebarVisible ? 'calc(100% - 20%)' : '100%'
      }}>
      <div className={styles.headerLeft}>
        <img src={brainlogo} alt="Logo" className={styles.logo} />
        <div className={styles.brand}>Brain<sup>™</sup></div>
      </div>
      <div className={styles.headerRight}>
        <div className={styles.userMenuContainer}>
          <div className={styles.userButton} onClick={toggleMenu}>
            {userInitials}
          </div>
          {/* Pop-up Menu */}
          {menuOpen && (
            <div className={styles.popupMenu}>
              <button onClick={() => alert("Profile Clicked")}>Profile</button>
              <button onClick={() => alert("Settings Clicked")}>Settings</button>
              <LogoutButton />
            </div>
          )}
        </div>
      </div>
      <button onClick={toggleSidebar} className={styles.hamburgerMenu} data-hover={isSidebarVisible ? "collapse menu" : "expand menu"}>
        <div></div>
        <div></div>
        <div></div>
      </button>
    </header>

      <div className={styles.container}>
        {isSidebarVisible && (
          <div className={styles.chatSidebar}>
            <div className={styles.buttonContainer}>
            <button onClick={handleNewChat} className={styles.newChatButton}>+ New Chat</button>
            <button onClick={toggleVoiceMode} className={styles.voiceModeButton}>🎤 Voice Mode</button>
            </div>
            <h3 className={styles.historyTitle}>History</h3>
            <div className={styles.chatHistory}>
              {[...chatHistory].reverse().slice(0, visibleChats).map((chat) => (
                <div
                  key={chat.id}
                  className={`${styles.chatHistoryItem} ${currentChatId === chat.id ? styles.activeChat : ""} ${chatMenuInfo === chat.id ? styles.activeChat : ""}`}
                >
                  {editingChatId === chat.id ? (
                      <input
                          type="text"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                  handleRename(chat.id);
                              }
                          }}
                          onBlur={() => {
                            const originalName = chat.name || "Untitled Chat";
                            if (newChatName.trim() === originalName) {
                              // No changes: cancel editing
                              setEditingChatId(null);
                            } else {
                              // Name changed: commit the rename
                              handleRename(chat.id);
                            }
                          }}
                          autoFocus
                          className={styles.renameInput}
                      />
                  ) : (
                    <span onClick={() => handleChatSelection(chat.id)}>
                      {chat.name || "Untitled Chat"}
                    </span>
                  )}
                  <button
                          className={styles.menuButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.currentTarget.blur();
                            
                            const rect = e.target.getBoundingClientRect();
                            // Toggle the popup: if already open for this chat, close it; otherwise, set its position.
                            if (chatMenuInfo && chatMenuInfo.chatId === chat.id) {
                              setChatMenuInfo(null);
                            } else {
                              setChatMenuInfo({
                                chatId: chat.id,
                                // You can adjust the x and y values as needed:
                                x: rect.left,
                                y: rect.bottom,
                              });
                            }
                          }}
                        ></button>
                      </div>
                    ))}
              <button onClick={toggleShowMoreLess} className={styles.showMoreButton}>
                {visibleChats < chatHistory.length ? 'View More Chats' : 'Show Less'}
              </button>
            </div>
          </div>
        )}
        <div className={styles.mainChat}>
                  {showWelcomeMessage && (
            <div className={styles.welcomeMessage}>
              <strong>Welcome {userFirstName}, chat with Brain<sup>™</sup></strong>
            </div>
          )}
          <div className={styles.messages}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={
                  msg.sender === "User" ? styles.userMessage : styles.assistantMessage}
              >
                 {/* Edit Button for User Messages */}
                 {msg.sender === "User" && (
                  <button
                    className={styles.editButton}
                    onClick={() => handleEditClick(index, msg.content)}
                    aria-label="Edit message"
                  >
                    <span className="material-icons">edit</span>
                  </button>
                )}
                {editingIndex === index ? (
                <div className={styles.editMessageContainer}>
                <textarea
                  className={styles.editInput}
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  rows="2"
                  style={{ resize: "none", overflowY: "auto"}} 
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault(); // Prevent adding a new line
                      handleSaveEdit(e); // Call the submit handler
                    }
                  }}
                  onInput={(e) => {
                    e.target.style.height = "auto"; 
                    const maxHeight = 400;
                    e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`;
                    //Dynamically adjust
                  }}
                />
                <button
                  className={styles.saveButton}
                  onClick={() => handleSaveEdit(index)}
                >
                  Send
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setEditingIndex(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <ReactMarkdown>
                  {typeof msg?.content === "string" ? DOMPurify.sanitize(msg.content) : ""}
                </ReactMarkdown>
                {msg.sender === "Brain" && (
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopy(msg.content, index)}
                    aria-label="Copy message"
                  >
                    <span className="material-icons">
                      {copiedIndex == index ? "check_circle" : "content_copy"}
                    </span>
                  </button>
                )}
                {copiedIndex == index && (
                  <div className={styles.copiedMessage}>Copied!</div>
                )}
                
                </>
              )}
              </div>
            ))}
            {loading && (
              <div className={styles.typingIndicator}>
                Brain is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <form className={styles.chatInputForm} onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
          <label htmlFor="fileInput" className={styles.uploadButton}>
              <span className="material-icons">attach_file</span>
            </label>
          <textarea  
            className={styles.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Message Brain..."
            rows="4" 
            style={{ resize: "none", overflowY: "auto", height: "auto", minHeight: "60px"  }} 
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault(); // Prevent adding a new line
                handleSubmit(e); // Call the submit handler
              }
            }}
            onInput={(e) => {
              e.target.style.height = "auto"; 
              const maxHeight = 400;
              e.target.style.height = `${Math.min(e.target.scrollHeight, maxHeight)}px`; //Dynamically adjust
            }}
            />
            
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() && !file}
            >
              <span className="material-icons">send</span>
            </button>
            {file && (
                <div className={styles.fileDisplayInTextArea}>
                  <span className="material-icons">{getFileIcon(file)}</span>
                  <span className={styles.fileName}>{file.name}</span>
                  <button 
                    type="button" 
                    className={styles.clearButton}
                    onClick={removeFile}
                    aria-label="Remove file"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <input
              type="file"
              id="fileInput"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </form>
        </div>
      </div>

      {chatMenuInfo && (
            <div
              className={styles.menuPopup}
              style={{
                position: "fixed",
                top: chatMenuInfo.y,
                left: chatMenuInfo.x,
                zIndex: 9999,
              }}
            >
              <button
                onClick={() => {
                  handleRenameClick(chatMenuInfo.chatId);
                  setChatMenuInfo(null);
                }}
              >
                <span className="material-icons">edit</span> Rename
              </button>
              <button
                onClick={() => {
                  handleDelete(chatMenuInfo.chatId);
                  setChatMenuInfo(null);
                }}
              >
                <span className="material-icons">delete</span> Delete
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatContainer;
