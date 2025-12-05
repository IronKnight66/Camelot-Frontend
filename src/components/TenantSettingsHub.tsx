import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, hasRole } from '../utils/roleHelpers';
import Layout from './Layout';
import './TenantSettingsHub.css';

// Tenant Settings Hub Component
const TenantSettingsHub: React.FC = () => {
  const { user } = useAuth();
  const userRole = getUserRole(user);

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  return (
    <Layout>
      <div className="tenant-settings-hub-container">
        <div className="tenant-settings-hub-header">
          <h1>Tenant Settings</h1>
          <p>Configure your tenant's settings and manage access</p>
        </div>

        <div className="tenant-settings-hub-grid">
          {/* User Management - Available to admin and above */}
          {hasAccess('admin') && (
            <div className="tenant-settings-hub-card">
              <div className="tenant-settings-hub-card-icon">👥</div>
              <h2>User Management</h2>
              <p>Manage users in your tenant: add, remove, enable/disable, and change roles</p>
              <Link to="/admin/users" className="tenant-settings-hub-btn">
                Open User Management
              </Link>
            </div>
          )}

          {/* Billing & Subscriptions - Available to admin and above */}
          {hasAccess('admin') && (
            <div className="tenant-settings-hub-card">
              <div className="tenant-settings-hub-card-icon">💳</div>
              <h2>Billing & Subscriptions</h2>
              <p>Manage your subscription plan, payment methods, and view invoices</p>
              <Link to="/settings/billing" className="tenant-settings-hub-btn">
                Open Billing
              </Link>
            </div>
          )}

          {/* Findings Configuration - Available to admin and above */}
          {hasAccess('admin') && (
            <div className="tenant-settings-hub-card">
              <div className="tenant-settings-hub-card-icon">🏷️</div>
              <h2>Findings Configuration</h2>
              <p>Configure custom severity and status levels for security findings</p>
              <Link to="/settings/findings-config" className="tenant-settings-hub-btn">
                Configure Findings
              </Link>
            </div>
          )}

          {/* AI Model Configuration - Available to admin and above */}
          {hasAccess('admin') && (
            <div className="tenant-settings-hub-card">
              <div className="tenant-settings-hub-card-icon">🤖</div>
              <h2>AI Model Configuration</h2>
              <p>Enable and manage AI models available to your team</p>
              <Link to="/settings/tenant-models" className="tenant-settings-hub-btn">
                Configure AI Models
              </Link>
            </div>
          )}
        </div>

        {hasAccess('super-admin') && (
          <div className="super-admin-section">
            <div className="super-admin-divider">
              <h3 className="super-admin-heading">Super Admin Settings</h3>
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
          </div>
        )}

        {/* Info box */}
          <div className="tenant-settings-hub-info">
            <h3>About Tenant Settings</h3>
            <div className="tenant-settings-hub-info-content">
              {hasAccess('admin') && (
                <div>
                  <div className="info-item">
                    <strong>User Management:</strong> Add, remove, enable/disable users, manage roles, and force password resets.
                  </div>
                  <div className="info-item">
                    <strong>Billing & Subscriptions:</strong> Manage subscription plans, payment methods, view invoices, and upgrade/downgrade plans.
                  </div>
                  {hasAccess('super-admin') && (
                    <div>
                      <div className="info-item">
                        <strong>Tenant Scanners:</strong> Add and manage scanner tools for specific tenants from the global registry.
                      </div>
                      <div className="info-item">
                        <strong>Stripe Configuration:</strong> Configure Stripe API keys and webhook secrets for the billing system.
                      </div>
                      <div className="info-item">
                        <strong>Subscription Plans:</strong> Create and manage subscription plans with pricing, features, limits, and Stripe price IDs.
                      </div>
                    </div>
                  )}
                </div>
              )}
              {hasAccess('super-admin') && (
                <div className="info-item">
                  <strong>Super Admin Settings:</strong> Manage the global scanner tool registry and system-wide configuration.
                </div>
              )}
              {!hasAccess('admin') && (
                <div className="info-item">
                  You need admin privileges to access tenant settings.
                </div>
              )}
            </div>
          </div>
      </div>
    </Layout>
  );
};

export default TenantSettingsHub;

