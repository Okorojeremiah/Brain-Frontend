import { useContext, useState, useEffect, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import DOMPurify from "dompurify";
import { ChatContext } from "../context/ChatContext";
import styles from "../styles/Chat.module.css";
import LogoutButton from "../Auth/Logout"
// import { AuthContext } from "../context/AuthContext";
import Dropzone from 'dropzone'; 
import VoiceMode from "./VoiceMode"; 
import brain from '../assets/brain.svg';
import Feedback from "./FeedBack";
import { FaPlusCircle, FaMicrophone } from 'react-icons/fa';
import Profile from "./Profile";
import { useTheme } from "../context/ThemeContext.jsx";
import { useAuth } from "../Auth/AuthProvider.jsx";
// import AssistantMessage from "./AssistantMessage";


const ChatContainer = () => {
  const { user } = useAuth(); 
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
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false); 
  const { theme } = useTheme();
  const [chatMenuInfo, setChatMenuInfo] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [newChatName, setNewChatName] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showTrendsPopup, setShowTrendsPopup] = useState(false); 
  const trendsButtonRef = useRef(null);
  const [showProfile, setShowProfile] = useState(false);

  

  const handleTrendsButtonClick = () => {
    setShowTrendsPopup(!showTrendsPopup); // Toggle the popup
  };

  // Function to handle trend selection
  const handleTrendSelection = (trend) => {
    console.log(`Selected trend: ${trend}`); 
    setShowTrendsPopup(false); // Close the popup after selection
  };

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


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        chatMenuInfo &&
        !event.target.closest(`.${styles.chatHistoryItemMenuPopup}`) &&
        !event.target.closest(`.${styles.chatHistoryItemMenuButton}`)
      ) {
        setChatMenuInfo(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [chatMenuInfo]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        trendsButtonRef.current &&
        !trendsButtonRef.current.contains(event.target) &&
        !event.target.closest(`.${styles.trendsPopup}`)
      ) {
        setShowTrendsPopup(false); // Close the popup
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const toggleVoiceMode = () => {
    setIsVoiceMode((prev) => !prev);
  };

  const toggleShowMoreLess = () => {

    setVisibleChats((prevVisibleChats) => 
      prevVisibleChats === 5 ? chatHistory.length : 5
    );
  };


  const toggleSidebar = useCallback(() => {
    setIsSidebarVisible((prev) => !prev);
  }, []);

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

  // const handleSaveEdit = async (index) => {
  //   if (editedMessage.trim()) {
  //     try {
  //       if (!messages[index].id) {
  //         throw new Error("Message ID is missing.");
  //       }

  //       await updateMessage(index, messages[index].id, editedMessage.trim()); 
  //       setEditingIndex(null); 
  //       setEditedMessage(""); 
  //     } catch (error) {
  //       console.error("Error updating message:", error);
  //     }
  //   } else {
  //     alert("Edited message cannot be empty.");
  //   }
  // };

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

  
  // const renderMessages = () => {
  //   return messages.map((msg, index) => (
  //     <div
  //       key={index}
  //       className={
  //         msg.sender === "User" ? styles.userMessage : styles.assistantMessage
  //       }
  //     >
  //       {msg.sender === "User" && (
  //         <button
  //           className={styles.editButton}
  //           onClick={() => handleEditClick(index, msg.content)}
  //           aria-label="Edit message"
  //         >
  //           <span className="material-icons">edit</span>
  //         </button>
  //       )}
  //       {editingIndex === index ? (
  //         <div className={styles.editMessageContainer}>
  //           <textarea
  //             className={styles.editInput}
  //             value={editedMessage}
  //             onChange={(e) => setEditedMessage(e.target.value)}
  //             rows="2"
  //             style={{ resize: "none", overflowY: "auto" }}
  //             onKeyDown={(e) => {
  //               if (e.key === "Enter" && !e.shiftKey) {
  //                 e.preventDefault();
  //                 handleSaveEdit(index);
  //               }
  //             }}
  //             onInput={(e) => {
  //               e.target.style.height = "auto";
  //               const maxHeight = 400;
  //               e.target.style.height = `${Math.min(
  //                 e.target.scrollHeight,
  //                 maxHeight
  //               )}px`;
  //             }}
  //           />
  //           <button
  //             className={styles.saveEditButton}
  //             onClick={() => handleSaveEdit(index)}
  //           >
  //             Send
  //           </button>
  //           <button
  //             className={styles.cancelEditButton}
  //             onClick={() => setEditingIndex(null)}
  //           >
  //             Cancel
  //           </button>
  //         </div>
  //       ) : msg.sender === "Brain" ? (
  //         <AssistantMessage message={msg} />
  //       ) : (
  //         <>
  //           <ReactMarkdown>
  //             {typeof msg?.content === "string"
  //               ? DOMPurify.sanitize(msg.content)
  //               : ""}
  //           </ReactMarkdown>
  //           {msg.sender === "Brain" && (
  //             <button
  //               className={styles.copyButton}
  //               onClick={() => handleCopy(msg.content, index)}
  //               aria-label="Copy message"
  //             >
  //               <span className="material-icons">
  //                 {copiedIndex === index ? "check_circle" : "content_copy"}
  //               </span>
  //             </button>
  //           )}
  //           {copiedIndex === index && (
  //             <div className={styles.copiedMessage}>Copied!</div>
  //           )}
  //         </>
  //       )}
  //     </div>
  //   ));
  // };



  const removeFile = () => {
    setFile(null);
  };

  const toggleMenu = () => {
    setMenuOpen((prev) => !prev); 
  };

  const handleProfileClick = () => {
    setShowProfile(true);
    setMenuOpen(false);
  };

  return (
    <div className={`${styles.app} ${styles[theme]}`}>
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
        <div className={styles.brand}>Brain</div>
        <img src={brain} alt="Logo" className={styles.logo} />
      </div>
      <div className={styles.headerRight}>
        <div className={styles.userMenuContainer}>
          <div className={styles.userButton} onClick={toggleMenu}>
            {userInitials}
          </div>
          {/* Pop-up Menu */}
          {menuOpen && (
            <div className={styles.userBottonPopupMenu}>
              <button onClick={handleProfileClick}>Profile</button>
              {/* <button onClick={toggleTheme}>Toggle Theme (Current: {theme})</button> */}
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
        {showProfile && (
          <div className={styles.modalOverlay}>
            <Profile onClose={() => setShowProfile(false)} />
          </div>
        )}
      <div className={styles.container}>
        {isSidebarVisible && (
          <div className={`${styles.chatSidebar} ${styles.visible}`}>
            <button onClick={toggleSidebar} className={styles.closeButton}>
                ×
            </button>
            <div className={styles.newChatVoiceModeButtonContainer}>
              <button onClick={handleNewChat} className={styles.newChatButton}>
              <span className={styles.buttonIcon}><FaPlusCircle /></span>
                <span className={styles.tooltip}>New Chat</span>
              </button>
              <button onClick={toggleVoiceMode} className={styles.voiceModeButton}>
                <span className={styles.buttonIcon}>< FaMicrophone /></span>
                <span className={styles.tooltip}>Voice Mode</span>
              </button>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className={`${styles.leaveAFeedBackButton} ${showFeedbackModal ? styles.active : ""}`}
              style={{ width: "100%" }}
            >
              Leave Feedback
            </button>
            <button
              ref={trendsButtonRef} 
              onClick={handleTrendsButtonClick}
              className={`${styles.checkTrendsButton} ${showTrendsPopup ? styles.active : ""}`}
              style={{ width: "100%" }}
            >
              Check Trends
            </button>

            {/* Trends Popup Menu */}
            {showTrendsPopup && (
             <div
             className={styles.trendsPopup}
            //  style={{
            //    position: "fixed",
            //    top: trendsButtonRef.current
            //      ? trendsButtonRef.current.getBoundingClientRect().bottom + 5
            //      : "auto",
            //    left: trendsButtonRef.current
            //      ? trendsButtonRef.current.getBoundingClientRect().left
            //      : "auto",
            //  }}
              >
                <button onClick={() => handleTrendSelection("Finance")}>Finance</button>
                <button onClick={() => handleTrendSelection("Career Trends")}>Career Trends</button>
                <button onClick={() => handleTrendSelection("Trending Courses")}>Trending Courses</button>
                <button onClick={() => handleTrendSelection("General News")}>General News</button>
              </div>
            )}
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
                          className={styles.renameChatInput}
                      />
                  ) : (
                    <span onClick={() => handleChatSelection(chat.id)}>
                      {chat.name || "Untitled Chat"}
                    </span>
                  )}
                  <button
                          className={styles.chatHistoryItemMenuButton}
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
              <strong>Welcome {userFirstName}, chat with Brain</strong>
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
                  className={styles.saveEditButton}
                  onClick={() => handleSaveEdit(index)}
                >
                  Send
                </button>
                <button
                  className={styles.cancelEditButton}
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
          <label htmlFor="fileInput" className={styles.uploadButton} title='upload ".pdf, .pptx, .docx, .xlxs, .xls files only. File size should be less than 1.6MB'>
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
                    className={styles.clearFileButton}
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
              accept=".pdf,.pptx,.docx,.xlxs,.xls" 
            />
          </form>
        </div>
      </div>

      {chatMenuInfo && (
            <div
              className={styles.chatHistoryItemMenuPopup}
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
          {showFeedbackModal && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <Feedback onClose={() => setShowFeedbackModal(false)} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatContainer;
