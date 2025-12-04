import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserRole, hasRole } from '../utils/roleHelpers';
import Layout from './Layout';
import TenantManagement from './admin/TenantManagement';
import TenantScanners from './settings/TenantScanners';
import AdminScannerTools from './scanner/AdminScannerTools';
import StripeSettings from './admin/StripeSettings';
import SubscriptionPlans from './admin/SubscriptionPlans';
import SystemPrompts from './admin/SystemPrompts';
import ScanTypes from './admin/ScanTypes';
import SuperAdminAPIKeys from './admin/SuperAdminAPIKeys';
import './SuperAdminSettings.css';

type SuperAdminSection = 'tenants' | 'tenant-scanners' | 'scanner-registry' | 'stripe' | 'subscriptions' | 'prompts' | 'scan-types' | 'api-keys';

// Super Admin Settings Component
const SuperAdminSettings: React.FC = () => {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const [activeSection, setActiveSection] = useState<SuperAdminSection>('tenants');

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  if (!hasAccess('super-admin')) {
    return (
      <Layout>
        <div className="super-admin-container">
          <div className="super-admin-access-denied">
            <h1>Access Denied</h1>
            <p>You need super-admin privileges to access global settings.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const menuItems: Array<{ id: SuperAdminSection; label: string; icon: string }> = [
    { id: 'tenants', label: 'Tenant Management', icon: '🏢' },
    { id: 'tenant-scanners', label: 'Tenant Scanners', icon: '🛠️' },
    { id: 'scanner-registry', label: 'Global Scanner Registry', icon: '⚙️' },
    { id: 'api-keys', label: 'API Keys', icon: '🔑' },
    { id: 'stripe', label: 'Stripe Configuration', icon: '💰' },
    { id: 'subscriptions', label: 'Subscription Plans', icon: '📦' },
    { id: 'prompts', label: 'System Prompts', icon: '💬' },
    { id: 'scan-types', label: 'Supported Scan Types', icon: '🎯' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'tenants':
        return <TenantManagement />;
      case 'tenant-scanners':
        return <TenantScanners />;
      case 'scanner-registry':
        return <AdminScannerTools />;
      case 'api-keys':
        return <SuperAdminAPIKeys />;
      case 'stripe':
        return <StripeSettings />;
      case 'subscriptions':
        return <SubscriptionPlans />;
      case 'prompts':
        return <SystemPrompts />;
      case 'scan-types':
        return <ScanTypes />;
      default:
        return <TenantManagement />;
    }
  };

  return (
    <Layout>
      <div className="super-admin-container">
        <div className="super-admin-layout">
          <div className="super-admin-sidebar">
            <div className="super-admin-sidebar-header">
              <h2>Super Admin</h2>
            </div>
            <nav className="super-admin-menu">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  className={`super-admin-menu-item ${activeSection === item.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className="super-admin-menu-icon">{item.icon}</span>
                  <span className="super-admin-menu-label">{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="super-admin-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SuperAdminSettings;

