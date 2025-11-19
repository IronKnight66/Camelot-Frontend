import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, hasRole } from '../utils/roleHelpers';
import Layout from './Layout';
import './TenantSettingsHub.css';

// Tenant Admin Settings Component
const TenantAdminSettings: React.FC = () => {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  if (!hasAccess('admin')) {
    return (
      <Layout>
        <div className="tenant-settings-hub-container">
          <div className="tenant-settings-hub-header">
            <h1>Access Denied</h1>
            <p>You need admin privileges to access tenant settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tenant-settings-hub-container">
        <div className="tenant-settings-hub-header">
          <h1>Tenant Settings</h1>
          <p>Configure your tenant's settings and manage access</p>
        </div>

        <div className="tenant-settings-hub-grid">
          {/* User Management - Available to admin and above */}
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">👥</div>
            <h2>User Management</h2>
            <p>Manage users in your tenant: add, remove, enable/disable, and change roles</p>
            <Link to="/admin/users" className="tenant-settings-hub-btn">
              Open User Management
            </Link>
          </div>

          {/* API Keys - Available to admin and above */}
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">🔑</div>
            <h2>API Keys</h2>
            <p>Manage API keys for AI providers and external services</p>
            <Link to="/settings/api-keys" className="tenant-settings-hub-btn">
              Open API Keys
            </Link>
          </div>

          {/* Billing & Subscriptions - Available to admin and above */}
          <div className="tenant-settings-hub-card">
            <div className="tenant-settings-hub-card-icon">💳</div>
            <h2>Billing & Subscriptions</h2>
            <p>Manage your subscription plan, payment methods, and view invoices</p>
            <Link to="/settings/billing" className="tenant-settings-hub-btn">
              Open Billing
            </Link>
          </div>

          {/* Tenant Scanner Tools - Available to tenant-admin */}
          {hasAccess('tenant-admin') && (
            <div className="tenant-settings-hub-card">
              <div className="tenant-settings-hub-card-icon">🔧</div>
              <h2>Scanner Tools</h2>
              <p>Enable and manage scanner tools available to your tenant</p>
              <Link to="/settings/tenant-tools" className="tenant-settings-hub-btn">
                Open Scanner Tools
              </Link>
            </div>
          )}
        </div>

        {/* Info box */}
        <div className="tenant-settings-hub-info">
          <h3>About Tenant Settings</h3>
          <div className="tenant-settings-hub-info-content">
            <div>
              <div className="info-item">
                <strong>User Management:</strong> Add, remove, enable/disable users, manage roles, and force password resets.
              </div>
              <div className="info-item">
                <strong>API Keys:</strong> Manage API keys for AI providers (OpenAI, Anthropic, Bedrock) and external services.
              </div>
              <div className="info-item">
                <strong>Billing & Subscriptions:</strong> Manage subscription plans, payment methods, view invoices, and upgrade/downgrade plans.
              </div>
              {hasAccess('tenant-admin') && (
                <div className="info-item">
                  <strong>Scanner Tools:</strong> Enable and manage scanner tools available to your tenant, set usage limits, and monitor tool usage.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TenantAdminSettings;

