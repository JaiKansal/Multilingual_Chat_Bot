import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// ... IMessage interface stays the same ...
interface IMessage {
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const sessionId = `web-session-${Date.now()}`;
const API_URL = 'http://localhost:3001/api/chat';

// --- Accept Props ---
interface ChatWindowProps {
  botId: 'support' | 'sales'; // Define the prop
}

// --- Use the prop ---
const ChatWindow: React.FC<ChatWindowProps> = ({ botId }) => {
  const [messages, setMessages] = useState<IMessage[]>([]); // Start empty
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- New: Set initial message based on botId ---
  useEffect(() => {
    setMessages([
      {
        sender: 'bot',
        text:
          botId === 'support'
            ? 'Welcome to Support! How can I help?'
            : 'Welcome to Sales! Interested in a demo?',
        timestamp: new Date(),
      },
    ]);
  }, [botId]); // Re-run if the botId prop ever changed

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: IMessage = {
      sender: 'user',
      text: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        message: input,
        sessionId: sessionId,
        botId: botId, // <-- SEND THE BOT ID TO THE BACKEND
      });

      const botMessage: IMessage = {
        sender: 'bot',
        text: response.data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: IMessage = {
        sender: 'bot',
        text: 'Oops! Something went wrong. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-window">
        <div className="chat-header">
          <h3>{botId === 'support' ? '🛠️ Support Assistant' : '💼 Sales Assistant'}</h3>
          <div className="bot-status">
            <div className="status-dot"></div>
            Online
          </div>
        </div>
        <div className="message-list">
        {/* ... messages.map(...) stays the same ... */}
         {messages.map((msg, index) => (
          <div key={index} className={`message-wrapper ${msg.sender}`}>
            <div className="message-content">
              <div className="avatar">{msg.sender === 'bot' ? (botId === 'support' ? 'S' : 'B') : 'U'}</div>
              <div className="text-bubble">
                {msg.text}
                <span className="timestamp">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* ... isLoading indicator stays the same ... */}
        {isLoading && (
           <div className="message-wrapper bot">
             <div className="message-content">
               <div className="avatar">{botId === 'support' ? 'S' : 'B'}</div>
               <div className="text-bubble typing-indicator">
                 <span></span>
                 <span></span>
                 <span></span>
               </div>
             </div>
           </div>
         )}
          <div ref={messagesEndRef} />
        </div>

        <form className="message-form" onSubmit={sendMessage}>
        {/* ... form content stays the same ... */}
         <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading} className="send-button">
          Send
        </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;