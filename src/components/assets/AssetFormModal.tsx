import React, { useState } from 'react';
import { Asset, AssetCreate, AssetType, AssetCriticality, AssetStatus, AssetEnvironment } from '../../types/asset';
import './AssetFormModal.css';

interface AssetFormModalProps {
  asset?: Asset; // If provided, we're editing; otherwise creating
  onClose: () => void;
  onSave: (assetData: AssetCreate) => Promise<void>;
}

const AssetFormModal: React.FC<AssetFormModalProps> = ({ asset, onClose, onSave }) => {
  const isEditing = !!asset;
  
  const [formData, setFormData] = useState<AssetCreate>({
    name: asset?.name || '',
    asset_type: asset?.asset_type || 'web',
    url: asset?.url || '',
    ip_address: asset?.ip_address || '',
    domain: asset?.domain || '',
    port: asset?.port || undefined,
    owner: asset?.owner || '',
    department: asset?.department || '',
    criticality: asset?.criticality || 'medium',
    environment: asset?.environment || undefined,
    status: asset?.status || 'active',
    description: asset?.description || '',
    tags: asset?.tags || [],
    asset_metadata: asset?.asset_metadata || {},
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof AssetCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validation
    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }

    // Type-specific validation
    if (formData.asset_type === 'web' && !formData.url) {
      setError('URL is required for web assets');
      return;
    }
    if (formData.asset_type === 'ip' && !formData.ip_address) {
      setError('IP address is required for IP assets');
      return;
    }
    if (formData.asset_type === 'domain' && !formData.domain) {
      setError('Domain is required for domain assets');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to save asset');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeSpecificFields = () => {
    switch (formData.asset_type) {
      case 'web':
        return (
          <>
            <div className="form-group">
              <label htmlFor="url">URL *</label>
              <input
                type="url"
                id="url"
                value={formData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="domain">Domain</label>
              <input
                type="text"
                id="domain"
                value={formData.domain || ''}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="example.com"
              />
            </div>
          </>
        );
      case 'ip':
        return (
          <>
            <div className="form-group">
              <label htmlFor="ip_address">IP Address *</label>
              <input
                type="text"
                id="ip_address"
                value={formData.ip_address || ''}
                onChange={(e) => handleChange('ip_address', e.target.value)}
                placeholder="192.168.1.1"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input
                type="number"
                id="port"
                value={formData.port || ''}
                onChange={(e) => handleChange('port', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="80"
                min="1"
                max="65535"
              />
            </div>
          </>
        );
      case 'domain':
        return (
          <div className="form-group">
            <label htmlFor="domain">Domain *</label>
            <input
              type="text"
              id="domain"
              value={formData.domain || ''}
              onChange={(e) => handleChange('domain', e.target.value)}
              placeholder="example.com"
              required
            />
          </div>
        );
      case 'api':
        return (
          <>
            <div className="form-group">
              <label htmlFor="url">API URL *</label>
              <input
                type="url"
                id="url"
                value={formData.url || ''}
                onChange={(e) => handleChange('url', e.target.value)}
                placeholder="https://api.example.com"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input
                type="number"
                id="port"
                value={formData.port || ''}
                onChange={(e) => handleChange('port', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="443"
                min="1"
                max="65535"
              />
            </div>
          </>
        );
      case 'cloud':
        return (
          <div className="form-group">
            <label htmlFor="url">Cloud Resource URL</label>
            <input
              type="url"
              id="url"
              value={formData.url || ''}
              onChange={(e) => handleChange('url', e.target.value)}
              placeholder="https://cloud-resource.example.com"
            />
          </div>
        );
      case 'server':
        return (
          <>
            <div className="form-group">
              <label htmlFor="ip_address">IP Address</label>
              <input
                type="text"
                id="ip_address"
                value={formData.ip_address || ''}
                onChange={(e) => handleChange('ip_address', e.target.value)}
                placeholder="192.168.1.100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="domain">Hostname</label>
              <input
                type="text"
                id="domain"
                value={formData.domain || ''}
                onChange={(e) => handleChange('domain', e.target.value)}
                placeholder="server.example.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="port">Port</label>
              <input
                type="number"
                id="port"
                value={formData.port || ''}
                onChange={(e) => handleChange('port', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="22"
                min="1"
                max="65535"
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content asset-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? '✏️ Edit Asset' : '➕ Create New Asset'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-banner">{error}</div>}

            {/* Basic Information */}
            <div className="form-section">
              <h3>Basic Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Asset Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="My Production Server"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="asset_type">Asset Type *</label>
                <select
                  id="asset_type"
                  value={formData.asset_type}
                  onChange={(e) => handleChange('asset_type', e.target.value as AssetType)}
                  required
                >
                  <option value="web">🌐 Web Application</option>
                  <option value="ip">🔢 IP Address</option>
                  <option value="domain">🏰 Domain</option>
                  <option value="api">⚙️ API</option>
                  <option value="cloud">☁️ Cloud Resource</option>
                  <option value="server">🖥️ Server</option>
                </select>
              </div>

              {getTypeSpecificFields()}
            </div>

            {/* Classification */}
            <div className="form-section">
              <h3>Classification</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="criticality">Criticality *</label>
                  <select
                    id="criticality"
                    value={formData.criticality}
                    onChange={(e) => handleChange('criticality', e.target.value as AssetCriticality)}
                    required
                  >
                    <option value="critical">🔴 Critical</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="environment">Environment</label>
                  <select
                    id="environment"
                    value={formData.environment || ''}
                    onChange={(e) => handleChange('environment', e.target.value as AssetEnvironment || undefined)}
                  >
                    <option value="">Select Environment</option>
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="development">Development</option>
                    <option value="test">Test</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="status">Status *</label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => handleChange('status', e.target.value as AssetStatus)}
                    required
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">⏸️ Inactive</option>
                    <option value="archived">📦 Archived</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="owner">Owner</label>
                  <input
                    type="text"
                    id="owner"
                    value={formData.owner || ''}
                    onChange={(e) => handleChange('owner', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  value={formData.department || ''}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Engineering"
                />
              </div>
            </div>

            {/* Additional Details */}
            <div className="form-section">
              <h3>Additional Details</h3>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Describe this asset..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <div className="tags-input-container">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  <button type="button" onClick={handleAddTag} className="btn-add-tag">
                    Add
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="tags-list">
                    {formData.tags.map((tag, idx) => (
                      <span key={idx} className="tag-item">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? 'Saving...' : isEditing ? 'Update Asset' : 'Create Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssetFormModal;

