import React, { useState, useEffect } from 'react';
import Layout from '../Layout';
import api from '../../services/api';
import './FindingsConfiguration.css';

interface Level {
  id: number;
  tenant_id: string;
  label: string;
  value: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

interface LevelFormData {
  label: string;
  value: string;
  color: string;
  sort_order: number;
}

type TabType = 'severity' | 'status';
type ModalType = 'add' | 'edit' | 'delete' | null;

const FindingsConfiguration: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('severity');
  const [severityLevels, setSeverityLevels] = useState<Level[]>([]);
  const [statusLevels, setStatusLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedLevel, setSelectedLevel] = useState<Level | null>(null);
  const [formData, setFormData] = useState<LevelFormData>({
    label: '',
    value: '',
    color: '#DC143C',
    sort_order: 1
  });
  
  // Migration state
  const [migrationTarget, setMigrationTarget] = useState<string>('');
  const [levelUsage, setLevelUsage] = useState<number>(0);

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [severity, status] = await Promise.all([
        api.getSeverityLevels(),
        api.getStatusLevels()
      ]);
      
      setSeverityLevels(severity);
      setStatusLevels(status);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load configuration');
      console.error('Error loading levels:', err);
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

  const openAddModal = () => {
    const levels = activeTab === 'severity' ? severityLevels : statusLevels;
    const maxSort = levels.length > 0 ? Math.max(...levels.map(l => l.sort_order)) : 0;
    
    setFormData({
      label: '',
      value: '',
      color: '#DC143C',
      sort_order: maxSort + 1
    });
    setSelectedLevel(null);
    setModalType('add');
  };

  const openEditModal = (level: Level) => {
    setFormData({
      label: level.label,
      value: level.value,
      color: level.color,
      sort_order: level.sort_order
    });
    setSelectedLevel(level);
    setModalType('edit');
  };

  const openDeleteModal = async (level: Level) => {
    setSelectedLevel(level);
    setMigrationTarget('');
    
    // Check usage
    try {
      const usage = activeTab === 'severity' 
        ? await api.getSeverityLevelUsage(level.value)
        : await api.getStatusLevelUsage(level.value);
      
      setLevelUsage(usage.findings_count);
      setModalType('delete');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check level usage');
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedLevel(null);
    setFormData({
      label: '',
      value: '',
      color: '#DC143C',
      sort_order: 1
    });
    setMigrationTarget('');
    setLevelUsage(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (modalType === 'add') {
        if (activeTab === 'severity') {
          await api.createSeverityLevel(formData);
        } else {
          await api.createStatusLevel(formData);
        }
      } else if (modalType === 'edit' && selectedLevel) {
        const updateData = {
          label: formData.label,
          color: formData.color,
          sort_order: formData.sort_order
        };
        
        if (activeTab === 'severity') {
          await api.updateSeverityLevel(selectedLevel.id, updateData);
        } else {
          await api.updateStatusLevel(selectedLevel.id, updateData);
        }
      }

      await loadLevels();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save level');
      console.error('Error saving level:', err);
    }
  };

  const handleDelete = async () => {
    if (!selectedLevel) return;
    setError(null);

    try {
      // If level is in use, migrate first
      if (levelUsage > 0 && migrationTarget) {
        await api.migrateFindingsLevel(
          selectedLevel.value,
          migrationTarget,
          activeTab
        );
      }

      // Delete the level
      if (activeTab === 'severity') {
        await api.deleteSeverityLevel(selectedLevel.id);
      } else {
        await api.deleteStatusLevel(selectedLevel.id);
      }

      await loadLevels();
      closeModal();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete level');
      console.error('Error deleting level:', err);
    }
  };

  const currentLevels = activeTab === 'severity' ? severityLevels : statusLevels;
  const availableMigrationTargets = currentLevels.filter(
    l => l.value !== selectedLevel?.value && l.is_active
  );

  return (
    <Layout>
      <div className="findings-config-container">
        <div className="findings-config-header">
          <h1>Findings Configuration</h1>
          <p>Configure custom severity and status levels for security findings</p>
        </div>

        {/* Tabs */}
        <div className="config-tabs">
          <button
            className={`config-tab ${activeTab === 'severity' ? 'active' : ''}`}
            onClick={() => setActiveTab('severity')}
          >
            Severity Levels
          </button>
          <button
            className={`config-tab ${activeTab === 'status' ? 'active' : ''}`}
            onClick={() => setActiveTab('status')}
          >
            Status Levels
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading configuration...</p>
          </div>
        ) : (
          <div className="config-content">
            <div className="config-toolbar">
              <button className="add-level-btn" onClick={openAddModal}>
                + Add {activeTab === 'severity' ? 'Severity' : 'Status'} Level
              </button>
            </div>

            <div className="levels-table-wrapper">
              <table className="levels-table">
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Value</th>
                    <th>Color</th>
                    <th>Preview</th>
                    <th>Sort Order</th>
                    <th>Usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLevels.map((level) => (
                    <tr key={level.id} className={!level.is_active ? 'inactive-row' : ''}>
                      <td>{level.label}</td>
                      <td className="value-cell">{level.value}</td>
                      <td className="color-cell">
                        <div className="color-swatch" style={{ backgroundColor: level.color }}>
                          {level.color}
                        </div>
                      </td>
                      <td>
                        <span
                          className="badge-preview"
                          style={{
                            backgroundColor: level.color,
                            color: '#fff',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            fontSize: '12px'
                          }}
                        >
                          {level.label.toUpperCase()}
                        </span>
                      </td>
                      <td>{level.sort_order}</td>
                      <td>
                        <LevelUsageCell level={level} type={activeTab} />
                      </td>
                      <td className="actions-cell">
                        {!level.is_system_default && (
                          <>
                            <button
                              className="edit-btn"
                              onClick={() => openEditModal(level)}
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => openDeleteModal(level)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                        {level.is_system_default && (
                          <span className="system-badge">System Default</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {(modalType === 'add' || modalType === 'edit') && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalType === 'add' ? 'Add' : 'Edit'} {activeTab === 'severity' ? 'Severity' : 'Status'} Level</h2>
                <button className="close-modal-btn" onClick={closeModal}>×</button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Label *</label>
                    <input
                      type="text"
                      value={formData.label}
                      onChange={(e) => handleLabelChange(e.target.value)}
                      placeholder="e.g., Critical, High, New"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Value (auto-generated) *</label>
                    <input
                      type="text"
                      value={formData.value}
                      readOnly
                      className="readonly-input"
                    />
                    <small>Used internally - generated from label</small>
                  </div>

                  <div className="form-group">
                    <label>Color *</label>
                    <div className="color-picker-wrapper">
                      <input
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

                  <div className="form-group">
                    <label>Sort Order *</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                      min="1"
                      required
                    />
                    <small>Lower numbers appear first</small>
                  </div>

                  <div className="preview-section">
                    <label>Preview:</label>
                    <span
                      className="badge-preview-large"
                      style={{
                        backgroundColor: formData.color,
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '14px',
                        display: 'inline-block'
                      }}
                    >
                      {formData.label.toUpperCase() || 'PREVIEW'}
                    </span>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary">
                    {modalType === 'add' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete/Migration Modal */}
        {modalType === 'delete' && selectedLevel && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header delete-header">
                <h2>Delete {activeTab === 'severity' ? 'Severity' : 'Status'} Level</h2>
                <button className="close-modal-btn" onClick={closeModal}>×</button>
              </div>

              <div className="modal-body">
                <p className="warning-text">
                  Are you sure you want to delete <strong>{selectedLevel.label}</strong>?
                </p>

                {levelUsage > 0 && (
                  <>
                    <div className="usage-warning">
                      ⚠️ This level is currently used by <strong>{levelUsage}</strong> finding(s).
                    </div>

                    <div className="form-group">
                      <label>Migrate findings to: *</label>
                      <select
                        value={migrationTarget}
                        onChange={(e) => setMigrationTarget(e.target.value)}
                        required
                      >
                        <option value="">Select a replacement level...</option>
                        {availableMigrationTargets.map((level) => (
                          <option key={level.id} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      <small>All findings will be migrated to the selected level before deletion</small>
                    </div>
                  </>
                )}

                {levelUsage === 0 && (
                  <p className="success-text">
                    ✓ This level is not currently in use and can be safely deleted.
                  </p>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-danger"
                  onClick={handleDelete}
                  disabled={levelUsage > 0 && !migrationTarget}
                >
                  {levelUsage > 0 ? 'Migrate & Delete' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

// Component to show usage count with live loading
const LevelUsageCell: React.FC<{ level: Level; type: TabType }> = ({ level, type }) => {
  const [usage, setUsage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const loadUsage = async () => {
    setLoading(true);
    try {
      const result = type === 'severity'
        ? await api.getSeverityLevelUsage(level.value)
        : await api.getStatusLevelUsage(level.value);
      setUsage(result.findings_count);
    } catch (err) {
      console.error('Failed to load usage:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="usage-cell">
      {usage !== null ? (
        <span className={usage > 0 ? 'usage-count active' : 'usage-count'}>
          {usage} finding{usage !== 1 ? 's' : ''}
        </span>
      ) : (
        <button
          className="load-usage-btn"
          onClick={loadUsage}
          disabled={loading}
        >
          {loading ? '...' : 'Check'}
        </button>
      )}
    </div>
  );
};

export default FindingsConfiguration;

