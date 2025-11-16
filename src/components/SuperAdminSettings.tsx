import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, hasRole } from '../utils/roleHelpers';
import Layout from './Layout';
import './TenantSettingsHub.css';

// Super Admin Settings Component
const SuperAdminSettings: React.FC = () => {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  if (!hasAccess('super-admin')) {
    return (
      <Layout>
        <div className="tenant-settings-hub-container">
          <div className="tenant-settings-hub-header">
            <h1>Access Denied</h1>
            <p>You need super-admin privileges to access global settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tenant-settings-hub-container">
        <div className="tenant-settings-hub-header">
          <h1>Super Admin Settings</h1>
          <p>Manage global system configuration and platform-wide settings</p>
        </div>

        <div className="tenant-settings-hub-grid">
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">🛠️</div>
            <h2>Tenant Scanners</h2>
            <p>Add scanner tools to tenants from the global registry</p>
            <Link to="/settings/tenant-scanners" className="tenant-settings-hub-btn">
              Manage Tenant Scanners
            </Link>
          </div>
          
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">⚙️</div>
            <h2>Global Scanner Registry</h2>
            <p>Manage the global scanner tool registry and system configuration</p>
            <Link to="/settings/admin/scanner-tools" className="tenant-settings-hub-btn" style={{ background: '#dc3545', color: 'white' }}>
              Open Global Registry
            </Link>
          </div>
          
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">💰</div>
            <h2>Stripe Configuration</h2>
            <p>Configure Stripe API keys and webhook secrets for billing</p>
            <Link to="/settings/stripe" className="tenant-settings-hub-btn" style={{ background: '#6772e5', color: 'white' }}>
              Configure Stripe
            </Link>
          </div>
          
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">📦</div>
            <h2>Subscription Plans</h2>
            <p>Manage subscription plans, pricing, features, and Stripe price IDs</p>
            <Link to="/settings/subscription-plans" className="tenant-settings-hub-btn" style={{ background: '#28a745', color: 'white' }}>
              Manage Plans
            </Link>
          </div>
        </div>

        {/* Info box */}
        <div className="tenant-settings-hub-info">
          <h3>About Super Admin Settings</h3>
          <div className="tenant-settings-hub-info-content">
            <div>
              <div className="info-item">
                <strong>Tenant Scanners:</strong> Add and manage scanner tools for specific tenants from the global registry.
              </div>
              <div className="info-item">
                <strong>Global Scanner Registry:</strong> Manage the global scanner tool registry, add new tools, configure execution methods, and set system-wide defaults.
              </div>
              <div className="info-item">
                <strong>Stripe Configuration:</strong> Configure Stripe API keys and webhook secrets for the billing system.
              </div>
              <div className="info-item">
                <strong>Subscription Plans:</strong> Create and manage subscription plans with pricing, features, limits, and Stripe price IDs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminSettings;

