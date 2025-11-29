import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Layout from '../Layout';
import './ScanTypes.css';

interface ScanType {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface CreateScanTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanTypeCreated: () => void;
}

interface EditScanTypeModalProps {
  scanType: ScanType | null;
  isOpen: boolean;
  onClose: () => void;
  onScanTypeUpdated: () => void;
}

const CreateScanTypeModal: React.FC<CreateScanTypeModalProps> = ({ isOpen, onClose, onScanTypeCreated }) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDisplayName('');
      setDescription('');
      setIsActive(true);
      setError(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await apiService.createScanType({
        name,
        display_name: displayName,
        description: description || null,
        is_active: isActive
      });

      onScanTypeCreated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create scan type');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Create New Scan Type</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="name">Name (Internal)*</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., web_app_scan"
                required
                maxLength={50}
                className="form-input"
              />
              <small className="form-help">Unique internal identifier (lowercase, underscores)</small>
            </div>

            <div className="form-group">
              <label htmlFor="displayName">Display Name*</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g., Web Application Scan"
                required
                maxLength={100}
                className="form-input"
              />
              <small className="form-help">User-friendly name shown in the UI</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this scan type is used for..."
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Scan Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const EditScanTypeModal: React.FC<EditScanTypeModalProps> = ({ scanType, isOpen, onClose, onScanTypeUpdated }) => {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scanType) {
      setName(scanType.name);
      setDisplayName(scanType.display_name);
      setDescription(scanType.description || '');
      setIsActive(scanType.is_active);
      setError(null);
    }
  }, [scanType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanType) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.updateScanType(scanType.id, {
        name,
        display_name: displayName,
        description: description || null,
        is_active: isActive
      });

      onScanTypeUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update scan type');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !scanType) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Edit Scan Type</h2>
          <button onClick={onClose} className="modal-close">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="edit-name">Name (Internal)*</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className="form-input"
              />
              <small className="form-help">Unique internal identifier (lowercase, underscores)</small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-displayName">Display Name*</label>
              <input
                id="edit-displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                maxLength={100}
                className="form-input"
              />
              <small className="form-help">User-friendly name shown in the UI</small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-description">Description</label>
              <textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="form-textarea"
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Active</span>
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Scan Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ScanTypes: React.FC = () => {
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedScanType, setSelectedScanType] = useState<ScanType | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadScanTypes = async () => {
    try {
      setLoading(true);
      const response = await apiService.getScanTypes();
      setScanTypes(response.scan_types);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load scan types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanTypes();
  }, []);

  const handleEdit = (scanType: ScanType) => {
    setSelectedScanType(scanType);
    setShowEditModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiService.deleteScanType(id);
      loadScanTypes();
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete scan type');
    }
  };

  return (
    <Layout>
      <div className="scan-types-container">
        <div className="page-header">
          <div>
            <h1>Scan Types</h1>
            <p className="page-description">Manage available scan types for security assessments</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Scan Type
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-message">Loading scan types...</div>
        ) : scanTypes.length === 0 ? (
          <div className="empty-state">
            <p>No scan types found. Create one to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="scan-types-table">
              <thead>
                <tr>
                  <th>Display Name</th>
                  <th>Internal Name</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {scanTypes.map((scanType) => (
                  <tr key={scanType.id} className={!scanType.is_active ? 'inactive' : ''}>
                    <td>
                      <strong>{scanType.display_name}</strong>
                    </td>
                    <td>
                      <code className="internal-name">{scanType.name}</code>
                    </td>
                    <td>
                      <span className="scan-type-description">
                        {scanType.description || 'No description'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${scanType.is_active ? 'active' : 'inactive'}`}>
                        {scanType.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      {scanType.created_at
                        ? new Date(scanType.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </td>
                    <td>
                      <div className="scan-type-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEdit(scanType)}
                        >
                          Edit
                        </button>
                        {deleteConfirm === scanType.id ? (
                          <div className="delete-confirm">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(scanType.id)}
                            >
                              Confirm
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirm(scanType.id)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateScanTypeModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onScanTypeCreated={loadScanTypes}
        />

        <EditScanTypeModal
          scanType={selectedScanType}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedScanType(null);
          }}
          onScanTypeUpdated={loadScanTypes}
        />
      </div>
    </Layout>
  );
};

export default ScanTypes;
