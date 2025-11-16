// src/components/Layout.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole } from '../utils/roleHelpers';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const userRole = getUserRole(user);


  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="header-content">
          <Link to="/" className="logo-link">
            <h1>Camelot Security Platform</h1>
          </Link>
          <nav className="main-nav">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Dashboard
            </Link>
            <Link 
              to="/scanners" 
              className={`nav-link ${location.pathname.startsWith('/scanners') || location.pathname.startsWith('/admin/scanner-tools') || location.pathname.startsWith('/tenant-tools') || location.pathname.startsWith('/my-scanners') ? 'active' : ''}`}
            >
              Scanners
            </Link>
            <Link 
              to="/chat" 
              className={`nav-link ${location.pathname === '/chat' ? 'active' : ''}`}
            >
              Chat
            </Link>
            <Link 
              to="/assessment" 
              className={`nav-link ${location.pathname === '/assessment' ? 'active' : ''}`}
            >
              Assessment
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
            {(userRole === 'admin' || userRole === 'super-admin' || userRole === 'tenant-admin') && (
              <>
                <Link 
                  to="/settings/tenant" 
                  className={`nav-link ${
                    location.pathname === '/settings' || 
                    location.pathname === '/settings/tenant' ||
                    location.pathname.startsWith('/settings/api-keys') ||
                    location.pathname.startsWith('/settings/billing') ||
                    location.pathname.startsWith('/admin/users')
                      ? 'active' 
                      : ''
                  }`}
                >
                  Settings
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
              </>
            )}
          </nav>
          <div className="user-info">
            <Link 
              to="/profile" 
              className={`user-name-link ${location.pathname === '/profile' ? 'active' : ''}`}
            >
              Welcome, {user?.email || user?.username}
            </Link>
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="layout-main">
        {title && (
          <div className="page-title">
            <h2>{title}</h2>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};

export default Layout;

