/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Layout from '../Layout';
import './SystemPrompts.css';

type PromptType = 'chatbot' | 'scanner_selection' | 'start_scan' | 'recon' | 'verification_injection' | 'verification_xss' | 'verification_auth' | 'verification_authz' | 'verification_ssrf';

interface SystemPrompt {
  id: number;
  prompt_type: PromptType;
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

const PROMPT_TYPE_INFO: Record<PromptType, { label: string; description: string; color: string; placeholders: string[] }> = {
  chatbot: {
    label: 'Chatbot',
    description: 'AI chatbot conversation prompts for Arthur assistant',
    color: '#007bff',
    placeholders: ['{context_text}']
  },
  scanner_selection: {
    label: 'Scanner Selection',
    description: 'AI prompt for selecting appropriate security scanners',
    color: '#28a745',
    placeholders: ['{scan_type}', '{target}']
  },
  start_scan: {
    label: 'Start Scan',
    description: 'Prompt for scan initiation messages',
    color: '#fd7e14',
    placeholders: ['{scan_type}', '{target}', '{scanners}']
  },
  recon: {
    label: 'Reconnaissance',
    description: 'Prompt for reconnaissance planning and tool recommendations',
    color: '#6f42c1',
    placeholders: ['{target}']
  },
  verification_injection: {
    label: 'Verification: Injection',
    description: 'Prompt for verifying SQL/Command/Code Injection vulnerabilities',
    color: '#dc3545',
    placeholders: ['{title}', '{description}', '{target_url}', '{severity}']
  },
  verification_xss: {
    label: 'Verification: XSS',
    description: 'Prompt for verifying Cross-Site Scripting vulnerabilities',
    color: '#e83e8c',
    placeholders: ['{title}', '{description}', '{target_url}', '{severity}']
  },
  verification_auth: {
    label: 'Verification: Authentication',
    description: 'Prompt for verifying Authentication vulnerabilities',
    color: '#fd7e14',
    placeholders: ['{title}', '{description}', '{target_url}', '{severity}']
  },
  verification_authz: {
    label: 'Verification: Authorization',
    description: 'Prompt for verifying Authorization/Access Control vulnerabilities',
    color: '#ffc107',
    placeholders: ['{title}', '{description}', '{target_url}', '{severity}']
  },
  verification_ssrf: {
    label: 'Verification: SSRF',
    description: 'Prompt for verifying Server-Side Request Forgery vulnerabilities',
    color: '#17a2b8',
    placeholders: ['{title}', '{description}', '{target_url}', '{severity}']
  }
};

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
  const [promptType, setPromptType] = useState<PromptType>('chatbot');
  const [promptText, setPromptText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setPromptType('chatbot');
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
          prompt_type: promptType,
          prompt_text: promptText,
          is_active: isActive,
        });
      } else {
        await apiService.createSystemPrompt({
          prompt_type: promptType,
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
            <label htmlFor="prompt-type">Prompt Type *</label>
            <select
              id="prompt-type"
              value={promptType}
              onChange={(e) => setPromptType(e.target.value as PromptType)}
              className="prompt-type-selector"
            >
              {Object.entries(PROMPT_TYPE_INFO).map(([type, info]) => (
                <option key={type} value={type}>
                  {info.label}
                </option>
              ))}
            </select>
            <small className="prompt-type-description">
              {PROMPT_TYPE_INFO[promptType].description}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="prompt-text">Prompt Text *</label>
            <textarea
              id="prompt-text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              required
              placeholder={`Enter system prompt text for ${PROMPT_TYPE_INFO[promptType].label}...`}
              rows={15}
              className="prompt-textarea"
            />
            <small>
              Available placeholders: {PROMPT_TYPE_INFO[promptType].placeholders.join(', ')}
            </small>
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
  const [promptType, setPromptType] = useState<PromptType>('chatbot');
  const [promptText, setPromptText] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [changeReason, setChangeReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (prompt) {
      setPromptType(prompt.prompt_type || 'chatbot');
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
          prompt_type: promptType,
          prompt_text: promptText,
          is_active: isActive,
          change_reason: changeReason || undefined,
        });
      } else {
        await apiService.updateSystemPrompt(prompt.id, {
          prompt_type: promptType,
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
            <label htmlFor="edit-prompt-type">Prompt Type *</label>
            <select
              id="edit-prompt-type"
              value={promptType}
              onChange={(e) => setPromptType(e.target.value as PromptType)}
              className="prompt-type-selector"
            >
              {Object.entries(PROMPT_TYPE_INFO).map(([type, info]) => (
                <option key={type} value={type}>
                  {info.label}
                </option>
              ))}
            </select>
            <small className="prompt-type-description">
              {PROMPT_TYPE_INFO[promptType].description}
            </small>
          </div>

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
            <small>
              Available placeholders: {PROMPT_TYPE_INFO[promptType].placeholders.join(', ')}
            </small>
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
  const [promptTypeFilter, setPromptTypeFilter] = useState<PromptType | 'all'>('all');
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

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filterPrompts = <T extends SystemPrompt | TenantSystemPrompt>(prompts: T[]): T[] => {
    if (promptTypeFilter === 'all') {
      return prompts;
    }
    return prompts.filter(prompt => prompt.prompt_type === promptTypeFilter);
  };

  const filteredGlobalPrompts = filterPrompts(globalPrompts);
  const filteredTenantPrompts = filterPrompts(tenantPrompts);

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
          <p>Manage global and tenant-specific system prompts for chatbot, scanner selection, scan initiation, and reconnaissance</p>
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

        <div className="prompt-type-filter">
          <label htmlFor="type-filter">Filter by Type:</label>
          <select
            id="type-filter"
            value={promptTypeFilter}
            onChange={(e) => setPromptTypeFilter(e.target.value as PromptType | 'all')}
            className="prompt-type-filter-select"
          >
            <option value="all">All Types</option>
            {Object.entries(PROMPT_TYPE_INFO).map(([type, info]) => (
              <option key={type} value={type}>
                {info.label}
              </option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="prompts-section">
          <div className="section-header">
            <h2>{activeTab === 'global' ? 'Global Prompts' : 'Tenant Prompts'}</h2>
            <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
              + Add Prompt
            </button>
          </div>

          {activeTab === 'global' ? (
            filteredGlobalPrompts.length === 0 ? (
              <div className="empty-state">
                <p>No global prompts found{promptTypeFilter !== 'all' ? ` for type "${PROMPT_TYPE_INFO[promptTypeFilter as PromptType]?.label}"` : ''}. Create your first prompt to get started.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="system-prompts-table">
                  <thead>
                    <tr>
                      <th>Prompt Type</th>
                      <th>Status</th>
                      <th>Prompt Text</th>
                      <th>Created</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGlobalPrompts.map((prompt) => (
                      <tr key={prompt.id}>
                        <td>
                          <span
                            className="prompt-type-badge"
                            style={{ backgroundColor: PROMPT_TYPE_INFO[prompt.prompt_type]?.color || '#6c757d' }}
                          >
                            {PROMPT_TYPE_INFO[prompt.prompt_type]?.label || prompt.prompt_type}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${prompt.is_active ? 'active' : 'inactive'}`}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="prompt-text-preview">{truncateText(prompt.prompt_text, 100)}</span>
                        </td>
                        <td>{formatDate(prompt.created_at)}</td>
                        <td>{prompt.created_by || 'N/A'}</td>
                        <td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            !selectedTenant ? (
              <div className="empty-state">
                <p>Please select a tenant to view or manage tenant prompts.</p>
              </div>
            ) : filteredTenantPrompts.length === 0 ? (
              <div className="empty-state">
                <p>No tenant prompts found{promptTypeFilter !== 'all' ? ` for type "${PROMPT_TYPE_INFO[promptTypeFilter as PromptType]?.label}"` : ''}. Create a prompt for this tenant.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table className="system-prompts-table">
                  <thead>
                    <tr>
                      <th>Prompt Type</th>
                      <th>Status</th>
                      <th>Prompt Text</th>
                      <th>Created</th>
                      <th>Created By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTenantPrompts.map((prompt) => (
                      <tr key={prompt.id}>
                        <td>
                          <span
                            className="prompt-type-badge"
                            style={{ backgroundColor: PROMPT_TYPE_INFO[prompt.prompt_type]?.color || '#6c757d' }}
                          >
                            {PROMPT_TYPE_INFO[prompt.prompt_type]?.label || prompt.prompt_type}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${prompt.is_active ? 'active' : 'inactive'}`}>
                            {prompt.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <span className="prompt-text-preview">{truncateText(prompt.prompt_text, 100)}</span>
                        </td>
                        <td>{formatDate(prompt.created_at)}</td>
                        <td>{prompt.created_by || 'N/A'}</td>
                        <td>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

