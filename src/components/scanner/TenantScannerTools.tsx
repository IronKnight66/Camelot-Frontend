// src/components/scanner/TenantScannerTools.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScannerTool, TenantToolSettings } from '../../types/scanner';
import apiService from '../../services/api';
import Layout from '../Layout';
import ToolCard from './ToolCard';
import ToolModal from './ToolModal';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/roleHelpers';
import './TenantScannerTools.css';

const TenantScannerTools: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  
  const [tools, setTools] = useState<(ScannerTool & { tenantSettings?: TenantToolSettings })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTool, setSelectedTool] = useState<ScannerTool | null>(null);
  const [selectedSettings, setSelectedSettings] = useState<TenantToolSettings | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'enabled' | 'disabled'>('all');

  useEffect(() => {
    loadTools();
  }, [activeTab]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError('');

      // Get all tools enabled for tenant
      const isEnabled = activeTab === 'enabled' ? true : activeTab === 'disabled' ? false : undefined;
      const data = await apiService.getTenantScannerTools(isEnabled);
      
      // Handle both direct array and object with tools property
      const toolsFromApi = data?.tools || data || [];
      
      // Flatten the nested structure: tenant tools have a nested scanner_tool property
      const flattenedTools = toolsFromApi.map((item: any) => {
        // Check if this is the nested structure (from API)
        if (item.scanner_tool) {
          return {
            ...item.scanner_tool,
            id: item.id.toString(), // Use tenant_tool.id for tenant operations
            scannerToolId: item.scanner_tool_id?.toString() || item.scanner_tool?.id?.toString(), // Keep scanner_tool.id for enable operations
            tenantSettings: {
              isEnabled: item.is_enabled,
              currentUsage: item.current_usage_count || 0,
              usageLimit: item.max_scans_per_month,
              settings: item.tool_settings
            }
          };
        }
        // Otherwise, assume it's already flat
        return item;
      });
      
      setTools(flattenedTools);
    } catch (err: any) {
      setError(err.message || 'Failed to load scanner tools');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (toolId: string) => {
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;
      
      if (tool.tenantSettings?.isEnabled) {
        // Disable uses tenant_scanner_tool.id (which is toolId)
        await apiService.disableTenantTool(toolId);
      } else {
        // Enable uses scanner_tool.id (which is scannerToolId)
        const scannerToolId = (tool as any).scannerToolId || tool.id;
        await apiService.enableTenantTool(scannerToolId);
      }
      loadTools();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle tool');
    }
  };

  const handleSettings = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    setSelectedTool(tool || null);
    setSelectedSettings(tool?.tenantSettings);
    setIsModalOpen(true);
  };

  const handleEnableWithSettings = async (limits: any) => {
    try {
      if (selectedTool) {
        await apiService.enableTenantTool(selectedTool.id, limits);
        setIsModalOpen(false);
        loadTools();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to enable tool');
    }
  };

  const handleUpdateSettings = async (limits: any) => {
    try {
      if (selectedTool) {
        await apiService.updateTenantToolLimits(selectedTool.id, limits);
        setIsModalOpen(false);
        loadTools();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    }
  };

  const handleDisable = async () => {
    try {
      if (selectedTool) {
        await apiService.disableTenantTool(selectedTool.id);
        setIsModalOpen(false);
        loadTools();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to disable tool');
    }
  };

  const enabledCount = tools.filter(t => t.tenantSettings?.isEnabled).length;
  const disabledCount = tools.filter(t => !t.tenantSettings?.isEnabled).length;

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout title="Available Scanner Tools">
        <div className="tenant-scanner-tools">
          <div className="loading">
            <div className="spinner"></div>
            <p>Checking permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show unauthorized message if not tenant-admin or super-admin
  if (userRole !== 'super-admin' && userRole !== 'tenant-admin') {
    return (
      <Layout title="Available Scanner Tools">
        <div className="tenant-scanner-tools">
          <div className="unauthorized-message">
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page. Only Tenant Admins and Super Admins can manage tenant scanner tools.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Available Scanner Tools">
      <div className="tenant-scanner-tools">

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={loadTools}>Retry</button>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Tools ({tools.length})
        </button>
        <button
          className={`tab ${activeTab === 'enabled' ? 'active' : ''}`}
          onClick={() => setActiveTab('enabled')}
        >
          Enabled ({enabledCount})
        </button>
        <button
          className={`tab ${activeTab === 'disabled' ? 'active' : ''}`}
          onClick={() => setActiveTab('disabled')}
        >
          Disabled ({disabledCount})
        </button>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading scanner tools...</p>
        </div>
      ) : tools.length > 0 ? (
        <div className="tools-grid">
          {tools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              tenantSettings={tool.tenantSettings}
              onToggle={handleToggle}
              onViewDetails={(toolId) => {
                const t = tools.find(tt => tt.id === toolId);
                setSelectedTool(t || null);
                setSelectedSettings(t?.tenantSettings);
                setIsModalOpen(true);
              }}
              onSettings={handleSettings}
              role="tenant-admin"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No scanner tools available.</p>
        </div>
      )}

      <ToolModal
        tool={selectedTool}
        tenantSettings={selectedSettings}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onEnable={handleEnableWithSettings}
        onDisable={handleDisable}
        onSave={handleUpdateSettings}
        mode="settings"
        role="tenant-admin"
      />
      </div>
    </Layout>
  );
};

export default TenantScannerTools;

