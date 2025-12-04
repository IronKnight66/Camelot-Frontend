import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, hasRole } from '../../utils/roleHelpers';
import ApiService from '../../services/api';
import { ScannerTool } from '../../types/scanner';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: SettingsCategory;
}

type SettingsCategory = 'general' | 'users' | 'billing' | 'scanner-tools' | 'findings-config' | 'chat-presets' | 'super-admin';

interface User {
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  groups?: string[];
  created_at?: string;
  last_login?: string;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  subscription_plan?: string;
  subscription_status?: string;
  contact_email?: string;
  contact_name?: string;
  created_at: string;
  updated_at: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'viewer'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await ApiService.createUser({
        email,
        role,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      if (result.temp_password) {
        setTempPassword(result.temp_password);
        setSuccess('User created successfully! Please save the temporary password before closing this dialog.');
      } else {
        setSuccess('User created successfully!');
        setTimeout(() => {
          onUserCreated();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (tempPassword) {
      setTempPassword(null);
    } else {
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('user');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <div className="settings-nested-modal-overlay" onClick={handleClose}>
      <div className="settings-nested-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="settings-nested-modal-header">
          <h3>Create New User</h3>
          <button className="settings-nested-modal-close" onClick={handleClose}>×</button>
        </div>
        
        {tempPassword ? (
          <div className="settings-nested-modal-body">
            <div className="settings-temp-password-box">
              <h4>User Created Successfully!</h4>
              <p>Please save this temporary password and provide it to the user securely:</p>
              <div className="settings-temp-password">{tempPassword}</div>
              <p className="settings-temp-password-warning">
                The user will be required to change this password on first login.
              </p>
            </div>
            <div className="settings-nested-modal-actions">
              <button type="button" onClick={() => {
                onUserCreated();
                onClose();
              }}>Done</button>
            </div>
          </div>
        ) : (
          <form className="settings-nested-modal-body" onSubmit={handleSubmit}>
            {error && <div className="settings-error-message">{error}</div>}
            {success && <div className="settings-success-message">{success}</div>}
            
            <div className="settings-form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user' | 'viewer')}
                required
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="settings-nested-modal-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialCategory = 'general' }) => {
  const { user } = useAuth();
  const userRole = getUserRole(user);
  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCategory);

  // Update active category when initialCategory prop changes
  useEffect(() => {
    if (isOpen && initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  const hasAccess = (requiredRole: 'super-admin' | 'tenant-admin' | 'admin' | 'user') => {
    return hasRole(user, requiredRole);
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const categories: Array<{ id: SettingsCategory; label: string; icon: string; requiresRole?: 'admin' | 'tenant-admin' | 'super-admin' }> = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'users', label: 'User Management', icon: '👥', requiresRole: 'admin' },
    { id: 'billing', label: 'Billing', icon: '💳', requiresRole: 'admin' },
    { id: 'findings-config', label: 'Findings Config', icon: '🏷️', requiresRole: 'admin' },
    { id: 'chat-presets', label: 'Chat Presets', icon: '✨', requiresRole: 'admin' },
    { id: 'scanner-tools', label: 'Scanner Tools', icon: '🔧', requiresRole: 'tenant-admin' },
    { id: 'super-admin', label: 'Super Admin', icon: '👑', requiresRole: 'super-admin' },
  ];

  const availableCategories = categories.filter(
    cat => !cat.requiresRole || hasAccess(cat.requiresRole)
  );

  const handleCategoryClick = (categoryId: SettingsCategory) => {
    // If Super Admin is clicked, navigate to the full page instead
    if (categoryId === 'super-admin') {
      handleOpenFullPage('/settings/admin');
      return;
    }
    setActiveCategory(categoryId);
  };

  const getHeaderTitle = () => {
    const category = categories.find(cat => cat.id === activeCategory);
    return category ? category.label : 'Settings';
  };

  const handleOpenFullPage = (path: string) => {
    onClose();
    navigate(path);
  };


  // Scanner Tools Management Component
  const ScannerToolsContent: React.FC = () => {
    interface ScannerToolWithSettings extends ScannerTool {
      tenantSettings?: {
        isEnabled: boolean;
        currentUsage: number;
        usageLimit?: number;
        settings: Record<string, any>;
      };
      scannerToolId?: string;
    }

    const [tools, setTools] = useState<ScannerToolWithSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'enabled' | 'disabled'>('all');

    useEffect(() => {
      loadTools();
    }, [activeTab]);

    const loadTools = async () => {
      try {
        setLoading(true);
        setError(null);

        const isEnabled = activeTab === 'enabled' ? true : activeTab === 'disabled' ? false : undefined;
        const data = await ApiService.getTenantScannerTools(isEnabled);

        const toolsFromApi = data?.tools || data || [];
        const toolsArray = Array.isArray(toolsFromApi) ? toolsFromApi : [];

        const flattenedTools = toolsArray.map((item: any) => {
          if (item.scanner_tool) {
            return {
              ...item.scanner_tool,
              id: item.id.toString(),
              scannerToolId: item.scanner_tool_id?.toString() || item.scanner_tool?.id?.toString(),
              tenantSettings: {
                isEnabled: item.is_enabled,
                currentUsage: item.current_usage_count || 0,
                usageLimit: item.max_scans_per_month,
                settings: item.tool_settings || {}
              }
            };
          }
          return item;
        });
        
        setTools(flattenedTools);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load scanner tools');
      } finally {
        setLoading(false);
      }
    };

    const handleToggle = async (toolId: string) => {
      try {
        const tool = tools.find(t => t.id === toolId);
        if (!tool) return;
        
        if (tool.tenantSettings?.isEnabled) {
          await ApiService.disableTenantTool(toolId);
        } else {
          const scannerToolId = (tool as any).scannerToolId || tool.id;
          await ApiService.enableTenantTool(scannerToolId);
        }
        await loadTools();
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to toggle tool');
      }
    };

    const getCategoryColor = (category: string) => {
      const colors: Record<string, string> = {
        'Web Application': '#4f46e5',
        'Network': '#059669',
        'Infrastructure': '#dc2626',
        'Code Analysis': '#7c3aed',
        'Database': '#ea580c',
        'Custom': '#64748b'
      };
      return colors[category] || '#64748b';
    };

    if (loading) {
      return (
        <div className="settings-content-section">
          <h2>Scanner Tools</h2>
          <div className="settings-loading">Loading scanner tools...</div>
        </div>
      );
    }

    const enabledCount = tools.filter(t => t.tenantSettings?.isEnabled).length;
    const disabledCount = tools.filter(t => !t.tenantSettings?.isEnabled).length;

    return (
      <div className="settings-content-section">
        <h2>Scanner Tools</h2>
        <p className="settings-description">
          Enable and manage scanner tools available to your tenant.
        </p>

        {error && (
          <div className="settings-error-message">
            {error}
            <button className="settings-error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({tools.length})
          </button>
          <button
            className={`settings-tab ${activeTab === 'enabled' ? 'active' : ''}`}
            onClick={() => setActiveTab('enabled')}
          >
            Enabled ({enabledCount})
          </button>
          <button
            className={`settings-tab ${activeTab === 'disabled' ? 'active' : ''}`}
            onClick={() => setActiveTab('disabled')}
          >
            Disabled ({disabledCount})
          </button>
        </div>

        {tools.length > 0 ? (
          <div className="settings-scanner-tools-list">
            {tools.map((tool) => (
              <div key={tool.id} className="settings-scanner-tool-card">
                <div className="settings-scanner-tool-header">
                  <div className="settings-scanner-tool-info">
                    <div>
                      <h3>{tool.displayName || tool.name}</h3>
                      <p className="settings-scanner-tool-description">{tool.description}</p>
                    </div>
                    <div className="settings-scanner-tool-badges">
                      {tool.category && (
                        <span 
                          className="settings-category-badge"
                          style={{ backgroundColor: getCategoryColor(tool.category) }}
                        >
                          {tool.category}
                        </span>
                      )}
                      {tool.pricingTier && (
                        <span className="settings-pricing-badge">
                          {tool.pricingTier}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="settings-scanner-tool-actions">
                    <span className={`settings-status-badge ${tool.tenantSettings?.isEnabled ? 'active' : 'inactive'}`}>
                      {tool.tenantSettings?.isEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <label className="settings-toggle-switch">
                      <input
                        type="checkbox"
                        checked={tool.tenantSettings?.isEnabled || false}
                        onChange={() => handleToggle(tool.id)}
                      />
                      <span className="settings-slider"></span>
                    </label>
                  </div>
                </div>
                {tool.tenantSettings?.isEnabled && (
                  <div className="settings-scanner-tool-usage">
                    <div className="settings-usage-row">
                      <span className="settings-usage-label">Usage:</span>
                      <span className="settings-usage-value">
                        {tool.tenantSettings.currentUsage} / {tool.tenantSettings.usageLimit || '∞'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="settings-empty-state">
            <p>No scanner tools available.</p>
          </div>
        )}
      </div>
    );
  };

  // Tenant Management Component
  const TenantManagementContent: React.FC = () => {

    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
      loadTenants();
    }, []);

    const loadTenants = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ApiService.getTenants();
        setTenants(Array.isArray(response) ? response : []);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load tenants');
      } finally {
        setLoading(false);
      }
    };

    const handleToggleActive = async (tenant: Tenant) => {
      try {
        await ApiService.updateTenant(tenant.id, {
          is_active: !tenant.is_active,
        });
        await loadTenants();
      } catch (err: any) {
        alert(err.response?.data?.detail || err.message || 'Failed to update tenant status');
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    if (loading) {
      return (
        <div className="settings-tab-content">
          <h3>Tenant Management</h3>
          <div className="settings-loading">Loading tenants...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="settings-tab-content">
          <h3>Tenant Management</h3>
          <div className="settings-error-message">{error}</div>
        </div>
      );
    }

    return (
      <div className="settings-tab-content">
        <div className="settings-tenant-management-header">
          <h3>Tenant Management</h3>
          <button className="settings-action-btn" onClick={() => setIsCreateModalOpen(true)}>
            + Add Tenant
          </button>
        </div>
        <p className="settings-description">
          View and manage all tenants in the system, including their settings, subscription status, and contact information.
        </p>

        {tenants.length === 0 ? (
          <div className="settings-empty-state">
            <p>No tenants found. Create your first tenant to get started.</p>
          </div>
        ) : (
          <div className="settings-tenants-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Subscription</th>
                  <th>Contact</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>
                      <strong>{tenant.name}</strong>
                      {tenant.description && (
                        <div className="settings-tenant-description">{tenant.description}</div>
                      )}
                    </td>
                    <td>
                      <code className="settings-tenant-slug">{tenant.slug}</code>
                    </td>
                    <td>
                      <span className={`settings-status-badge ${tenant.is_active ? 'active' : 'inactive'}`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="settings-plan-badge">{tenant.subscription_plan || 'free'}</span>
                    </td>
                    <td>
                      <span className={`settings-subscription-badge ${tenant.subscription_status || 'trialing'}`}>
                        {tenant.subscription_status || 'trialing'}
                      </span>
                    </td>
                    <td>
                      {tenant.contact_email ? (
                        <div>
                          <div>{tenant.contact_email}</div>
                          {tenant.contact_name && (
                            <div className="settings-contact-name">{tenant.contact_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="settings-no-contact">No contact</span>
                      )}
                    </td>
                    <td>{formatDate(tenant.created_at)}</td>
                    <td>
                      <div className="settings-action-buttons">
                        <button
                          className="settings-btn-sm"
                          onClick={() => {
                            setEditingTenant(tenant);
                            setIsEditModalOpen(true);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className={`settings-btn-sm ${tenant.is_active ? 'settings-btn-warning' : 'settings-btn-success'}`}
                          onClick={() => handleToggleActive(tenant)}
                        >
                          {tenant.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateTenantModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onTenantCreated={loadTenants}
        />

        <EditTenantModal
          tenant={editingTenant}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingTenant(null);
          }}
          onTenantUpdated={loadTenants}
        />
      </div>
    );
  };

  // Create Tenant Modal Component
  const CreateTenantModal: React.FC<{ isOpen: boolean; onClose: () => void; onTenantCreated: () => void }> = ({ isOpen, onClose, onTenantCreated }) => {
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [subscriptionPlan, setSubscriptionPlan] = useState('free');
    const [subscriptionStatus, setSubscriptionStatus] = useState('trialing');
    const [contactEmail, setContactEmail] = useState('');
    const [contactName, setContactName] = useState('');
    const [maxScansPerMonth, setMaxScansPerMonth] = useState(100);
    const [maxStorageGb, setMaxStorageGb] = useState(10);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!isOpen) {
        setName('');
        setSlug('');
        setDescription('');
        setIsActive(true);
        setSubscriptionPlan('free');
        setSubscriptionStatus('trialing');
        setContactEmail('');
        setContactName('');
        setMaxScansPerMonth(100);
        setMaxStorageGb(10);
        setError(null);
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        await ApiService.createTenant({
          name,
          slug,
          description: description || undefined,
          is_active: isActive,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
          contact_email: contactEmail || undefined,
          contact_name: contactName || undefined,
          max_scans_per_month: maxScansPerMonth,
          max_storage_gb: maxStorageGb,
        });
        onTenantCreated();
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to create tenant');
      } finally {
        setLoading(false);
      }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newName = e.target.value;
      setName(newName);
      if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-')) {
        setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
      }
    };

    return (
      <div className="settings-nested-modal-overlay" onClick={onClose}>
        <div className="settings-nested-modal-content settings-tenant-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-nested-modal-header">
            <h3>Create New Tenant</h3>
            <button className="settings-nested-modal-close" onClick={onClose}>×</button>
          </div>
          
          <form className="settings-nested-modal-body" onSubmit={handleSubmit}>
            {error && <div className="settings-error-message">{error}</div>}
            
            <div className="settings-form-group">
              <label htmlFor="create-name">Name *</label>
              <input
                id="create-name"
                type="text"
                value={name}
                onChange={handleNameChange}
                required
                placeholder="Tenant Name"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="create-slug">Slug *</label>
              <input
                id="create-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                required
                placeholder="tenant-slug"
                pattern="[a-z0-9-]+"
              />
              <small className="settings-form-hint">Lowercase letters, numbers, and hyphens only</small>
            </div>

            <div className="settings-form-group">
              <label htmlFor="create-description">Description</label>
              <textarea
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tenant description"
                rows={3}
                className="settings-textarea"
              />
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="create-subscriptionPlan">Subscription Plan</label>
                <select
                  id="create-subscriptionPlan"
                  value={subscriptionPlan}
                  onChange={(e) => setSubscriptionPlan(e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="create-subscriptionStatus">Subscription Status</label>
                <select
                  id="create-subscriptionStatus"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                >
                  <option value="trialing">Trialing</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="create-contactEmail">Contact Email</label>
                <input
                  id="create-contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="create-contactName">Contact Name</label>
                <input
                  id="create-contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Admin Name"
                />
              </div>
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="create-maxScans">Max Scans Per Month</label>
                <input
                  id="create-maxScans"
                  type="number"
                  value={maxScansPerMonth}
                  onChange={(e) => setMaxScansPerMonth(Number(e.target.value))}
                  min="1"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="create-maxStorage">Max Storage (GB)</label>
                <input
                  id="create-maxStorage"
                  type="number"
                  value={maxStorageGb}
                  onChange={(e) => setMaxStorageGb(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="settings-nested-modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Tenant'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Edit Tenant Modal Component
  const EditTenantModal: React.FC<{ tenant: Tenant | null; isOpen: boolean; onClose: () => void; onTenantUpdated: () => void }> = ({ tenant, isOpen, onClose, onTenantUpdated }) => {

    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [subscriptionPlan, setSubscriptionPlan] = useState('free');
    const [subscriptionStatus, setSubscriptionStatus] = useState('trialing');
    const [contactEmail, setContactEmail] = useState('');
    const [contactName, setContactName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (tenant) {
        setName(tenant.name || '');
        setSlug(tenant.slug || '');
        setDescription(tenant.description || '');
        setIsActive(tenant.is_active);
        setSubscriptionPlan(tenant.subscription_plan || 'free');
        setSubscriptionStatus(tenant.subscription_status || 'trialing');
        setContactEmail(tenant.contact_email || '');
        setContactName(tenant.contact_name || '');
      }
    }, [tenant]);

    if (!isOpen || !tenant) return null;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        await ApiService.updateTenant(tenant.id, {
          name,
          slug,
          description: description || undefined,
          is_active: isActive,
          subscription_plan: subscriptionPlan,
          subscription_status: subscriptionStatus,
          contact_email: contactEmail || undefined,
          contact_name: contactName || undefined,
        });
        onTenantUpdated();
        onClose();
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to update tenant');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="settings-nested-modal-overlay" onClick={onClose}>
        <div className="settings-nested-modal-content settings-tenant-modal" onClick={(e) => e.stopPropagation()}>
          <div className="settings-nested-modal-header">
            <h3>Edit Tenant</h3>
            <button className="settings-nested-modal-close" onClick={onClose}>×</button>
          </div>
          
          <form className="settings-nested-modal-body" onSubmit={handleSubmit}>
            {error && <div className="settings-error-message">{error}</div>}
            
            <div className="settings-form-group">
              <label htmlFor="edit-name">Name *</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Tenant Name"
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="edit-slug">Slug *</label>
              <input
                id="edit-slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                required
                placeholder="tenant-slug"
                pattern="[a-z0-9-]+"
              />
              <small className="settings-form-hint">Lowercase letters, numbers, and hyphens only</small>
            </div>

            <div className="settings-form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tenant description"
                rows={3}
                className="settings-textarea"
              />
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="edit-subscriptionPlan">Subscription Plan</label>
                <select
                  id="edit-subscriptionPlan"
                  value={subscriptionPlan}
                  onChange={(e) => setSubscriptionPlan(e.target.value)}
                >
                  <option value="free">Free</option>
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="edit-subscriptionStatus">Subscription Status</label>
                <select
                  id="edit-subscriptionStatus"
                  value={subscriptionStatus}
                  onChange={(e) => setSubscriptionStatus(e.target.value)}
                >
                  <option value="trialing">Trialing</option>
                  <option value="active">Active</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="edit-contactEmail">Contact Email</label>
                <input
                  id="edit-contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>

              <div className="settings-form-group">
                <label htmlFor="edit-contactName">Contact Name</label>
                <input
                  id="edit-contactName"
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Admin Name"
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>

            <div className="settings-nested-modal-actions">
              <button type="button" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Super Admin Settings Component
  const SuperAdminContent: React.FC = () => {
    type SuperAdminTab = 'tenants' | 'tenant-scanners' | 'scanner-registry' | 'stripe' | 'subscriptions' | 'prompts' | 'scan-types';
    
    const [activeTab, setActiveTab] = useState<SuperAdminTab>('tenants');

    const tabs: Array<{ id: SuperAdminTab; label: string; icon: string }> = [
      { id: 'tenants', label: 'Tenant Management', icon: '🏢' },
      { id: 'tenant-scanners', label: 'Tenant Scanners', icon: '🛠️' },
      { id: 'scanner-registry', label: 'Scanner Registry', icon: '⚙️' },
      { id: 'stripe', label: 'Stripe Config', icon: '💰' },
      { id: 'subscriptions', label: 'Subscriptions', icon: '📦' },
      { id: 'prompts', label: 'System Prompts', icon: '💬' },
      { id: 'scan-types', label: 'Scan Types', icon: '🎯' },
    ];

    const renderTabContent = () => {
      switch (activeTab) {
        case 'tenants':
          return <TenantManagementContent />;

        case 'tenant-scanners':
          return (
            <div className="settings-tab-content">
              <h3>Tenant Scanners</h3>
              <p className="settings-description">
                Add and manage scanner tools for specific tenants from the global registry.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/tenant-scanners')}
              >
                Open Tenant Scanners
              </button>
            </div>
          );

        case 'scanner-registry':
          return (
            <div className="settings-tab-content">
              <h3>Global Scanner Registry</h3>
              <p className="settings-description">
                Manage the global scanner tool registry, add new tools, configure execution methods, and set system-wide defaults.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/admin/scanner-tools')}
              >
                Open Global Registry
              </button>
            </div>
          );

        case 'stripe':
          return (
            <div className="settings-tab-content">
              <h3>Stripe Configuration</h3>
              <p className="settings-description">
                Configure Stripe API keys and webhook secrets for the billing system.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/stripe')}
              >
                Configure Stripe
              </button>
            </div>
          );

        case 'subscriptions':
          return (
            <div className="settings-tab-content">
              <h3>Subscription Plans</h3>
              <p className="settings-description">
                Create and manage subscription plans with pricing, features, limits, and Stripe price IDs.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/subscription-plans')}
              >
                Manage Plans
              </button>
            </div>
          );

        case 'prompts':
          return (
            <div className="settings-tab-content">
              <h3>System Prompts</h3>
              <p className="settings-description">
                Configure global and tenant-specific system prompts for the chatbot assistant. Track history of all prompt changes.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/admin/system-prompts')}
              >
                Manage Prompts
              </button>
            </div>
          );

        case 'scan-types':
          return (
            <div className="settings-tab-content">
              <h3>Supported Scan Types</h3>
              <p className="settings-description">
                Define and manage the scan types that can be used by scanner tools for security assessments.
              </p>
              <button
                className="settings-action-btn"
                onClick={() => handleOpenFullPage('/settings/admin/scan-types')}
              >
                Manage Scan Types
              </button>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="settings-content-section">
        <h2>Super Admin Settings</h2>
        <p className="settings-description">
          Manage global system configuration and platform-wide settings.
        </p>

        <div className="settings-super-admin-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-super-admin-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="settings-tab-icon">{tab.icon}</span>
              <span className="settings-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="settings-super-admin-content">
          {renderTabContent()}
        </div>
      </div>
    );
  };

  // Findings Configuration Component
  const FindingsConfigContent: React.FC = () => {
    interface Level {
      id: number;
      label: string;
      value: string;
      color: string;
      sort_order: number;
      is_active: boolean;
      is_system_default: boolean;
    }

    const [activeTab, setActiveTab] = useState<'severity' | 'status'>('severity');
    const [severityLevels, setSeverityLevels] = useState<Level[]>([]);
    const [statusLevels, setStatusLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);

    const [formData, setFormData] = useState({
      label: '',
      value: '',
      color: '#DC143C',
      sort_order: 1
    });

    useEffect(() => {
      loadLevels();
    }, []);

    const loadLevels = async () => {
      try {
        setLoading(true);
        setError(null);
        const [severity, status] = await Promise.all([
          ApiService.getSeverityLevels(),
          ApiService.getStatusLevels()
        ]);
        
        setSeverityLevels(severity);
        setStatusLevels(status);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load configuration');
      } finally {
        setLoading(false);
      }
    };

    const generateValue = (label: string): string => {
      return label.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    };

    const handleLabelChange = (label: string) => {
      setFormData({
        ...formData,
        label,
        value: generateValue(label)
      });
    };

    const handleAdd = () => {
      const levels = activeTab === 'severity' ? severityLevels : statusLevels;
      const maxSort = levels.length > 0 ? Math.max(...levels.map(l => l.sort_order)) : 0;
      
      setFormData({
        label: '',
        value: '',
        color: '#DC143C',
        sort_order: maxSort + 1
      });
      setEditingLevel(null);
      setShowAddForm(true);
    };

    const handleEdit = (level: Level) => {
      setFormData({
        label: level.label,
        value: level.value,
        color: level.color,
        sort_order: level.sort_order
      });
      setEditingLevel(level);
      setShowAddForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      try {
        if (editingLevel) {
          const updateData = {
            label: formData.label,
            color: formData.color,
            sort_order: formData.sort_order
          };
          
          if (activeTab === 'severity') {
            await ApiService.updateSeverityLevel(editingLevel.id, updateData);
          } else {
            await ApiService.updateStatusLevel(editingLevel.id, updateData);
          }
        } else {
          if (activeTab === 'severity') {
            await ApiService.createSeverityLevel(formData);
          } else {
            await ApiService.createStatusLevel(formData);
          }
        }

        await loadLevels();
        setShowAddForm(false);
        setEditingLevel(null);
        setFormData({ label: '', value: '', color: '#DC143C', sort_order: 1 });
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to save level');
      }
    };

    const handleDelete = async (level: Level) => {
      if (!window.confirm(`Are you sure you want to delete "${level.label}"?`)) {
        return;
      }

      try {
        setError(null);
        if (activeTab === 'severity') {
          await ApiService.deleteSeverityLevel(level.id);
        } else {
          await ApiService.deleteStatusLevel(level.id);
        }
        await loadLevels();
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to delete level');
      }
    };

    const currentLevels = activeTab === 'severity' ? severityLevels : statusLevels;

    if (loading) {
      return (
        <div className="settings-content-section">
          <h2>Findings Configuration</h2>
          <div className="settings-loading">Loading configuration...</div>
        </div>
      );
    }

    return (
      <div className="settings-content-section">
        <div className="settings-findings-config-header">
          <h2>Findings Configuration</h2>
          <button
            className="settings-action-btn"
            onClick={() => handleOpenFullPage('/settings/findings-config')}
          >
            Open Full Page
          </button>
        </div>
        <p className="settings-description">
          Configure custom severity and status levels for security findings.
        </p>

        {error && (
          <div className="settings-error-message">
            {error}
            <button className="settings-error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'severity' ? 'active' : ''}`}
            onClick={() => setActiveTab('severity')}
          >
            Severity Levels ({severityLevels.length})
          </button>
          <button
            className={`settings-tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status Levels ({statusLevels.length})
          </button>
        </div>

        {!showAddForm && (
          <div className="settings-toolbar">
            <button className="settings-action-btn" onClick={handleAdd}>
              + Add {activeTab === 'severity' ? 'Severity' : 'Status'} Level
            </button>
          </div>
        )}

        {showAddForm ? (
          <form className="settings-findings-form" onSubmit={handleSubmit}>
            <h3>{editingLevel ? 'Edit' : 'Add'} {activeTab === 'severity' ? 'Severity' : 'Status'} Level</h3>
            
            <div className="settings-form-group">
              <label htmlFor="fc-label">Label *</label>
              <input
                id="fc-label"
                type="text"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g., Critical, High, New"
                required
              />
            </div>

            <div className="settings-form-group">
              <label htmlFor="fc-value">Value (auto-generated)</label>
              <input
                id="fc-value"
                type="text"
                value={formData.value}
                readOnly
                className="settings-readonly-input"
              />
              <small className="settings-form-hint">Used internally - generated from label</small>
            </div>

            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="fc-color">Color *</label>
                <div className="settings-color-picker-wrapper">
                  <input
                    id="fc-color"
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#DC143C"
                  />
                </div>
              </div>

              <div className="settings-form-group">
                <label htmlFor="fc-sort">Sort Order *</label>
                <input
                  id="fc-sort"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="settings-findings-preview">
              <label>Preview:</label>
              <span
                className="settings-badge-preview"
                style={{
                  backgroundColor: formData.color,
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  fontWeight: 600,
                  fontSize: '13px',
                  display: 'inline-block'
                }}
              >
                {formData.label.toUpperCase() || 'PREVIEW'}
              </span>
            </div>

            <div className="settings-nested-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingLevel(null);
                  setFormData({ label: '', value: '', color: '#DC143C', sort_order: 1 });
                }}
              >
                Cancel
              </button>
              <button type="submit">
                {editingLevel ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        ) : (
          <div className="settings-findings-levels-list">
            {currentLevels.length === 0 ? (
              <div className="settings-empty-state">
                <p>No {activeTab} levels configured. Add your first level to get started.</p>
              </div>
            ) : (
              <div className="settings-levels-grid">
                {currentLevels.map((level) => (
                  <div key={level.id} className="settings-level-card">
                    <div className="settings-level-header">
                      <span
                        className="settings-level-badge"
                        style={{
                          backgroundColor: level.color,
                          color: '#fff'
                        }}
                      >
                        {level.label}
                      </span>
                      {level.is_system_default && (
                        <span className="settings-system-badge">System</span>
                      )}
                    </div>
                    <div className="settings-level-details">
                      <div className="settings-level-detail-row">
                        <span className="settings-level-label">Value:</span>
                        <code className="settings-level-value">{level.value}</code>
                      </div>
                      <div className="settings-level-detail-row">
                        <span className="settings-level-label">Color:</span>
                        <span className="settings-level-value">{level.color}</span>
                      </div>
                      <div className="settings-level-detail-row">
                        <span className="settings-level-label">Sort Order:</span>
                        <span className="settings-level-value">{level.sort_order}</span>
                      </div>
                    </div>
                    {!level.is_system_default && (
                      <div className="settings-level-actions">
                        <button
                          className="settings-btn-sm"
                          onClick={() => handleEdit(level)}
                        >
                          Edit
                        </button>
                        <button
                          className="settings-btn-sm settings-btn-danger"
                          onClick={() => handleDelete(level)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="settings-info-box" style={{ marginTop: '20px' }}>
          <h4>ℹ️ About Findings Configuration</h4>
          <ul>
            <li>Customize severity and status levels to match your workflow</li>
            <li>System default levels cannot be modified or deleted</li>
            <li>Changes apply immediately to all new findings</li>
            <li>Existing findings retain their current levels</li>
          </ul>
        </div>
      </div>
    );
  };

  // User Management Component
  const UserManagementContent: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    useEffect(() => {
      loadUsers();
    }, []);

    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getUsers();
        setUsers(response.users || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
      if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
        return;
      }

      try {
        await ApiService.updateUserRole(userId, newRole);
        loadUsers();
      } catch (err: any) {
        alert(err.response?.data?.detail || err.message || 'Failed to update role');
      }
    };

    const handleUpdateStatus = async (userId: string, isActive: boolean) => {
      try {
        await ApiService.updateUserStatus(userId, isActive);
        loadUsers();
      } catch (err: any) {
        alert(err.response?.data?.detail || err.message || 'Failed to update status');
      }
    };

    const handleForcePasswordReset = async (userId: string) => {
      if (!window.confirm('Are you sure you want to force a password reset? The user will be logged out and must change their password on next login.')) {
        return;
      }

      try {
        await ApiService.forcePasswordReset(userId);
        alert('Password reset initiated. The user must change their password on next login.');
      } catch (err: any) {
        alert(err.response?.data?.detail || err.message || 'Failed to reset password');
      }
    };

    const handleDeleteUser = async (userId: string, email: string) => {
      if (!window.confirm(`Are you sure you want to remove ${email}? This action cannot be undone.`)) {
        return;
      }

      try {
        await ApiService.deleteUser(userId);
        loadUsers();
      } catch (err: any) {
        alert(err.response?.data?.detail || err.message || 'Failed to remove user');
      }
    };

    if (loading) {
      return (
        <div className="settings-content-section">
          <h2>User Management</h2>
          <div className="settings-loading">Loading users...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="settings-content-section">
          <h2>User Management</h2>
          <div className="settings-error-message">{error}</div>
        </div>
      );
    }

    return (
      <div className="settings-content-section">
        <div className="settings-user-management-header">
          <h2>User Management</h2>
          <button className="settings-action-btn" onClick={() => setCreateModalOpen(true)}>
            + Add User
          </button>
        </div>
        <p className="settings-description">
          Manage users in your tenant: add, remove, enable/disable, and change roles.
        </p>

        {users.length === 0 ? (
          <div className="settings-empty-state">
            <p>No users found. Create your first user to get started.</p>
          </div>
        ) : (
          <div className="settings-users-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.username, e.target.value as 'admin' | 'user' | 'viewer')}
                        className="settings-role-select"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td>
                      <span className={`settings-status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="settings-action-buttons">
                        <button
                          className="settings-btn-sm"
                          onClick={() => handleUpdateStatus(user.username, !user.is_active)}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="settings-btn-sm settings-btn-warning"
                          onClick={() => handleForcePasswordReset(user.username)}
                        >
                          Reset Password
                        </button>
                        <button
                          className="settings-btn-sm settings-btn-danger"
                          onClick={() => handleDeleteUser(user.username, user.email)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onUserCreated={loadUsers}
        />
      </div>
    );
  };

  // Chat Presets Configuration Component
  const ChatPresetsContent: React.FC = () => {
    const [presets, setPresets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [success, setSuccess] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPresets, setOriginalPresets] = useState<any[]>([]);

    useEffect(() => {
      loadPresets();
    }, []);

    const loadPresets = async () => {
      try {
        setLoading(true);
        const response = await ApiService.getChatPresets();
        const loadedPresets = response.presets || [];
        setPresets(loadedPresets);
        setOriginalPresets(JSON.parse(JSON.stringify(loadedPresets)));
        setHasChanges(false);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load presets');
      } finally {
        setLoading(false);
      }
    };

    const handleSaveAll = async () => {
      try {
        setSavingAll(true);
        setError(null);
        
        // Save all presets
        for (const preset of presets) {
          await ApiService.updateChatPreset(preset.preset_number, {
            title: preset.title,
            message: preset.message,
            is_active: preset.is_active
          });
        }
        
        setSuccess('All presets saved successfully!');
        setOriginalPresets(JSON.parse(JSON.stringify(presets)));
        setHasChanges(false);
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to save presets');
      } finally {
        setSavingAll(false);
      }
    };

    const handleResetToDefaults = async () => {
      if (!window.confirm('Reset all presets to system defaults? This will overwrite your current settings.')) {
        return;
      }

      try {
        setSaving(true);
        setError(null);
        const response = await ApiService.resetChatPresets();
        const loadedPresets = response.presets || [];
        setPresets(loadedPresets);
        setOriginalPresets(JSON.parse(JSON.stringify(loadedPresets)));
        setHasChanges(false);
        setSuccess('All presets reset to defaults!');
        setTimeout(() => setSuccess(null), 3000);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to reset presets');
      } finally {
        setSaving(false);
      }
    };

    const updatePreset = (presetNumber: number, field: string, value: any) => {
      setPresets(prev => prev.map(p =>
        p.preset_number === presetNumber ? { ...p, [field]: value } : p
      ));
      setHasChanges(true);
    };

    const getPresetIcon = (presetNumber: number) => {
      const icons = ['📊', '❓', '🔧', '📈'];
      return icons[presetNumber - 1] || '✨';
    };

    if (loading) {
      return (
        <div className="settings-content-section">
          <h2>Chat Presets</h2>
          <div className="settings-loading">Loading presets...</div>
        </div>
      );
    }

    return (
      <div className="settings-content-section">
        <div className="settings-header-with-actions">
          <div>
            <h2>Chat Presets</h2>
            <p className="settings-subtitle">Configure quick-start prompts for the chatbot sidebar</p>
          </div>
          <div className="settings-header-buttons">
            <button
              className="settings-secondary-btn"
              onClick={handleResetToDefaults}
              disabled={saving || savingAll}
            >
              Reset to Defaults
            </button>
            <button
              className="settings-primary-btn"
              onClick={handleSaveAll}
              disabled={!hasChanges || savingAll}
              style={{ 
                opacity: hasChanges ? 1 : 0.5,
                cursor: hasChanges ? 'pointer' : 'not-allowed'
              }}
            >
              {savingAll ? 'Saving...' : hasChanges ? 'Save All Changes' : 'No Changes'}
            </button>
          </div>
        </div>

        {success && (
          <div className="settings-success-banner">
            ✓ {success}
          </div>
        )}

        {error && (
          <div className="settings-error-banner">
            ✕ {error}
          </div>
        )}

        <div className="chat-presets-grid">
          {presets.map((preset) => (
            <div key={preset.preset_number} className="chat-preset-card">
              <div className="chat-preset-header">
                <div className="chat-preset-title-row">
                  <span className="chat-preset-icon">{getPresetIcon(preset.preset_number)}</span>
                  <span className="chat-preset-number">Preset {preset.preset_number}</span>
                </div>
                <label className="chat-preset-toggle">
                  <input
                    type="checkbox"
                    checked={preset.is_active}
                    onChange={(e) => updatePreset(preset.preset_number, 'is_active', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">{preset.is_active ? 'Active' : 'Inactive'}</span>
                </label>
              </div>

              <div className="chat-preset-body">
                <div className="chat-preset-field">
                  <label className="chat-preset-label">
                    <span>Button Title</span>
                    <span className="char-count">{preset.title.length}/100</span>
                  </label>
                  <input
                    type="text"
                    className="chat-preset-input"
                    value={preset.title}
                    onChange={(e) => updatePreset(preset.preset_number, 'title', e.target.value)}
                    maxLength={100}
                    placeholder="e.g., Show me recent scans"
                  />
                </div>

                <div className="chat-preset-field">
                  <label className="chat-preset-label">
                    <span>Chatbot Message</span>
                    <span className="char-count">{preset.message.length}/2000</span>
                  </label>
                  <textarea
                    className="chat-preset-textarea"
                    value={preset.message}
                    onChange={(e) => updatePreset(preset.preset_number, 'message', e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="e.g., Can you show me a summary of my most recent security scans?"
                  />
                </div>
              </div>

              {!preset.is_active && (
                <div className="chat-preset-inactive-badge">
                  Hidden from users
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="settings-info-card">
          <div className="info-card-header">
            <span className="info-icon">💡</span>
            <h4>How Chat Presets Work</h4>
          </div>
          <ul className="info-card-list">
            <li>Presets appear below recent chats in the chatbot sidebar with a purple sparkle icon ✨</li>
            <li>Clicking a preset instantly creates a new chat and sends your message</li>
            <li>Perfect for common questions your team asks frequently</li>
            <li>Toggle "Active" to hide presets without deleting them</li>
          </ul>
        </div>
      </div>
    );
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'general':
        return (
          <div className="settings-content-section">
            <h2>General Settings</h2>
            <div className="settings-item">
              <label>Appearance</label>
              <select className="settings-select" defaultValue="system">
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="settings-item">
              <label>Language</label>
              <select className="settings-select" defaultValue="auto">
                <option value="auto">Auto-detect</option>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>
            <div className="settings-item">
              <label>Notifications</label>
              <div className="settings-toggle">
                <input type="checkbox" id="notifications" defaultChecked />
                <label htmlFor="notifications">Enable email notifications</label>
              </div>
            </div>
          </div>
        );

      case 'users':
        return <UserManagementContent />;

      case 'billing':
        return (
          <div className="settings-content-section">
            <h2>Billing & Subscriptions</h2>
            <p className="settings-description">
              Manage your subscription plan, payment methods, and view invoices.
            </p>
            <button
              className="settings-action-btn"
              onClick={() => handleOpenFullPage('/settings/billing')}
            >
              Open Billing
            </button>
          </div>
        );

      case 'findings-config':
        return <FindingsConfigContent />;

      case 'chat-presets':
        return <ChatPresetsContent />;

      case 'scanner-tools':
        return <ScannerToolsContent />;

      case 'super-admin':
        // This should not be reached as handleCategoryClick navigates away
        // But just in case, show a message
        return (
          <div className="settings-content-section">
            <h2>Super Admin</h2>
            <p className="settings-description">
              Redirecting to Super Admin settings...
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal" ref={modalRef}>
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <div className="settings-modal-header-right">
            <span className="settings-modal-category">{getHeaderTitle()}</span>
            <button className="settings-modal-close" onClick={onClose} aria-label="Close settings">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="settings-modal-body">
          <div className="settings-sidebar">
            <div className="settings-categories">
              {availableCategories.map((category) => (
                <button
                  key={category.id}
                  className={`settings-category-item ${activeCategory === category.id ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(category.id)}
                >
                  <span className="settings-category-icon">{category.icon}</span>
                  <span className="settings-category-label">{category.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="settings-content">
            {renderCategoryContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

