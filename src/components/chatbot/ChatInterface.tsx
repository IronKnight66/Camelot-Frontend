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

interface ChatSession {
  session_id: string;
  tenant_id: number;
  user_id: string;
  session_name?: string | null;
  provider: string | null;
  model_name: string | null;
  message_count: number;
  created_at: string;
  last_message_at: string | null;
  messages: Message[];
}

interface ChatPreset {
  id?: number;
  tenant_id?: number;
  preset_number: number;
  title: string;
  message: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
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
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionName, setEditingSessionName] = useState('');
  const [chatPresets, setChatPresets] = useState<ChatPreset[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const hasAutoSentRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Create new session on mount and load session history and presets
    const initialize = async () => {
      await createNewSession();
      await loadChatSessions();
      await loadChatPresets();
    };
    initialize();
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
      
      // Refresh the session list after sending a message
      // This ensures the session appears in history with the updated message count
      console.log('💬 Message sent successfully, refreshing session list...');
      await loadChatSessions();

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

  const loadChatSessions = async () => {
    try {
      setLoadingSessions(true);
      console.log('🔄 Loading chat sessions...');
      const response = await ApiService.listChatSessions();
      console.log('✅ Loaded sessions:', response.sessions?.length, 'total sessions');
      console.log('📋 Sessions with messages:', response.sessions?.filter((s: ChatSession) => s.message_count > 0).length);
      console.log('📝 Session details:', response.sessions?.slice(0, 3).map((s: ChatSession) => ({
        id: s.session_id.substring(0, 8),
        count: s.message_count,
        messages: s.messages?.length
      })));
      setChatSessions(response.sessions || []);
    } catch (err: any) {
      console.error('Failed to load chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadChatPresets = async () => {
    try {
      const response = await ApiService.getChatPresets();
      setChatPresets(response.presets || []);
    } catch (err: any) {
      console.error('Failed to load chat presets:', err);
    }
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
      
      // Refresh the sessions list
      await loadChatSessions();
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
      
      // Refresh the session list after sending a message
      // This ensures the session appears in history with the updated message count
      console.log('💬 Message sent successfully, refreshing session list...');
      await loadChatSessions();

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
    // Simply create a new session without deleting the current one
    // The old session will be saved in the history
    console.log('🆕 Creating new chat, current session has', messages.length, 'messages');
    await createNewSession();
  };

  const loadSession = async (session: ChatSession) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading session:', session.session_id);
      
      const sessionData = await ApiService.getChatSession(session.session_id);
      console.log('Session data loaded:', sessionData);
      
      setSessionId(sessionData.session_id);
      
      // Load messages, or show empty state if no messages
      if (sessionData.messages && sessionData.messages.length > 0) {
        setMessages(sessionData.messages);
      } else {
        // If no messages in the session, show empty state
        setMessages([]);
      }
    } catch (err: any) {
      console.error('Failed to load session:', err);
      setError('Failed to load chat session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startRenaming = (session: ChatSession) => {
    setEditingSessionId(session.session_id);
    // Use session_name if available, otherwise use the generated title
    setEditingSessionName(session.session_name || getSessionTitle(session));
  };

  const cancelRenaming = () => {
    setEditingSessionId(null);
    setEditingSessionName('');
  };

  const saveSessionName = async (sessionId: string) => {
    if (!editingSessionName.trim()) {
      cancelRenaming();
      return;
    }

    try {
      await ApiService.updateChatSession(sessionId, editingSessionName.trim());
      
      // Update local state
      setChatSessions(prevSessions =>
        prevSessions.map(s =>
          s.session_id === sessionId
            ? { ...s, session_name: editingSessionName.trim() }
            : s
        )
      );
      
      cancelRenaming();
    } catch (err: any) {
      console.error('Failed to rename session:', err);
      setError('Failed to rename chat session. Please try again.');
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, sessionId: string) => {
    if (e.key === 'Enter') {
      saveSessionName(sessionId);
    } else if (e.key === 'Escape') {
      cancelRenaming();
    }
  };

  const handlePresetClick = async (preset: ChatPreset) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create new session
      const session = await ApiService.createChatSession();
      setSessionId(session.session_id);
      setMessages([]);
      
      // Auto-send the preset message
      const response = await ApiService.sendChatMessage(preset.message, session.session_id);
      
      const userMessage: Message = {
        role: 'user',
        content: preset.message,
        timestamp: new Date().toISOString()
      };
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString(),
        reportUrl: response.report_url || undefined
      };
      
      setMessages([userMessage, assistantMessage]);
      
      // Refresh session list
      await loadChatSessions();
      
      // Handle navigation if present
      if (response.action) {
        setTimeout(() => {
          handleNavigation(response.action!);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to use preset:', err);
      setError('Failed to send preset message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSessionTitle = (session: ChatSession): string => {
    // Use custom name if set
    if (session.session_name) {
      return session.session_name;
    }
    
    // Get first user message as title
    const firstUserMessage = session.messages?.find(m => m.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      const title = firstUserMessage.content.trim();
      return title.length > 50 ? title.substring(0, 50) + '...' : title;
    }
    
    // Fallback to formatted date
    const date = new Date(session.created_at);
    return `Chat from ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
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
              {loadingSessions ? (
                <div className="chat-history-loading">Loading sessions...</div>
              ) : (
                <div className="chat-history-list">
                  {chatSessions
                    .filter(session => session.message_count > 0)
                    .slice(0, 5)
                    .map((session) => (
                      <div
                        key={session.session_id}
                        className={`chat-history-item ${session.session_id === sessionId ? 'active' : ''}`}
                      >
                        <div className="chat-history-item-content" onClick={() => loadSession(session)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                          </svg>
                          {editingSessionId === session.session_id ? (
                            <input
                              type="text"
                              className="session-name-input"
                              value={editingSessionName}
                              onChange={(e) => setEditingSessionName(e.target.value)}
                              onKeyDown={(e) => handleRenameKeyPress(e, session.session_id)}
                              onBlur={() => saveSessionName(session.session_id)}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="session-title" title={getSessionTitle(session)}>{getSessionTitle(session)}</span>
                          )}
                          <span className="message-count">{session.message_count}</span>
                        </div>
                        <button
                          className="rename-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenaming(session);
                          }}
                          title="Rename chat"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  {chatSessions.filter(s => s.message_count > 0).length === 0 && (
                    <div className="chat-history-empty">No chat history yet</div>
                  )}
                  
                  {/* Chat Presets Section */}
                  {chatPresets.length > 0 && (
                    <>
                      <div className="chat-presets-separator"></div>
                      <div className="chat-presets-label">Quick Start</div>
                      {chatPresets
                        .filter(preset => preset.is_active)
                        .map((preset) => (
                          <div
                            key={preset.preset_number}
                            className="chat-preset-item"
                            onClick={() => handlePresetClick(preset)}
                            title={preset.message}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
                              <path d="M19 12l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3z"/>
                            </svg>
                            <span>{preset.title}</span>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              )}
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

