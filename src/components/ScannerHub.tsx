import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, hasRole } from '../utils/roleHelpers';
import Layout from './Layout';
import './ScannerHub.css';

const ScannerHub: React.FC = () => {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  return (
    <Layout>
      <div className="scanner-hub-container">
        <div className="scanner-hub-header">
          <h1>Scanner Management Hub</h1>
          <p>Choose a scanner management area based on your role and permissions</p>
        </div>

        <div className="scanner-hub-grid">
          {/* My Scanners - Available to all authenticated users */}
          <div className="scanner-hub-card">
            <div className="scanner-hub-card-icon">🔧</div>
            <h2>My Scanners</h2>
            <p>View and manage your personal scanner preferences and activated tools</p>
            <Link to="/my-scanners" className="scanner-hub-btn">
              Open My Scanners
            </Link>
          </div>

          {/* Tenant Scanner Tools - Available to tenant-admin */}
          {hasAccess('tenant-admin') && (
            <div className="scanner-hub-card">
              <div className="scanner-hub-card-icon">🏢</div>
              <h2>Tenant Scanner Tools</h2>
              <p>Enable and manage scanner tools available to your tenant</p>
              <Link to="/tenant-tools" className="scanner-hub-btn">
                Open Tenant Tools
              </Link>
            </div>
          )}

          {/* Admin Tools - Available to super-admin only */}
          {hasAccess('super-admin') && (
            <div className="scanner-hub-card">
              <div className="scanner-hub-card-icon">⚙️</div>
              <h2>Admin Tools</h2>
              <p>Manage the global scanner tool registry and system configuration</p>
              <Link to="/admin/scanner-tools" className="scanner-hub-btn scanner-hub-btn-admin">
                Open Admin Tools
              </Link>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="scanner-hub-info">
          <h3>About Scanner Management</h3>
          <div className="scanner-hub-info-content">
            <div className="info-item">
              <strong>My Scanners:</strong> Personal scanner preferences where you activate tools available to your tenant.
            </div>
            <div className="info-item">
              <strong>Tenant Tools:</strong> Manage which scanner tools are available to your organization.
            </div>
            {hasAccess('super-admin') && (
              <div className="info-item">
                <strong>Admin Tools:</strong> Manage the global scanner tool registry (super-admin only).
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScannerHub;

