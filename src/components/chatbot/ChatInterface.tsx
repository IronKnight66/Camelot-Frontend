/**
 * ChatInterface Component
 * 
 * ARCHITECTURE: All chatbot interactions go through the backend API.
 * - Never makes direct calls to AI providers (OpenAI, Anthropic, Bedrock)
 * - All communication via ApiService → Backend API → AI Provider
 * - API keys are never exposed to this component
 * - See backend CHATBOT_ARCHITECTURE.md for full data flow documentation
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import ApiService from '../../services/api';
import './ChatInterface.css';

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

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Create new session on mount
    createNewSession();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const createNewSession = async () => {
    try {
      const session = await ApiService.createChatSession();
      setSessionId(session.session_id);
      
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your security orchestration assistant. I can help you with scans, findings, scanner tools, and navigate you to different parts of the platform. How can I help you today?'
      }]);
    } catch (err: any) {
      console.error('Failed to create session:', err);
      setError('Failed to initialize chat session. Please refresh the page.');
    }
  };

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
        navigate('/settings');
        break;
      case 'navigate_metrics':
        navigate('/metrics');
        break;
      case 'navigate_scanner_config':
        navigate('/settings');
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
    if (!sessionId) return;
    
    try {
      await ApiService.clearChatSession(sessionId);
      await createNewSession();
    } catch (err: any) {
      console.error('Failed to clear session:', err);
      setError('Failed to clear session. Please refresh the page.');
    }
  };

  return (
    <Layout>
      <div className="chat-interface-container">
        <div className="chat-header">
          <h1>Security Assistant</h1>
          <button 
            onClick={handleClearSession} 
            className="clear-session-btn"
            title="Start a new conversation"
          >
            New Chat
          </button>
        </div>

        {error && (
          <div className="chat-error">
            {error}
          </div>
        )}

        <div className="chat-messages">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`chat-message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
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
            <div className="chat-message assistant-message">
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

        <div className="chat-input-container">
          <textarea
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here... (Press Enter to send, Shift+Enter for new line)"
            rows={3}
            disabled={loading || !sessionId}
          />
          <button
            className="send-button"
            onClick={handleSend}
            disabled={!input.trim() || loading || !sessionId}
          >
            Send
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ChatInterface;

