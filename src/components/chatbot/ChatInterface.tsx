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
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';
import SettingsModal from '../settings/SettingsModal';
import ProfileModal from '../profile/ProfileModal';
import ReportDownload from '../ReportDownload';
import './ChatInterface.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  reportUrl?: string;
}

interface ChatAction {
  type: string;
  url: string;
}

interface ChatResponse {
  response: string;
  session_id: string;
  action?: ChatAction | null;
  report_url?: string | null;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [settingsModalCategory, setSettingsModalCategory] = useState<'general' | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Create new session on mount
    createNewSession();
  }, []);

  useEffect(() => {
    // If we navigated here with an initial prompt (from the home hero),
    // automatically send it once the session exists.
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt && sessionId && messages.length > 0 && !hasAutoSentRef.current) {
      hasAutoSentRef.current = true; // Mark as sent immediately to prevent re-triggers
      
      // Auto-send the message
      const sendInitialMessage = async () => {
        const userMessage: Message = {
          role: 'user',
          content: state.initialPrompt!.trim(),
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]);
        setLoading(true);
        setError(null);

        try {
          const response: ChatResponse = await ApiService.sendChatMessage(state.initialPrompt!.trim(), sessionId);
          
          console.log('🔵 AUTO-SEND - FULL API RESPONSE:', JSON.stringify(response, null, 2));
          
          const assistantMessage: Message = {
            role: 'assistant',
            content: response.response,
            timestamp: new Date().toISOString(),
            reportUrl: response.report_url || undefined
          };

          setMessages(prev => [...prev, assistantMessage]);

          // Handle navigation action if present
          if (response.action) {
            setTimeout(() => {
              handleNavigation(response.action!);
            }, 1000);
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

      sendInitialMessage();
      
      // Clear the location state to prevent re-sending on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, sessionId, messages.length, navigate]);

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
        content: 'Hello! I\'m Arthur, your security orchestration assistant. I can help you with scans, findings, scanner tools, and navigate you to different parts of the platform. How can I help you today?'
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
      
      // EXTENSIVE DEBUG LOGGING
      console.log('🔵 FULL API RESPONSE:', JSON.stringify(response, null, 2));
      console.log('🔵 report_url field:', response.report_url);
      console.log('🔵 report_url type:', typeof response.report_url);
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        reportUrl: response.report_url || undefined
      };
      
      console.log('🔵 Created message object:', JSON.stringify(assistantMessage, null, 2));

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

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const email = user.email;
    return email.charAt(0).toUpperCase();
  };

  // Handle user menu toggle
  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Handle menu item click
  const handleMenuClick = (path: string) => {
    setIsUserMenuOpen(false);
    if (path === '/settings/tenant') {
      setSettingsModalCategory('general');
      setIsSettingsModalOpen(true);
    } else if (path === '/profile') {
      setIsProfileModalOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="chat-interface-layout">
      {/* Left Sidebar */}
      <div className={`chat-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="chat-sidebar-header">
          <button 
            className="new-chat-btn"
            onClick={handleClearSession}
            title="Start a new conversation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            <span>New chat</span>
          </button>
          <button 
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 17l5-5-5-5M6 17l5-5-5-5"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 17l-5-5 5-5M18 17l-5-5 5-5"/>
              </svg>
            )}
          </button>
        </div>
        
        {!sidebarCollapsed && (
          <div className="chat-sidebar-content">
            <div className="chat-history-section">
              <div className="chat-history-item active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span>Current conversation</span>
              </div>
            </div>
          </div>
        )}

        <div className="chat-sidebar-footer">
          <div className="user-menu-container" ref={userMenuRef}>
            <button 
              className="user-profile-btn"
              onClick={toggleUserMenu}
            >
              <div className="user-avatar">
                {getUserInitials()}
              </div>
              {!sidebarCollapsed && <span>{user?.email}</span>}
              {!sidebarCollapsed && (
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                  className={`user-menu-arrow ${isUserMenuOpen ? 'open' : ''}`}
                >
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              )}
            </button>
            {isUserMenuOpen && (
              <div className="user-menu-dropdown">
                <button 
                  className="user-menu-item"
                  onClick={() => handleMenuClick('/profile')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Profile</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleMenuClick('/settings/tenant')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m8.48 0l-4.24-4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m0-4.48l4.24 4.24"/>
                  </svg>
                  <span>Settings</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleMenuClick('/assessment')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  <span>Assessments</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleMenuClick('/metrics')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  <span>Metrics</span>
                </button>
                <button 
                  className="user-menu-item"
                  onClick={() => handleMenuClick('/reports')}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
                  </svg>
                  <span>Reports</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="chat-main-area">
        {error && (
          <div className="chat-error-banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <div className="chat-messages-container">
          {messages.map((message, index) => {
            // Debug each message as we render
            if (message.role === 'assistant') {
              console.log(`🔵 Rendering assistant message #${index}:`, {
                hasReportUrl: !!message.reportUrl,
                reportUrl: message.reportUrl
              });
            }
            
            return (
              <div
                key={index}
                className={`chat-message-row ${message.role === 'user' ? 'user-row' : 'assistant-row'}`}
              >
                <div className="chat-message-wrapper">
                  <div className="message-avatar">
                    {message.role === 'assistant' ? (
                      <img 
                        src="/assets/images/knight.png" 
                        alt="Arthur" 
                        className="avatar-img"
                      />
                    ) : (
                      <div className="user-avatar-circle">
                        {getUserInitials()}
                      </div>
                    )}
                  </div>
                  <div className="message-content-area">
                    <div className="message-header">
                      <span className="message-author">
                        {message.role === 'assistant' ? 'Arthur' : 'You'}
                      </span>
                    </div>
                    <div className="message-text">
                      {message.content}
                    </div>
                    {message.reportUrl && (
                      <>
                        {console.log('🎨 RENDERING REPORT DOWNLOAD COMPONENT:', message.reportUrl)}
                        <ReportDownload 
                          reportUrl={message.reportUrl}
                          format={message.reportUrl.endsWith('.pdf') ? 'pdf' : message.reportUrl.endsWith('.xlsx') ? 'excel' : 'html'}
                          generatedAt={message.timestamp}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          {loading && (
            <div className="chat-message-row assistant-row">
              <div className="chat-message-wrapper">
                <div className="message-avatar">
                  <img 
                    src="/assets/images/knight.png" 
                    alt="Arthur" 
                    className="avatar-img"
                  />
                </div>
                <div className="message-content-area">
                  <div className="message-header">
                    <span className="message-author">Arthur</span>
                  </div>
                  <div className="message-text">
                    <div className="typing-indicator-modern">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input-field"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message Arthur..."
              rows={1}
              disabled={loading || !sessionId}
            />
            <button
              className="send-button-modern"
              onClick={handleSend}
              disabled={!input.trim() || loading || !sessionId}
              title="Send message"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => {
          setIsSettingsModalOpen(false);
          setSettingsModalCategory(undefined);
        }}
        initialCategory={settingsModalCategory}
      />

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default ChatInterface;

