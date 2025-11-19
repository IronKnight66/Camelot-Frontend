import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Layout from '../Layout';
import './TenantManagement.css';

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

interface CreateTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantCreated: () => void;
}

interface EditTenantModalProps {
  tenant: Tenant | null;
  isOpen: boolean;
  onClose: () => void;
  onTenantUpdated: () => void;
}

const CreateTenantModal: React.FC<CreateTenantModalProps> = ({ isOpen, onClose, onTenantCreated }) => {
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
      // Reset form when modal closes
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
      await apiService.createTenant({
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

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    // Auto-generate slug from name if slug is empty or matches previous name
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, '-')) {
      setSlug(newName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Tenant</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
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

          <div className="form-group">
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
            <small>Lowercase letters, numbers, and hyphens only</small>
          </div>

          <div className="form-group">
            <label htmlFor="create-description">Description</label>
            <textarea
              id="create-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tenant description"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="create-contactEmail">Contact Email</label>
              <input
                id="create-contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="create-maxScans">Max Scans Per Month</label>
              <input
                id="create-maxScans"
                type="number"
                value={maxScansPerMonth}
                onChange={(e) => setMaxScansPerMonth(Number(e.target.value))}
                min="1"
              />
            </div>

            <div className="form-group">
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

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} disabled={loading}>
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

const EditTenantModal: React.FC<EditTenantModalProps> = ({ tenant, isOpen, onClose, onTenantUpdated }) => {
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.updateTenant(tenant.id, {
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

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Tenant</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Tenant Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="slug">Slug *</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              required
              placeholder="tenant-slug"
              pattern="[a-z0-9-]+"
            />
            <small>Lowercase letters, numbers, and hyphens only</small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tenant description"
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="subscriptionPlan">Subscription Plan</label>
              <select
                id="subscriptionPlan"
                value={subscriptionPlan}
                onChange={(e) => setSubscriptionPlan(e.target.value)}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="subscriptionStatus">Subscription Status</label>
              <select
                id="subscriptionStatus"
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="contactEmail">Contact Email</label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="admin@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactName">Contact Name</label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Admin Name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={handleClose} disabled={loading}>
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

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getTenants();
      setTenants(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setIsEditModalOpen(true);
  };

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      await apiService.updateTenant(tenant.id, {
        is_active: !tenant.is_active,
      });
      loadTenants();
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
      <Layout>
        <div className="tenant-management-container">
          <div className="loading">Loading tenants...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="tenant-management-container">
          <div className="error-message">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tenant-management-container">
        <div className="tenant-management-header">
          <h1>Tenant Management</h1>
          <p>Manage all tenants in the system</p>
        </div>

        {tenants.length === 0 ? (
          <div className="empty-state">
            <p>No tenants found.</p>
          </div>
        ) : (
          <div className="tenants-table">
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
                        <div className="tenant-description">{tenant.description}</div>
                      )}
                    </td>
                    <td>
                      <code>{tenant.slug}</code>
                    </td>
                    <td>
                      <span className={`status-badge ${tenant.is_active ? 'active' : 'inactive'}`}>
                        {tenant.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span className="plan-badge">{tenant.subscription_plan || 'free'}</span>
                    </td>
                    <td>
                      <span className={`subscription-badge ${tenant.subscription_status || 'trialing'}`}>
                        {tenant.subscription_status || 'trialing'}
                      </span>
                    </td>
                    <td>
                      {tenant.contact_email ? (
                        <div>
                          <div>{tenant.contact_email}</div>
                          {tenant.contact_name && (
                            <div className="contact-name">{tenant.contact_name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="no-contact">No contact</span>
                      )}
                    </td>
                    <td>{formatDate(tenant.created_at)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEdit(tenant)}
                        >
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${tenant.is_active ? 'btn-warning' : 'btn-success'}`}
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

        <div className="tenant-management-footer">
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            + Add Tenant
          </button>
        </div>

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
    </Layout>
  );
};

export default TenantManagement;

