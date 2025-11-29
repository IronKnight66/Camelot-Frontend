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

type SettingsCategory = 'general' | 'users' | 'api-keys' | 'billing' | 'scanner-tools' | 'super-admin';

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
    { id: 'api-keys', label: 'API Keys', icon: '🔑', requiresRole: 'admin' },
    { id: 'billing', label: 'Billing', icon: '💳', requiresRole: 'admin' },
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

  // API Keys Management Component
  const APIKeysContent: React.FC = () => {
    interface TenantAPIKey {
      id: number;
      provider: string;
      secret_name: string;
      is_active: boolean;
      description?: string;
      created_at: string;
      updated_at: string;
    }

    interface APIKeyListResponse {
      keys: TenantAPIKey[];
      total: number;
    }

    const [apiKeys, setApiKeys] = useState<TenantAPIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
      provider: 'openai',
      apiKey: '',
      description: ''
    });

    useEffect(() => {
      loadAPIKeys();
    }, []);

    const loadAPIKeys = async () => {
      try {
        setLoading(true);
        setError(null);
        const response: APIKeyListResponse = await ApiService.getTenantAPIKeys();
        setApiKeys(response.keys || []);
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };

    const handleAddKey = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        setError(null);
        if (!formData.apiKey.trim()) {
          setError('API key is required');
          return;
        }

        await ApiService.addTenantAPIKey(
          formData.provider,
          formData.apiKey,
          formData.description || undefined
        );
        
        setShowAddForm(false);
        setFormData({ provider: 'openai', apiKey: '', description: '' });
        await loadAPIKeys();
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to add API key');
      }
    };

    const handleDeleteKey = async (provider: string) => {
      if (!window.confirm(`Are you sure you want to delete the ${provider} API key?`)) {
        return;
      }

      try {
        setError(null);
        await ApiService.deleteTenantAPIKey(provider);
        await loadAPIKeys();
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to delete API key');
      }
    };

    const handleTestKey = async (provider: string) => {
      try {
        setTesting(provider);
        setError(null);
        const result = await ApiService.testAPIKey(provider);
        if (result.valid) {
          alert(`✓ ${provider} API key is valid!`);
        } else {
          setError(result.message || 'API key validation failed');
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to test API key');
      } finally {
        setTesting(null);
      }
    };

    const getProviderIcon = (provider: string) => {
      const icons: Record<string, string> = {
        openai: '🤖',
        anthropic: '🧬',
        bedrock: '☁️',
        ollama: '🦙'
      };
      return icons[provider] || '🔑';
    };

    const getProviderName = (provider: string) => {
      const names: Record<string, string> = {
        openai: 'OpenAI',
        anthropic: 'Anthropic (Claude)',
        bedrock: 'Amazon Bedrock',
        ollama: 'Ollama'
      };
      return names[provider] || provider;
    };

    if (loading) {
      return (
        <div className="settings-content-section">
          <h2>API Keys</h2>
          <div className="settings-loading">Loading API keys...</div>
        </div>
      );
    }

    return (
      <div className="settings-content-section">
        <div className="settings-api-keys-header">
          <h2>API Keys</h2>
          {!showAddForm && (
            <button className="settings-action-btn" onClick={() => setShowAddForm(true)}>
              + Add API Key
            </button>
          )}
        </div>
        <p className="settings-description">
          Manage your AI provider API keys stored securely in AWS Secrets Manager
        </p>

        {error && (
          <div className="settings-error-message">
            {error}
            <button className="settings-error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {apiKeys.length > 0 ? (
          <div className="settings-api-keys-list">
            {apiKeys.map((key) => (
              <div key={key.id} className="settings-api-key-card">
                <div className="settings-api-key-header">
                  <div className="settings-api-key-info">
                    <span className="settings-provider-icon">{getProviderIcon(key.provider)}</span>
                    <div>
                      <h3>{getProviderName(key.provider)}</h3>
                      <p className="settings-key-description">
                        {key.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <span className={`settings-status-badge ${key.is_active ? 'active' : 'inactive'}`}>
                    {key.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="settings-api-key-details">
                  <div className="settings-detail-row">
                    <span className="settings-detail-label">Secret Name:</span>
                    <span className="settings-detail-value">{key.secret_name}</span>
                  </div>
                  <div className="settings-detail-row">
                    <span className="settings-detail-label">Added:</span>
                    <span className="settings-detail-value">
                      {new Date(key.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="settings-api-key-actions">
                  <button
                    className="settings-btn-sm settings-btn-test"
                    onClick={() => handleTestKey(key.provider)}
                    disabled={testing === key.provider}
                  >
                    {testing === key.provider ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    className="settings-btn-sm settings-btn-danger"
                    onClick={() => handleDeleteKey(key.provider)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !showAddForm && (
          <div className="settings-empty-state">
            <p>No API keys configured. Add your first API key to get started.</p>
          </div>
        )}

        {showAddForm && (
          <form className="settings-add-key-form" onSubmit={handleAddKey}>
            <h3>Add New API Key</h3>
            
            <div className="settings-form-group">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic (Claude)</option>
                <option value="bedrock">Amazon Bedrock</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>

            <div className="settings-form-group">
              <label htmlFor="apiKey">API Key</label>
              <input
                type="password"
                id="apiKey"
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                placeholder="Enter your API key"
                required
              />
              <small className="settings-form-hint">
                Your API key is encrypted and stored securely in AWS Secrets Manager
              </small>
            </div>

            <div className="settings-form-group">
              <label htmlFor="description">Description (Optional)</label>
              <input
                type="text"
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Production OpenAI key"
              />
            </div>

            <div className="settings-nested-modal-actions">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ provider: 'openai', apiKey: '', description: '' });
                }}
              >
                Cancel
              </button>
              <button type="submit">
                Save API Key
              </button>
            </div>
          </form>
        )}

        <div className="settings-info-box">
          <h4>ℹ️ About API Keys</h4>
          <ul>
            <li>API keys are stored securely in AWS Secrets Manager</li>
            <li>Keys are encrypted at rest and in transit</li>
            <li>Only you can manage your tenant's API keys (admin access required)</li>
            <li>Deleting a key will fall back to system keys for your subscription tier</li>
          </ul>
        </div>
      </div>
    );
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

      case 'api-keys':
        return <APIKeysContent />;

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

