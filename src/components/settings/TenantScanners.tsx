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

interface Tenant {
  id: number;
  name: string;
  slug?: string;
}

const TenantScanners: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  
  const [availableTools, setAvailableTools] = useState<ScannerTool[]>([]);
  const [tenantTools, setTenantTools] = useState<TenantTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<number | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedAvailableTools, setSelectedAvailableTools] = useState<Set<string>>(new Set());
  const [selectedCurrentTools, setSelectedCurrentTools] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Load tenants on mount
  useEffect(() => {
    loadTenants();
  }, []);

  // Load global tools on mount
  useEffect(() => {
    loadGlobalTools();
  }, []);

  // Load tenant-specific tools when tenant is selected
  useEffect(() => {
    if (selectedTenant) {
      loadTenantTools();
    } else {
      setTenantTools([]);
    }
  }, [selectedTenant]);

  const loadGlobalTools = async () => {
    try {
      const globalToolsData = await apiService.getScannerTools();
      const globalTools = Array.isArray(globalToolsData) ? globalToolsData : (globalToolsData?.tools || []);
      setAvailableTools(globalTools);
    } catch (err: any) {
      console.error('Failed to load global tools:', err);
      setError(err.message || 'Failed to load global scanner tools');
    }
  };

  const loadTenants = async () => {
    try {
      const tenantsData = await apiService.getTenants();
      const tenantsArray = Array.isArray(tenantsData) ? tenantsData : [];
      setTenants(tenantsArray);
    } catch (err: any) {
      console.error('Failed to load tenants:', err);
      setError(err.message || 'Failed to load tenants');
    }
  };

  const loadTenantTools = async () => {
    if (!selectedTenant) return;
    
    try {
      setLoading(true);
      setError('');
      
      const tenantToolsData = await apiService.getTenantScannerToolsForTenant(selectedTenant);
      const toolsData = tenantToolsData?.tools || tenantToolsData || [];
      const toolsArray = Array.isArray(toolsData) ? toolsData : [];

      const tools = toolsArray.map((item: any) => ({
        id: item.id.toString(),
        scanner_tool_id: item.scanner_tool?.id || item.scanner_tool_id || item.id,
        scanner_tool: item.scanner_tool,
        is_enabled: item.is_enabled,
        max_scans_per_month: item.max_scans_per_month,
        current_usage_count: item.current_usage_count || 0
      }));
      
      setTenantTools(tools);
    } catch (err: any) {
      setError(err.message || 'Failed to load tenant scanner tools');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantChange = (tenantId: number) => {
    setSelectedTenant(tenantId);
    setSelectedAvailableTools(new Set());
    setSelectedCurrentTools(new Set());
    setError('');
  };

  const handleBulkAdd = async () => {
    if (!selectedTenant || selectedAvailableTools.size === 0) return;
    
    setBulkActionLoading(true);
    setError('');
    
    try {
      const promises = Array.from(selectedAvailableTools).map(toolId =>
        apiService.enableTenantToolForSpecificTenant(toolId, selectedTenant)
      );
      
      await Promise.all(promises);
      
      // Reload tenant tools
      await loadTenantTools();
      setSelectedAvailableTools(new Set());
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to add scanners to tenant');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkRemove = async () => {
    if (!selectedTenant || selectedCurrentTools.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to remove ${selectedCurrentTools.size} scanner(s) from this tenant?`)) {
      return;
    }
    
    setBulkActionLoading(true);
    setError('');
    
    try {
      const promises = Array.from(selectedCurrentTools).map(toolId =>
        apiService.deleteTenantToolForTenant(selectedTenant, toolId)
      );
      
      await Promise.all(promises);
      
      // Reload tenant tools
      await loadTenantTools();
      setSelectedCurrentTools(new Set());
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to remove scanners from tenant');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleAvailableToolSelection = (toolId: string) => {
    const newSelection = new Set(selectedAvailableTools);
    if (newSelection.has(toolId)) {
      newSelection.delete(toolId);
    } else {
      newSelection.add(toolId);
    }
    setSelectedAvailableTools(newSelection);
  };

  const toggleCurrentToolSelection = (toolId: string) => {
    const newSelection = new Set(selectedCurrentTools);
    if (newSelection.has(toolId)) {
      newSelection.delete(toolId);
    } else {
      newSelection.add(toolId);
    }
    setSelectedCurrentTools(newSelection);
  };

  const toggleSelectAllAvailable = () => {
    if (selectedAvailableTools.size === availableToAdd.length) {
      setSelectedAvailableTools(new Set());
    } else {
      setSelectedAvailableTools(new Set(availableToAdd.map(t => t.id)));
    }
  };

  const toggleSelectAllCurrent = () => {
    if (selectedCurrentTools.size === tenantTools.length) {
      setSelectedCurrentTools(new Set());
    } else {
      setSelectedCurrentTools(new Set(tenantTools.map(t => t.id)));
    }
  };

  // Calculate available tools (global tools minus tenant tools)
  // Create a set of scanner_tool_ids that are already added to this tenant
  const tenantToolIds = new Set(
    tenantTools
      .map(t => {
        // Get the scanner_tool_id from various possible locations
        const id = t.scanner_tool_id || t.scanner_tool?.id;
        // Convert to string for consistent comparison
        return id ? String(id) : null;
      })
      .filter(Boolean)
  );
  
  // Filter out tools that are already added
  const availableToAdd = availableTools.filter(tool => {
    const toolId = String(tool.id);
    return !tenantToolIds.has(toolId);
  });

  const selectedTenantObj = tenants.find(t => t.id === selectedTenant);

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
            <p>Add or remove scanner tools for tenants from the global registry</p>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {/* Tenant Selector */}
        <div className="tenant-select-block">
          <label htmlFor="tenant-selector">Select Tenant:</label>
          <select
            id="tenant-selector"
            value={selectedTenant || ''}
            onChange={(e) => handleTenantChange(Number(e.target.value))}
            className="tenant-selector"
          >
            <option value="">-- Select a tenant --</option>
            {tenants.map(tenant => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name} {tenant.slug && `(${tenant.slug})`}
              </option>
            ))}
          </select>
        </div>

        {!selectedTenant ? (
          <div className="empty-state">
            <p>Please select a tenant to manage their scanner tools.</p>
          </div>
        ) : loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading scanner tools...</p>
          </div>
        ) : (
          <div className="tenant-scanners-panels">
            {/* Available to Add Panel */}
            <div className="panel panel-available">
              <div className="panel-header">
                <h2>Available to Add</h2>
                <button
                  className="btn-primary"
                  onClick={handleBulkAdd}
                  disabled={selectedAvailableTools.size === 0 || bulkActionLoading}
                >
                  {bulkActionLoading ? 'Adding...' : `Add Selected (${selectedAvailableTools.size})`}
                </button>
              </div>
              
              {availableToAdd.length > 0 ? (
                <div className="table-wrapper">
                  <table className="tenant-scanners-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={selectedAvailableTools.size === availableToAdd.length && availableToAdd.length > 0}
                            onChange={toggleSelectAllAvailable}
                            title="Select all"
                          />
                        </th>
                        <th>Scanner Tool</th>
                        <th>Category</th>
                        <th className="hide-mobile">Version</th>
                      </tr>
                    </thead>
                    <tbody>
                      {availableToAdd.map(tool => (
                        <tr key={tool.id}>
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={selectedAvailableTools.has(tool.id)}
                              onChange={() => toggleAvailableToolSelection(tool.id)}
                            />
                          </td>
                          <td>
                            <div className="tool-name-cell">
                              <strong>{tool.displayName || tool.name}</strong>
                              <span className="tool-meta-inline hide-desktop">{tool.version || 'Unknown'}</span>
                            </div>
                          </td>
                          <td>
                            <span className={`category-badge ${tool.category}`}>
                              {tool.category || 'N/A'}
                            </span>
                          </td>
                          <td className="hide-mobile">{tool.version || 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>All available scanner tools have been added to this tenant.</p>
                </div>
              )}
            </div>

            {/* Current Tools Panel */}
            <div className="panel panel-current">
              <div className="panel-header">
                <h2>Current Tools for {selectedTenantObj?.name || 'Tenant'}</h2>
                <button
                  className="btn-danger"
                  onClick={handleBulkRemove}
                  disabled={selectedCurrentTools.size === 0 || bulkActionLoading}
                >
                  {bulkActionLoading ? 'Removing...' : `Remove Selected (${selectedCurrentTools.size})`}
                </button>
              </div>
              
              {tenantTools.length > 0 ? (
                <div className="table-wrapper">
                  <table className="tenant-scanners-table">
                    <thead>
                      <tr>
                        <th className="checkbox-col">
                          <input
                            type="checkbox"
                            checked={selectedCurrentTools.size === tenantTools.length && tenantTools.length > 0}
                            onChange={toggleSelectAllCurrent}
                            title="Select all"
                          />
                        </th>
                        <th>Scanner Tool</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th className="hide-mobile">Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tenantTools.map(tool => (
                        <tr key={tool.id}>
                          <td className="checkbox-col">
                            <input
                              type="checkbox"
                              checked={selectedCurrentTools.has(tool.id)}
                              onChange={() => toggleCurrentToolSelection(tool.id)}
                            />
                          </td>
                          <td>
                            <div className="tool-name-cell">
                              <strong>{tool.scanner_tool?.displayName || tool.scanner_tool?.name}</strong>
                              <span className="tool-meta-inline hide-desktop">
                                {tool.max_scans_per_month ? (
                                  `${tool.current_usage_count || 0} / ${tool.max_scans_per_month}`
                                ) : (
                                  'No limit'
                                )}
                              </span>
                            </div>
                          </td>
                          <td>
                            <span className={`category-badge ${tool.scanner_tool?.category}`}>
                              {tool.scanner_tool?.category || 'N/A'}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${tool.is_enabled ? 'enabled' : 'disabled'}`}>
                              {tool.is_enabled ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                          <td className="hide-mobile">
                            {tool.max_scans_per_month ? (
                              <span>
                                {tool.current_usage_count || 0} / {tool.max_scans_per_month}
                              </span>
                            ) : (
                              <span>No limit</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No scanners have been added to this tenant yet. Select tools from "Available to Add" and click "Add Selected".</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TenantScanners;
