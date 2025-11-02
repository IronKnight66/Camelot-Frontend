import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScannerTool } from '../../types/scanner';
import apiService from '../../services/api';
import Layout from '../Layout';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/roleHelpers';
import { Link } from 'react-router-dom';
import './TenantScanners.css';

interface TenantTool {
  id: string;
  scanner_tool_id: string;
  scanner_tool: ScannerTool;
  is_enabled: boolean;
  max_scans_per_month?: number;
  current_usage_count?: number;
}

const TenantScanners: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  
  const [availableTools, setAvailableTools] = useState<ScannerTool[]>([]);
  const [tenantTools, setTenantTools] = useState<TenantTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'added'>('available');
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toolToAdd, setToolToAdd] = useState<ScannerTool | null>(null);
  const [tenants, setTenants] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadTenants();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load all available global tools
      const globalToolsData = await apiService.getScannerTools();
      // Handle both direct array and object with tools property
      const globalTools = Array.isArray(globalToolsData) ? globalToolsData : (globalToolsData?.tools || []);
      setAvailableTools(globalTools);

      // Load tenant's current tools
      const tenantToolsData = await apiService.getTenantScannerTools();
      const toolsData = tenantToolsData?.tools || tenantToolsData || [];

      // Ensure toolsData is always an array
      const toolsArray = Array.isArray(toolsData) ? toolsData : [];

      // Handle both nested and flat structures
      const tools = toolsArray.map((item: any) => {
        if (item.scanner_tool) {
          return {
            id: item.id.toString(),
            scanner_tool_id: item.scanner_tool?.id || item.scanner_tool?.id || item.id,
            scanner_tool: item.scanner_tool,
            is_enabled: item.is_enabled,
            max_scans_per_month: item.max_scans_per_month,
            current_usage_count: item.current_usage_count || 0
          };
        }
        return item;
      });
      
      console.log('Available tools:', globalTools.length, 'Tenant tools:', tools.length);
      
      setTenantTools(tools);
    } catch (err: any) {
      setError(err.message || 'Failed to load scanner tools');
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const tenantsData = await apiService.getTenants();
      // Ensure tenantsData is always an array
      const tenantsArray = Array.isArray(tenantsData) ? tenantsData : [];
      setTenants(tenantsArray);
      // Set first tenant as default if available
      if (tenantsArray.length > 0 && !selectedTenant) {
        setSelectedTenant(tenantsArray[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
    }
  };

  const handleAddTool = async (toolId: string) => {
    if (!selectedTenant) {
      setError('Please select a tenant first');
      return;
    }
    try {
      await apiService.enableTenantToolForSpecificTenant(toolId, selectedTenant);
      loadData();
      setActiveTab('added');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add scanner to tenant');
    }
  };

  const openAddModal = (tool: ScannerTool) => {
    setToolToAdd(tool);
    setShowAddModal(true);
  };

  const handleRemoveTool = async (toolId: string) => {
    if (window.confirm('Are you sure you want to remove this scanner from your tenant?')) {
      try {
        await apiService.deleteTenantTool(toolId);
        loadData();
      } catch (err: any) {
        setError(err.message || 'Failed to remove scanner from tenant');
      }
    }
  };

  const tenantToolIds = new Set(tenantTools.map(t => t.scanner_tool_id || t.scanner_tool?.id).filter(Boolean));
  const availableToAdd = availableTools.filter(tool => !tenantToolIds.has(tool.id));
  const addedTools = tenantTools.map(t => t.scanner_tool).filter(Boolean);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout title="Manage Tenant Scanners">
        <div className="tenant-scanners">
          <div className="loading">
            <div className="spinner"></div>
            <p>Checking permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if user has super-admin privileges
  if (userRole !== 'super-admin') {
    return (
      <Layout title="Manage Tenant Scanners">
        <div className="tenant-scanners">
          <div className="unauthorized-message">
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page. Only Super Admins can manage tenant scanners.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Manage Tenant Scanners">
      <div className="tenant-scanners">
        <div className="page-header">
          <div>
            <Link to="/settings" className="back-link">← Back to Settings</Link>
            <h1>Manage Tenant Scanners</h1>
            <p>Add scanner tools to your tenant from the global registry</p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadData}>Retry</button>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available to Add ({availableToAdd.length})
          </button>
          <button
            className={`tab ${activeTab === 'added' ? 'active' : ''}`}
            onClick={() => setActiveTab('added')}
          >
            Already Added ({tenantTools.length})
          </button>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading scanner tools...</p>
          </div>
        ) : activeTab === 'available' ? (
          <div className="tools-container">
            <h2>Available Scanner Tools</h2>
            {availableToAdd.length > 0 ? (
              <div className="tools-grid">
                {availableToAdd.map(tool => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-header">
                      <h3>{tool.displayName || tool.name}</h3>
                      <span className={`category-badge ${tool.category}`}>{tool.category}</span>
                    </div>
                    {tool.description && (
                      <p className="tool-description">{tool.description}</p>
                    )}
                    <div className="tool-meta">
                      <div className="tool-meta-item">
                        <strong>Version:</strong> {tool.version || 'Unknown'}
                      </div>
                      {tool.dockerImage && (
                        <div className="tool-meta-item">
                          <strong>Docker:</strong> {tool.dockerImage}
                        </div>
                      )}
                      <div className="tool-meta-item">
                        <strong>Pricing:</strong> {tool.pricingTier || 'Free'}
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => openAddModal(tool)}
                    >
                      + Add to Tenant
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>All available scanner tools have been added to your tenant.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="tools-container">
            <h2>Scanners Added to Tenant</h2>
            {tenantTools.length > 0 ? (
              <div className="tools-grid">
                {tenantTools.map(tool => (
                  <div key={tool.id} className="tool-card">
                    <div className="tool-header">
                      <h3>{tool.scanner_tool?.displayName || tool.scanner_tool?.name}</h3>
                      <span className={`category-badge ${tool.scanner_tool?.category}`}>
                        {tool.scanner_tool?.category}
                      </span>
                      <span className={`status-badge ${tool.is_enabled ? 'enabled' : 'disabled'}`}>
                        {tool.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {tool.scanner_tool?.description && (
                      <p className="tool-description">{tool.scanner_tool.description}</p>
                    )}
                    <div className="tool-meta">
                      {tool.max_scans_per_month && (
                        <div className="tool-meta-item">
                          <strong>Scan Limit:</strong> {tool.current_usage_count || 0} / {tool.max_scans_per_month} per month
                        </div>
                      )}
                    </div>
                    <div className="tool-actions">
                      <Link to="/tenant-tools" className="btn-secondary">
                        Manage Settings
                      </Link>
                      <button
                        className="btn-danger"
                        onClick={() => handleRemoveTool(tool.id)}
                      >
                        Remove from Tenant
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No scanners have been added to your tenant yet. Add some from the "Available to Add" tab.</p>
              </div>
            )}
          </div>
        )}

        {/* Add Tool Modal */}
        {showAddModal && toolToAdd && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Scanner to Tenant</h2>
                <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="tool-name">Scanner Tool:</label>
                  <input
                    type="text"
                    id="tool-name"
                    value={toolToAdd.displayName || toolToAdd.name}
                    disabled
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="tenant-select">Select Tenant:</label>
                  <select
                    id="tenant-select"
                    value={selectedTenant || ''}
                    onChange={(e) => setSelectedTenant(Number(e.target.value))}
                    className="form-input"
                  >
                    <option value="">Select a tenant...</option>
                    {tenants.map(tenant => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name} ({tenant.slug || tenant.name.toLowerCase().replace(/\s+/g, '-')})
                      </option>
                    ))}
                  </select>
                </div>
                {error && (
                  <div className="error-message" style={{ color: '#dc3545', marginTop: '1rem' }}>
                    {error}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  className="btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleAddTool(toolToAdd.id)}
                  disabled={!selectedTenant}
                >
                  Add to Tenant
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TenantScanners;

