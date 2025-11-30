// src/components/Layout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../utils/roleHelpers';
import { useChatbot } from '../contexts/ChatbotContext';
import ChatbotSidebar from './chatbot/ChatbotSidebar';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  /** When true, renders a slim header with minimal chrome for hero-style pages */
  minimal?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, title, minimal = false }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const userRole = getUserRole(user);
  
  // Get chatbot state - ChatbotProvider wraps Router, so this should always be available
  const chatbot = useChatbot();
  const isOpen = chatbot.isOpen;


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className={`layout-container ${minimal ? 'layout-container-hero' : ''}`}>
      <header className={`layout-header camelot-cyber-app-header ${minimal ? 'layout-header-minimal' : ''}`}>
        <div className="header-content">
          <Link to="/chat" className="logo-link">
            <h1 className="camelot-cyber-app-title">Camelot Security Platform</h1>
          </Link>
          {!minimal && (
            <nav className="main-nav camelot-cyber-app-nav">
              <Link 
                to="/assessment" 
                className={`nav-link ${location.pathname === '/assessment' ? 'active' : ''}`}
              >
                Assessment
              </Link>
              <Link 
                to="/findings" 
                className={`nav-link ${location.pathname === '/findings' ? 'active' : ''}`}
              >
                Findings
              </Link>
              <Link 
                to="/metrics" 
                className={`nav-link ${location.pathname === '/metrics' ? 'active' : ''}`}
              >
                Metrics
              </Link>
              <Link 
                to="/reports" 
                className={`nav-link ${location.pathname === '/reports' ? 'active' : ''}`}
              >
                Reports
              </Link>
              {userRole === 'super-admin' && (
                <Link 
                  to="/settings/admin" 
                  className={`nav-link ${
                    location.pathname === '/settings/admin' ||
                    location.pathname.startsWith('/settings/admin/scanner-tools') ||
                    location.pathname.startsWith('/settings/tenant-scanners') ||
                    location.pathname.startsWith('/settings/stripe') ||
                    location.pathname.startsWith('/settings/subscription-plans')
                      ? 'active' 
                      : ''
                  }`}
                >
                  Super Admin
                </Link>
              )}
            </nav>
          )}
          <div className="user-info">
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className={`layout-main ${isOpen && !minimal ? 'with-sidebar' : ''} ${minimal ? 'layout-main-hero' : ''}`}>
        {title && (
          <div className="page-title">
            <h2>{title}</h2>
          </div>
        )}
        {children}
      </main>

      {/* Persistent Chatbot Sidebar - hidden on minimal hero pages to keep focus on central prompt */}
      {!minimal && <ChatbotSidebar />}

      {/* Footer with attribution */}
      <footer className="layout-footer">
        <div className="footer-content">
          <p className="attribution-text">
            Medieval icons by <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer">Game-icons.net</a> licensed under <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

