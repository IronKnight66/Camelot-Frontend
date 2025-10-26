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
            {(userRole === 'super-admin' || userRole === 'tenant-admin') && (
              <Link 
                to="/tenant-tools" 
                className={`nav-link ${location.pathname === '/tenant-tools' ? 'active' : ''}`}
              >
                Scanner Tools
              </Link>
            )}
            {userRole === 'super-admin' && (
              <Link 
                to="/admin/scanner-tools" 
                className={`nav-link ${location.pathname === '/admin/scanner-tools' ? 'active' : ''}`}
              >
                Admin Tools
              </Link>
            )}
            <Link 
              to="/my-scanners" 
              className={`nav-link ${location.pathname === '/my-scanners' ? 'active' : ''}`}
            >
              My Scanners
            </Link>
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

