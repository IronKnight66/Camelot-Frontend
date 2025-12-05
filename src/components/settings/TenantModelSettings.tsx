import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole, hasRole } from '../../utils/roleHelpers';
import Layout from '../Layout';
import ApiService from '../../services/api';
import './TenantModelSettings.css';

interface BedrockModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  context_window: number;
  supports_tools: boolean;
  is_enabled: boolean;
  enabled_at?: string;
  enabled_by?: string;
  disabled_at?: string;
  disabled_by?: string;
}

const TenantModelSettings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [models, setModels] = useState<BedrockModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadModelConfig();
  }, []);

  const loadModelConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ApiService.getTenantModelConfig();
      setModels(response.models || []);
    } catch (err: any) {
      console.error('Failed to load model configuration:', err);
      setError(err.response?.data?.detail || 'Failed to load model configuration');
    } finally {
      setLoading(false);
    }
  };

  const toggleModel = (modelId: string) => {
    setModels(prevModels =>
      prevModels.map(model =>
        model.id === modelId
          ? { ...model, is_enabled: !model.is_enabled }
          : model
      )
    );
    setHasChanges(true);
    setSuccess(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates = models.map(model => ({
        model_id: model.id,
        is_enabled: model.is_enabled
      }));

      const response = await ApiService.updateTenantModelConfig(updates);
      
      setSuccess(`Successfully updated ${response.enabled_count} enabled and ${response.disabled_count} disabled models.`);
      setHasChanges(false);
      
      // Reload to get fresh data with timestamps
      await loadModelConfig();
    } catch (err: any) {
      console.error('Failed to save model configuration:', err);
      setError(err.response?.data?.detail || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/settings/tenant');
  };

  const enabledCount = models.filter(m => m.is_enabled).length;

  // Check if user has admin role
  if (!hasRole(user, 'admin')) {
    return (
      <Layout>
        <div className="tenant-model-settings-container">
          <h1>Access Denied</h1>
          <p>You need tenant administrator privileges to access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="tenant-model-settings-container">
        <div className="tenant-model-settings-header">
          <div>
            <h1>AI Model Configuration</h1>
            <p>Enable and manage AI models available to your team</p>
          </div>
          <button className="back-button" onClick={handleCancel}>
            Back to Settings
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading model configuration...</p>
          </div>
        ) : (
          <>
            <div className="model-summary">
              <div className="summary-card">
                <div className="summary-icon">🤖</div>
                <div className="summary-content">
                  <div className="summary-value">{models.length}</div>
                  <div className="summary-label">Total Models</div>
                </div>
              </div>
              <div className="summary-card enabled">
                <div className="summary-icon">✓</div>
                <div className="summary-content">
                  <div className="summary-value">{enabledCount}</div>
                  <div className="summary-label">Enabled</div>
                </div>
              </div>
              <div className="summary-card disabled">
                <div className="summary-icon">✕</div>
                <div className="summary-content">
                  <div className="summary-value">{models.length - enabledCount}</div>
                  <div className="summary-label">Disabled</div>
                </div>
              </div>
            </div>

            <div className="models-list">
              {models.map(model => (
                <div key={model.id} className={`model-card ${model.is_enabled ? 'enabled' : 'disabled'}`}>
                  <div className="model-card-header">
                    <div className="model-info">
                      <h3>{model.name}</h3>
                      <span className="model-provider">{model.provider}</span>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={model.is_enabled}
                        onChange={() => toggleModel(model.id)}
                        disabled={saving}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <p className="model-description">{model.description}</p>
                  
                  <div className="model-metadata">
                    <span className="metadata-item">
                      <span className="metadata-icon">📊</span>
                      {(model.context_window / 1000).toFixed(0)}K context window
                    </span>
                    {model.supports_tools && (
                      <span className="metadata-item">
                        <span className="metadata-icon">🔧</span>
                        Tool use supported
                      </span>
                    )}
                  </div>

                  {model.enabled_at && model.is_enabled && (
                    <div className="model-audit-info">
                      Enabled on {new Date(model.enabled_at).toLocaleDateString()}
                      {model.enabled_by && model.enabled_by !== 'system_migration' && 
                        ` by ${model.enabled_by}`}
                    </div>
                  )}

                  {model.disabled_at && !model.is_enabled && (
                    <div className="model-audit-info">
                      Disabled on {new Date(model.disabled_at).toLocaleDateString()}
                      {model.disabled_by && ` by ${model.disabled_by}`}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {enabledCount === 0 && (
              <div className="warning-banner">
                <span className="warning-icon">⚠️</span>
                <div>
                  <strong>No models enabled</strong>
                  <p>Your team will not be able to use the AI chatbot until at least one model is enabled.</p>
                </div>
              </div>
            )}

            <div className="actions-bar">
              <button 
                className="btn-cancel" 
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSave}
                disabled={!hasChanges || saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default TenantModelSettings;

