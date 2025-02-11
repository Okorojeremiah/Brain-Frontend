import { useState, useEffect, useCallback } from 'react';
import axios from '../api';

const ChatHistory = () => {
    const [chatHistory, setChatHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedChat, setSelectedChat] = useState(null);

    const categorizeChatHistory = useCallback((history) => {
        const categorized = {
            today: [],
            yesterday: [],
            last7Days: [],
            last30Days: [],
            byMonth: {}
        };

        const now = new Date();

        history.forEach((record) => {
            const { timestamp, interaction } = record;
            const messageDate = new Date(timestamp);
            const formattedDate = messageDate.toLocaleDateString();

            if (isToday(messageDate, now)) {
                categorized.today.push({ timestamp: formattedDate, query: interaction.query, response: interaction.response, conversationId: record.id });
            } else if (isYesterday(messageDate, now)) {
                categorized.yesterday.push({ timestamp: formattedDate, query: interaction.query, response: interaction.response, conversationId: record.id });
            } else if (isWithinLastNDays(messageDate, now, 7)) {
                categorized.last7Days.push({ timestamp: formattedDate, query: interaction.query, response: interaction.response, conversationId: record.id });
            } else if (isWithinLastNDays(messageDate, now, 30)) {
                categorized.last30Days.push({ timestamp: formattedDate, query: interaction.query, response: interaction.response, conversationId: record.id });
            } else {
                const monthYear = `${messageDate.getMonth() + 1}-${messageDate.getFullYear()}`;
                if (!categorized.byMonth[monthYear]) {
                    categorized.byMonth[monthYear] = [];
                }
                categorized.byMonth[monthYear].push({ timestamp: formattedDate, query: interaction.query, response: interaction.response, conversationId: record.id });
            }
        });

        return categorized;
    }, []);

    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get('/chat-history', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const history = response.data.history;

                if (history) {
                    // Categorize chat data
                    const categorized = categorizeChatHistory(history);
                    setChatHistory(categorized);
                } else {
                    setError("No chat history found.");
                }
            } catch (error) {
                console.error("Error fetching chat history:", error);
                setError("Failed to fetch chat history. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchChatHistory();
    }, [categorizeChatHistory]);

    const handleChatClick = (chatId) => {
        const selected = [...chatHistory.today, ...chatHistory.yesterday, ...chatHistory.last7Days, ...chatHistory.last30Days, ...Object.values(chatHistory.byMonth).flat()]
            .find(chat => chat.conversationId === chatId);
        setSelectedChat(selected);
    };

    // Helper functions to determine date categories
    const isToday = (messageDate, currentDate) => {
        return messageDate.toLocaleDateString() === currentDate.toLocaleDateString();
    };

    const isYesterday = (messageDate, currentDate) => {
        const yesterday = new Date(currentDate);
        yesterday.setDate(yesterday.getDate() - 1);
        return messageDate.toLocaleDateString() === yesterday.toLocaleDateString();
    };

    const isWithinLastNDays = (messageDate, currentDate, n) => {
        const pastDate = new Date(currentDate);
        pastDate.setDate(pastDate.getDate() - n);
        return messageDate >= pastDate && messageDate <= currentDate;
    };

    // Render the categorized chat history
    const renderChatHistory = () => {
        return (
            <div>
                {renderCategorySection("Today", chatHistory.today)}
                {renderCategorySection("Yesterday", chatHistory.yesterday)}
                {renderCategorySection("Last 7 Days", chatHistory.last7Days)}
                {renderCategorySection("Last 30 Days", chatHistory.last30Days)}
                {renderMonthSections()}
            </div>
        );
    };

    const renderCategorySection = (title, items) => {
        if (items.length === 0) return null;
        return (
            <div>
                <h3>{title}</h3>
                <ul>
                    {items.map((item, index) => (
                        <li key={index} onClick={() => handleChatClick(item.conversationId)} style={{ cursor: 'pointer' }}>
                            <strong>{item.query}</strong> - {item.timestamp}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    const renderMonthSections = () => {
        return Object.keys(chatHistory.byMonth).map((monthYear) => {
            return (
                <div key={monthYear}>
                    <h3>{monthYear}</h3>
                    <ul>
                        {chatHistory.byMonth[monthYear].map((item, index) => (
                            <li key={index} onClick={() => handleChatClick(item.conversationId)} style={{ cursor: 'pointer' }}>
                                <strong>{item.query}</strong> - {item.timestamp}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        });
    };

    return (
        <div>
            {loading && <p>Loading chat history...</p>}
            {error && <p>{error}</p>}
            {!loading && !error && renderChatHistory()}
            {selectedChat && (
                <div>
                    <h3>Conversation: {selectedChat.query}</h3>
                    <ul>
                        {selectedChat.map((message, index) => (
                            <li key={index}>
                                <strong>Query:</strong> {message.query}
                                <br />
                                <strong>Response:</strong> {message.response}
                                <br />
                                <strong>Timestamp:</strong> {message.timestamp}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default ChatHistory;
