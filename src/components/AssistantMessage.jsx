// import { useState } from "react";
// import PropTypes from "prop-types";
// import ReactMarkdown from "react-markdown";
// import DOMPurify from "dompurify";
// import styles from "../styles/Chat.module.css";

// const AssistantMessage = ({ message }) => {
//   const [currentEditIndex, setCurrentEditIndex] = useState(0);

//   const handlePrevious = () => {
//     if (currentEditIndex > 0) {
//       setCurrentEditIndex(currentEditIndex - 1);
//     }
//   };

//   const handleNext = () => {
//     if (currentEditIndex < (message.edits?.length || 0)) {
//       setCurrentEditIndex(currentEditIndex + 1);
//     }
//   };

//   return (
//     <div className={styles.assistantMessage}>
//       <ReactMarkdown>
//         {message.edits && message.edits.length > 0
//           ? DOMPurify.sanitize(message.edits[currentEditIndex])
//           : DOMPurify.sanitize(message.content)}
//       </ReactMarkdown>
//       {message.edits && message.edits.length > 0 && (
//         <div className={styles.editNavigation}>
//           <button onClick={handlePrevious} disabled={currentEditIndex === 0}>
//             &lt;
//           </button>
//           <span>{`${currentEditIndex + 1}/${message.edits.length + 1}`}</span>
//           <button
//             onClick={handleNext}
//             disabled={currentEditIndex === message.edits.length}
//           >
//             &gt;
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// AssistantMessage.propTypes = {
//   message: PropTypes.shape({
//     content: PropTypes.string.isRequired,
//     edits: PropTypes.arrayOf(PropTypes.string)
//   }).isRequired,
// };

// export default AssistantMessage;
