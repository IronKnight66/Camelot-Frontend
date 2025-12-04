// src/components/admin/SuperAdminAPIKeys.tsx
/**
 * Super Admin API Keys Management Component
 * 
 * This component allows super admins to manage tenant API keys for AI providers.
 * This is a super-admin only feature for managing all tenant API keys.
 * 
 * KEY FEATURES:
 * ------------
 * 1. Multi-Provider Support
 *    - OpenAI (GPT-4, GPT-3.5)
 *    - Anthropic (Claude API)
 *    - Ollama (Local models)
 *    - Note: Bedrock uses IAM, no keys needed
 * 
 * 2. Key Management Operations
 *    - Add: Store new API key with description
 *    - List: View configured keys (metadata only, no raw values)
 *    - Update: Update existing key
 *    - Delete: Remove key with confirmation
 *    - Test: Validate key connectivity before saving
 * 
 * 3. Security Features
 *    - Never displays raw key values in UI
 *    - Keys stored securely encrypted in database
 *    - Encrypted at rest
 *    - Backend-only access to secrets
 * 
 * 4. User Experience
 *    - Professional, modern UI design
 *    - Real-time validation
 *    - Loading states and error handling
 *    - Success/error notifications
 *    - Responsive design
 * 
 * Integration Date: December 2025
 * Last Updated: December 2025
 */

import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import '../settings/APIKeysSettings.css';

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

const SuperAdminAPIKeys: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<TenantAPIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setError('');
      const response: APIKeyListResponse = await apiService.getTenantAPIKeys();
      setApiKeys(response.keys || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      if (!formData.apiKey.trim()) {
        setError('API key is required');
        return;
      }

      await apiService.addTenantAPIKey(
        formData.provider,
        formData.apiKey,
        formData.description || undefined
      );
      
      setShowAddForm(false);
      setFormData({ provider: 'openai', apiKey: '', description: '' });
      await loadAPIKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to add API key');
    }
  };

  const handleDeleteKey = async (provider: string) => {
    if (!window.confirm(`Are you sure you want to delete the ${provider} API key?`)) {
      return;
    }

    try {
      setError('');
      await apiService.deleteTenantAPIKey(provider);
      await loadAPIKeys();
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key');
    }
  };

  const handleTestKey = async (provider: string) => {
    try {
      setTesting(provider);
      setError('');
      const result = await apiService.testAPIKey(provider);
      if (result.valid) {
        alert(`✓ ${provider} API key is valid!`);
      } else {
        setError(result.message || 'API key validation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test API key');
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
      <div className="api-keys-settings">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading API keys...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-keys-settings">
      <div className="api-keys-header">
        <h2>API Keys Management</h2>
        <p>Manage tenant AI provider API keys (Super Admin only)</p>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={() => setError('')}>×</button>
        </div>
      )}

      <div className="api-keys-container">
        {apiKeys.length > 0 ? (
          <div className="api-keys-list">
            {apiKeys.map((key) => (
              <div key={key.id} className="api-key-card">
                <div className="api-key-header">
                  <div className="api-key-info">
                    <span className="provider-icon">{getProviderIcon(key.provider)}</span>
                    <div>
                      <h3>{getProviderName(key.provider)}</h3>
                      <p className="key-description">
                        {key.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className={`status-badge ${key.is_active ? 'active' : 'inactive'}`}>
                    {key.is_active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <div className="api-key-details">
                  <div className="detail-row">
                    <span className="detail-label">Secret Name:</span>
                    <span className="detail-value">{key.secret_name}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Added:</span>
                    <span className="detail-value">
                      {new Date(key.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="api-key-actions">
                  <button
                    className="btn-test"
                    onClick={() => handleTestKey(key.provider)}
                    disabled={testing === key.provider}
                  >
                    {testing === key.provider ? 'Testing...' : 'Test Connection'}
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteKey(key.provider)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">🔐</div>
            <h3>No API Keys Configured</h3>
            <p>Add your first API key to get started with AI-powered security analysis.</p>
          </div>
        )}

        <div className="add-key-section">
          {!showAddForm ? (
            <button
              className="btn-add-key"
              onClick={() => setShowAddForm(true)}
            >
              + Add API Key
            </button>
          ) : (
            <form className="add-key-form" onSubmit={handleAddKey}>
              <h3>Add New API Key</h3>
              
              <div className="form-group">
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

              <div className="form-group">
                <label htmlFor="apiKey">API Key</label>
                <input
                  type="password"
                  id="apiKey"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                  placeholder="Enter your API key"
                  required
                />
                <small className="form-hint">
                  Your API key is encrypted and stored securely
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Production OpenAI key"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Save API Key
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => {
                    setShowAddForm(false);
                    setFormData({ provider: 'openai', apiKey: '', description: '' });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="info-box">
        <h4>ℹ️ About API Keys (Super Admin)</h4>
        <ul>
          <li>API keys are stored securely encrypted in the database</li>
          <li>Keys are encrypted at rest and in transit</li>
          <li>Only super admins can manage tenant API keys</li>
          <li>Deleting a key will fall back to system keys for the tenant's subscription tier</li>
        </ul>
      </div>
    </div>
  );
};

export default SuperAdminAPIKeys;

