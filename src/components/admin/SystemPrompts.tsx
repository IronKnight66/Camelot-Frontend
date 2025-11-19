import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Layout from '../Layout';
import './SystemPrompts.css';

interface SystemPrompt {
  id: number;
  prompt_text: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

interface TenantSystemPrompt extends SystemPrompt {
  tenant_id: number;
}

interface PromptHistory {
  id: number;
  prompt_id: number;
  prompt_type: string;
  tenant_id?: number;
  prompt_text: string;
  is_active: boolean;
  changed_by: string;
  change_reason?: string;
  created_at: string;
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
}

interface CreatePromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromptCreated: () => void;
  tenantId?: number;
}

interface EditPromptModalProps {
  prompt: SystemPrompt | TenantSystemPrompt | null;
  isOpen: boolean;
  onClose: () => void;
  onPromptUpdated: () => void;
  tenantId?: number;
}

interface HistoryModalProps {
  promptId: number;
  promptType: string;
  isOpen: boolean;
  onClose: () => void;
}

const CreatePromptModal: React.FC<CreatePromptModalProps> = ({ isOpen, onClose, onPromptCreated, tenantId }) => {
  const [promptText, setPromptText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPromptText('');
      setIsActive(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tenantId) {
        await apiService.createTenantSystemPrompt(tenantId, {
          prompt_text: promptText,
          is_active: isActive,
        });
      } else {
        await apiService.createSystemPrompt({
          prompt_text: promptText,
          is_active: isActive,
        });
      }
      onPromptCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tenantId ? 'Create Tenant Prompt' : 'Create Global Prompt'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="prompt-text">Prompt Text *</label>
            <textarea
              id="prompt-text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              required
              placeholder="Enter system prompt text. Use {context_text} as a placeholder for tenant context."
              rows={15}
              className="prompt-textarea"
            />
            <small>Use {'{context_text}'} as a placeholder for tenant context injection</small>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Active (will deactivate other prompts of this type)
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !promptText.trim()}>
              {loading ? 'Creating...' : 'Create Prompt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditPromptModal: React.FC<EditPromptModalProps> = ({ prompt, isOpen, onClose, onPromptUpdated, tenantId }) => {
  const [promptText, setPromptText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      setPromptText(prompt.prompt_text || '');
      setIsActive(prompt.is_active);
      setChangeReason('');
    }
  }, [prompt]);

  if (!isOpen || !prompt) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (tenantId) {
        await apiService.updateTenantSystemPrompt(tenantId, {
          prompt_text: promptText,
          is_active: isActive,
          change_reason: changeReason || undefined,
        });
      } else {
        await apiService.updateSystemPrompt(prompt.id, {
          prompt_text: promptText,
          is_active: isActive,
          change_reason: changeReason || undefined,
        });
      }
      onPromptUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{tenantId ? 'Edit Tenant Prompt' : 'Edit Global Prompt'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <form className="modal-body" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="edit-prompt-text">Prompt Text *</label>
            <textarea
              id="edit-prompt-text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              required
              rows={15}
              className="prompt-textarea"
            />
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

          <div className="form-group">
            <label htmlFor="change-reason">Change Reason (optional)</label>
            <input
              id="change-reason"
              type="text"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Reason for this change"
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" disabled={loading || !promptText.trim()}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryModal: React.FC<HistoryModalProps> = ({ promptId, promptType, isOpen, onClose }) => {
  const [history, setHistory] = useState<PromptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen, promptId, promptType]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getSystemPromptHistory(promptId, promptType);
      setHistory(response.history || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Prompt History</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          {loading ? (
            <div className="loading">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="empty-state">No history found</div>
          ) : (
            <div className="history-list">
              {history.map((entry) => (
                <div key={entry.id} className="history-item">
                  <div className="history-header">
                    <div className="history-meta">
                      <strong>{entry.changed_by}</strong>
                      <span className="history-date">
                        {new Date(entry.created_at).toLocaleString()}
                      </span>
                      {entry.is_active && (
                        <span className="status-badge active">Active</span>
                      )}
                    </div>
                    {entry.change_reason && (
                      <div className="change-reason">{entry.change_reason}</div>
                    )}
                  </div>
                  <div className="history-prompt-text">{entry.prompt_text}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SystemPrompts: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'global' | 'tenant'>('global');
  const [globalPrompts, setGlobalPrompts] = useState<SystemPrompt[]>([]);
  const [tenantPrompts, setTenantPrompts] = useState<TenantSystemPrompt[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | TenantSystemPrompt | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [historyPromptId, setHistoryPromptId] = useState<number | null>(null);
  const [historyPromptType, setHistoryPromptType] = useState<string>('global');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    loadData();
    loadTenants();
  }, [activeTab, selectedTenant]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'global') {
        const response = await apiService.getSystemPrompts();
        setGlobalPrompts(response.prompts || []);
      } else if (selectedTenant) {
        const response = await apiService.listTenantSystemPrompts(selectedTenant);
        setTenantPrompts(response.prompts || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const tenantsData = await apiService.getTenants();
      const tenantsArray = Array.isArray(tenantsData) ? tenantsData : [];
      setTenants(tenantsArray);
      if (tenantsArray.length > 0 && !selectedTenant) {
        setSelectedTenant(tenantsArray[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleEdit = (prompt: SystemPrompt | TenantSystemPrompt) => {
    setEditingPrompt(prompt);
    setIsEditModalOpen(true);
  };

  const handleViewHistory = (promptId: number, promptType: string) => {
    setHistoryPromptId(promptId);
    setHistoryPromptType(promptType);
    setIsHistoryModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateText = (text: string, maxLength: number = 200) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && globalPrompts.length === 0 && tenantPrompts.length === 0) {
    return (
      <Layout>
        <div className="system-prompts-container">
          <div className="loading">Loading prompts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="system-prompts-container">
        <div className="system-prompts-header">
          <h1>System Prompts</h1>
          <p>Manage global and tenant-specific chatbot system prompts</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'global' ? 'active' : ''}`}
            onClick={() => setActiveTab('global')}
          >
            Global Prompts
          </button>
          <button
            className={`tab ${activeTab === 'tenant' ? 'active' : ''}`}
            onClick={() => setActiveTab('tenant')}
          >
            Tenant Prompts
          </button>
        </div>

        {activeTab === 'tenant' && (
          <div className="tenant-selector">
            <label htmlFor="tenant-select">Select Tenant:</label>
            <select
              id="tenant-select"
              value={selectedTenant || ''}
              onChange={(e) => setSelectedTenant(Number(e.target.value))}
            >
              <option value="">Select a tenant...</option>
              {tenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </option>
              ))}
            </select>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <div className="prompts-section">
          <div className="section-header">
            <h2>{activeTab === 'global' ? 'Global Prompts' : 'Tenant Prompts'}</h2>
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              + Add Prompt
            </button>
          </div>

          {activeTab === 'global' ? (
            globalPrompts.length === 0 ? (
              <div className="empty-state">
                <p>No global prompts found. Create your first prompt to get started.</p>
              </div>
            ) : (
              <div className="prompts-list">
                {globalPrompts.map((prompt) => (
                  <div key={prompt.id} className="prompt-card">
                    <div className="prompt-header">
                      <div className="prompt-meta">
                        <span className={`status-badge ${prompt.is_active ? 'active' : 'inactive'}`}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="prompt-date">Created: {formatDate(prompt.created_at)}</span>
                        {prompt.created_by && (
                          <span className="prompt-author">By: {prompt.created_by}</span>
                        )}
                      </div>
                      <div className="prompt-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewHistory(prompt.id, 'global')}
                        >
                          History
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEdit(prompt)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="prompt-text">{truncateText(prompt.prompt_text)}</div>
                  </div>
                ))}
              </div>
            )
          ) : (
            !selectedTenant ? (
              <div className="empty-state">
                <p>Please select a tenant to view or manage tenant prompts.</p>
              </div>
            ) : tenantPrompts.length === 0 ? (
              <div className="empty-state">
                <p>No tenant prompts found. Create a prompt for this tenant.</p>
              </div>
            ) : (
              <div className="prompts-list">
                {tenantPrompts.map((prompt) => (
                  <div key={prompt.id} className="prompt-card">
                    <div className="prompt-header">
                      <div className="prompt-meta">
                        <span className={`status-badge ${prompt.is_active ? 'active' : 'inactive'}`}>
                          {prompt.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className="prompt-date">Created: {formatDate(prompt.created_at)}</span>
                        {prompt.created_by && (
                          <span className="prompt-author">By: {prompt.created_by}</span>
                        )}
                      </div>
                      <div className="prompt-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleViewHistory(prompt.id, 'tenant')}
                        >
                          History
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEdit(prompt)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                    <div className="prompt-text">{truncateText(prompt.prompt_text)}</div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <CreatePromptModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onPromptCreated={loadData}
          tenantId={activeTab === 'tenant' ? selectedTenant || undefined : undefined}
        />

        <EditPromptModal
          prompt={editingPrompt}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingPrompt(null);
          }}
          onPromptUpdated={loadData}
          tenantId={activeTab === 'tenant' && editingPrompt && 'tenant_id' in editingPrompt ? editingPrompt.tenant_id : undefined}
        />

        {historyPromptId && (
          <HistoryModal
            promptId={historyPromptId}
            promptType={historyPromptType}
            isOpen={isHistoryModalOpen}
            onClose={() => {
              setIsHistoryModalOpen(false);
              setHistoryPromptId(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default SystemPrompts;

