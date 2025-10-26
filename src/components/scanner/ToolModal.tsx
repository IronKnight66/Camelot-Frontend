// src/components/scanner/ToolModal.tsx
import React, { useState, useEffect } from 'react';
import { ScannerTool, TenantToolSettings } from '../../types/scanner';
import './ToolModal.css';

interface ToolModalProps {
  tool: ScannerTool | null;
  tenantSettings?: TenantToolSettings;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: any) => void;
  onEnable?: (limits: any) => void;
  onDisable?: () => void;
  mode: 'view' | 'edit' | 'create' | 'settings';
  role: 'super-admin' | 'tenant-admin' | 'user';
}

const ToolModal: React.FC<ToolModalProps> = ({
  tool,
  tenantSettings,
  isOpen,
  onClose,
  onSave,
  onEnable,
  onDisable,
  mode,
  role
}) => {
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (tool) {
      if (mode === 'edit') {
        setFormData({
          name: tool.name,
          displayName: tool.displayName,
          description: tool.description,
          category: tool.category,
          dockerImage: tool.dockerImage,
          dockerTag: tool.dockerTag,
          version: tool.version,
          configSchema: JSON.stringify(tool.configSchema, null, 2),
          defaultSettings: JSON.stringify(tool.defaultSettings, null, 2),
          pricingTier: tool.pricingTier,
          isActive: tool.isActive,
          documentationUrl: tool.documentationUrl,
          helpText: tool.helpText
        });
        setIsEditing(true);
      } else if (mode === 'create') {
        setFormData({
          displayName: '',
          description: '',
          category: 'Web Application',
          dockerImage: '',
          dockerTag: 'latest',
          version: '1.0.0',
          configSchema: '{}',
          defaultSettings: '{}',
          pricingTier: 'Free',
          isActive: true,
          documentationUrl: '',
          helpText: ''
        });
        setIsEditing(true);
      } else if (mode === 'settings' && tenantSettings) {
        setFormData({
          usageLimit: tenantSettings.usageLimit || '',
          settings: JSON.stringify(tenantSettings.settings, null, 2)
        });
        setIsEditing(true);
      }
    }
  }, [tool, mode, tenantSettings]);

  const handleSave = () => {
    if ((mode === 'edit' || mode === 'create') && onSave) {
      const data = {
        ...formData,
        configSchema: JSON.parse(formData.configSchema),
        defaultSettings: JSON.parse(formData.defaultSettings)
      };
      onSave(data);
    } else if (mode === 'settings' && onEnable) {
      onEnable({
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : undefined,
        settings: JSON.parse(formData.settings)
      });
    }
  };

  if (!isOpen) return null;
  
  if (mode === 'create' && !tool) {
    // Create mode - show empty form
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Create New Scanner Tool</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="modal-body">
            <div className="form-container">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Web Application">Web Application</option>
                    <option value="Network">Network</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Code Analysis">Code Analysis</option>
                    <option value="Database">Database</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pricing Tier</label>
                  <select
                    value={formData.pricingTier || ''}
                    onChange={(e) => setFormData({...formData, pricingTier: e.target.value})}
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Docker Image</label>
                  <input
                    type="text"
                    value={formData.dockerImage || ''}
                    onChange={(e) => setFormData({...formData, dockerImage: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Docker Tag</label>
                  <input
                    type="text"
                    value={formData.dockerTag || ''}
                    onChange={(e) => setFormData({...formData, dockerTag: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Version</label>
                <input
                  type="text"
                  value={formData.version || ''}
                  onChange={(e) => setFormData({...formData, version: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Config Schema (JSON)</label>
                <textarea
                  value={formData.configSchema || ''}
                  onChange={(e) => setFormData({...formData, configSchema: e.target.value})}
                  rows={5}
                  className="json-textarea"
                />
              </div>

              <div className="form-group">
                <label>Default Settings (JSON)</label>
                <textarea
                  value={formData.defaultSettings || ''}
                  onChange={(e) => setFormData({...formData, defaultSettings: e.target.value})}
                  rows={5}
                  className="json-textarea"
                />
              </div>

              <div className="form-group">
                <label>Documentation URL</label>
                <input
                  type="url"
                  value={formData.documentationUrl || ''}
                  onChange={(e) => setFormData({...formData, documentationUrl: e.target.value})}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleSave}>
                  Create Tool
                </button>
                <button className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tool) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'view' ? tool.displayName : tool.displayName}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {mode === 'view' && (
            <div className="tool-details">
              <p><strong>Description:</strong></p>
              <p>{tool.description}</p>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Category:</span>
                  <span className="value">{tool.category}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Pricing Tier:</span>
                  <span className="value">{tool.pricingTier}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">{tool.isActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Version:</span>
                  <span className="value">{tool.version}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Docker Image:</span>
                  <span className="value">{tool.dockerImage}:{tool.dockerTag}</span>
                </div>
              </div>

              <div className="detail-section">
                <p><strong>Supported Scan Types:</strong></p>
                <div className="tag-list">
                  {tool.supportedScanTypes.map(type => (
                    <span key={type} className="tag">{type}</span>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <p><strong>Documentation:</strong></p>
                <a href={tool.documentationUrl} target="_blank" rel="noopener noreferrer">
                  {tool.documentationUrl}
                </a>
              </div>
            </div>
          )}

          {(mode === 'edit' || mode === 'create') && role === 'super-admin' && (
            <div className="form-container">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  disabled={!isEditing}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={formData.category || ''}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    disabled={!isEditing}
                  >
                    <option value="Web Application">Web Application</option>
                    <option value="Network">Network</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Code Analysis">Code Analysis</option>
                    <option value="Database">Database</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Pricing Tier</label>
                  <select
                    value={formData.pricingTier || ''}
                    onChange={(e) => setFormData({...formData, pricingTier: e.target.value})}
                    disabled={!isEditing}
                  >
                    <option value="Free">Free</option>
                    <option value="Basic">Basic</option>
                    <option value="Professional">Professional</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Docker Image</label>
                  <input
                    type="text"
                    value={formData.dockerImage || ''}
                    onChange={(e) => setFormData({...formData, dockerImage: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="form-group">
                  <label>Docker Tag</label>
                  <input
                    type="text"
                    value={formData.dockerTag || ''}
                    onChange={(e) => setFormData({...formData, dockerTag: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Config Schema (JSON)</label>
                <textarea
                  value={formData.configSchema || ''}
                  onChange={(e) => setFormData({...formData, configSchema: e.target.value})}
                  disabled={!isEditing}
                  rows={5}
                  className="json-textarea"
                />
              </div>

              {isEditing && (
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={handleSave}>
                    {mode === 'create' ? 'Create Tool' : 'Save Changes'}
                  </button>
                  <button className="btn btn-secondary" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'settings' && role === 'tenant-admin' && (
            <div className="form-container">
              {!tenantSettings?.isEnabled ? (
                <div className="enable-prompt">
                  <p>Enable this tool for your tenant?</p>
                  <div className="form-group">
                    <label>Usage Limit (optional)</label>
                    <input
                      type="number"
                      value={formData.usageLimit || ''}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                      placeholder="Unlimited if left empty"
                    />
                  </div>
                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>
                      Enable Tool
                    </button>
                    <button className="btn btn-secondary" onClick={onClose}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="form-group">
                    <label>Usage Limit</label>
                    <input
                      type="number"
                      value={formData.usageLimit || ''}
                      onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
                    />
                  </div>

                  <div className="usage-stats-display">
                    <div className="stat-item">
                      <span className="stat-label">Current Usage:</span>
                      <span className="stat-value">{tenantSettings.currentUsage}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Usage Limit:</span>
                      <span className="stat-value">
                        {tenantSettings.usageLimit || 'Unlimited'}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Last Reset:</span>
                      <span className="stat-value">
                        {new Date(tenantSettings.lastResetDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>
                      Update Settings
                    </button>
                    {onDisable && (
                      <button className="btn btn-danger" onClick={onDisable}>
                        Disable Tool
                      </button>
                    )}
                    <button className="btn btn-secondary" onClick={onClose}>
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolModal;

