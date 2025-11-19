/**
 * ChatbotSidebar Component
 * 
 * A persistent chatbot sidebar that appears on the right side of every page.
 * The conversation persists across page navigation using ChatbotContext.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChatbot } from '../../contexts/ChatbotContext';
import ApiService from '../../services/api';
import './ChatbotSidebar.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatAction {
  type: string;
  url: string;
}

interface ChatResponse {
  response: string;
  session_id: string;
  action?: ChatAction | null;
}

const ChatbotSidebar: React.FC = () => {
  const { user } = useAuth();
  const { sessionId, isOpen, setIsOpen, clearSession } = useChatbot();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show chatbot on the chat page (it has its own full chat interface)
  const isOnChatPage = location.pathname === '/chat';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    if (!sessionId || !user) return;

    try {
      const session = await ApiService.getChatSession(sessionId);
      if (session && session.messages && session.messages.length > 0) {
        const loadedMessages: Message[] = session.messages.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        }));
        setMessages(loadedMessages);
      } else {
        // Add welcome message if no history
        setMessages([{
          role: 'assistant',
          content: 'Hello! I\'m Arthur, your security orchestration assistant. I can help you with scans, findings, scanner tools, and navigate you to different parts of the platform. How can I help you today?'
        }]);
      }
    } catch (err: any) {
      console.error('Failed to load conversation history:', err);
      // Add welcome message on error
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m Arthur, your security orchestration assistant. I can help you with scans, findings, scanner tools, and navigate you to different parts of the platform. How can I help you today?'
      }]);
    }
  };

  // Load conversation history when session is available
  useEffect(() => {
    if (sessionId && isOpen && messages.length === 0 && user) {
      loadConversationHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isOpen, user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  // Don't show chatbot if user is not authenticated or on chat page
  if (!user || isOnChatPage) {
    return null;
  }

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response: ChatResponse = await ApiService.sendChatMessage(input.trim(), sessionId);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle navigation action if present
      if (response.action) {
        setTimeout(() => {
          handleNavigation(response.action!);
        }, 1000); // Small delay to show the message
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError(err.response?.data?.error?.message || 'Failed to send message. Please try again.');
      
      const errorMessage: Message = {
        role: 'assistant',
        content: 'I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (action: ChatAction) => {
    switch (action.type) {
      case 'navigate_assessment':
        navigate('/assessment');
        break;
      case 'navigate_settings':
        navigate('/settings/tenant');
        break;
      case 'navigate_metrics':
        navigate('/metrics');
        break;
      case 'navigate_scanner_config':
        navigate('/settings/tenant');
        break;
      default:
        console.warn('Unknown action type:', action.type);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearSession = async () => {
    setMessages([]);
    await clearSession();
    // Welcome message will be added by loadConversationHistory
    setTimeout(() => {
      loadConversationHistory();
    }, 100);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isOpen) {
    // Don't show toggle button on chat page
    if (isOnChatPage) {
      return null;
    }
    
    return (
      <div className="chatbot-sidebar-closed">
        <button
          className="chatbot-toggle-btn"
          onClick={() => setIsOpen(true)}
          title="Open Arthur Chatbot"
          aria-label="Open chatbot"
        >
          <span className="chatbot-icon">💬</span>
          <span className="chatbot-badge">Arthur</span>
        </button>
      </div>
    );
  }

  return (
    <div className={`chatbot-sidebar ${isMinimized ? 'minimized' : ''}`}>
      <div className="chatbot-sidebar-header">
        <div className="chatbot-header-content">
          <h3>Arthur</h3>
          <div className="chatbot-header-actions">
            <button
              onClick={handleClearSession}
              className="chatbot-clear-btn"
              title="Start a new conversation"
              aria-label="Clear conversation"
            >
              🗑️
            </button>
            <button
              onClick={toggleMinimize}
              className="chatbot-minimize-btn"
              title={isMinimized ? "Expand" : "Minimize"}
              aria-label={isMinimized ? "Expand chatbot" : "Minimize chatbot"}
            >
              {isMinimized ? '▲' : '▼'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="chatbot-close-btn"
              title="Close chatbot"
              aria-label="Close chatbot"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <>
          {error && (
            <div className="chatbot-error">
              {error}
            </div>
          )}

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`chatbot-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-content">
                  {message.content}
                </div>
                {message.timestamp && (
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="chatbot-message assistant-message">
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-container">
            <textarea
              className="chatbot-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Enter to send)"
              rows={2}
              disabled={loading || !sessionId}
            />
            <button
              className="chatbot-send-button"
              onClick={handleSend}
              disabled={!input.trim() || loading || !sessionId}
            >
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatbotSidebar;

