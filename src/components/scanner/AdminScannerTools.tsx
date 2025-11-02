// src/components/scanner/AdminScannerTools.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScannerTool, ScannerToolsListParams } from '../../types/scanner';
import apiService from '../../services/api';
import Layout from '../Layout';
import ToolCard from './ToolCard';
import ToolModal from './ToolModal';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/roleHelpers';
import './AdminScannerTools.css';

const AdminScannerTools: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const userRole = getUserRole(user);
  
  const [allTools, setAllTools] = useState<ScannerTool[]>([]);
  const [filteredTools, setFilteredTools] = useState<ScannerTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTool, setSelectedTool] = useState<ScannerTool | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filters
  const [filters, setFilters] = useState<ScannerToolsListParams>({
    page: 1,
    pageSize: 20,
    search: '',
    category: undefined,
    isActive: undefined,
    pricingTier: undefined
  });

  // Only trigger API call when backend-supported filters change
  useEffect(() => {
    loadTools();
  }, [filters.page, filters.pageSize, filters.category, filters.isActive]);

  // Apply client-side filtering for search and pricingTier
  useEffect(() => {
    let filtered = [...allTools];

    // Apply search filter
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tool => 
        tool.name.toLowerCase().includes(searchLower) ||
        tool.displayName?.toLowerCase().includes(searchLower) ||
        tool.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply pricing tier filter
    if (filters.pricingTier) {
      filtered = filtered.filter(tool => tool.pricingTier === filters.pricingTier);
    }

    setFilteredTools(filtered);
  }, [allTools, filters.search, filters.pricingTier]);

  const loadTools = async () => {
    try {
      setLoading(true);
      setError('');
      // Only send supported parameters to the backend
      const params: any = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      
      if (filters.category) {
        params.category = filters.category;
      }
      
      if (filters.isActive !== undefined) {
        params.is_active = filters.isActive;
      }
      
      const data = await apiService.getScannerTools(params);
      // Handle both direct array and object with tools property
      const tools = Array.isArray(data) ? data : (Array.isArray(data?.tools) ? data.tools : []);
      setAllTools(tools);
    } catch (err: any) {
      setError(err.message || 'Failed to load scanner tools');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (toolId: string) => {
    const tool = filteredTools.find(t => t.id === toolId);
    setSelectedTool(tool || null);
    setModalMode('view');
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedTool(null);
    setModalMode('create');
    setIsModalOpen(true);
  };

  const handleSave = async (data: any) => {
    try {
      if (selectedTool) {
        await apiService.updateScannerTool(selectedTool.id, data);
      } else {
        await apiService.createScannerTool(data);
      }
      loadTools();
      setIsModalOpen(false);
      setSelectedTool(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save tool');
    }
  };

  const handleDelete = async (toolId: string) => {
    if (window.confirm('Are you sure you want to delete this tool?')) {
      try {
        await apiService.deleteScannerTool(toolId);
        loadTools();
      } catch (err: any) {
        setError(err.message || 'Failed to delete tool');
      }
    }
  };

  const categories = ['All', 'Web Application', 'Network', 'Infrastructure', 'Code Analysis', 'Database', 'Custom'];
  const pricingTiers = ['All', 'Free', 'Basic', 'Professional', 'Enterprise'];
  const statusOptions = ['All', 'Active', 'Inactive'];

  // Show loading while checking auth
  if (authLoading) {
    return (
      <Layout title="Scanner Tool Registry">
        <div className="admin-scanner-tools">
          <div className="loading">
            <div className="spinner"></div>
            <p>Checking permissions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show unauthorized message if not super-admin
  if (userRole !== 'super-admin') {
    return (
      <Layout title="Scanner Tool Registry">
        <div className="admin-scanner-tools">
          <div className="unauthorized-message">
            <h2>Access Denied</h2>
            <p>You do not have permission to access this page. Only Super Admins can view and edit the global scanner tool registry.</p>
            <button className="btn-primary" onClick={() => navigate('/')}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Scanner Tool Registry">
      <div className="admin-scanner-tools">
        <div className="page-header">
          <button className="btn-primary" onClick={handleCreate}>
            + Create New Tool
          </button>
        </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={loadTools}>Retry</button>
        </div>
      )}

      <div className="filters-section">
        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search tools..."
            value={filters.search || ''}
            onChange={(e) => setFilters({...filters, search: e.target.value, page: 1})}
          />
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={filters.category || 'All'}
            onChange={(e) => setFilters({
              ...filters,
              category: e.target.value === 'All' ? undefined : e.target.value as any,
              page: 1
            })}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.isActive === undefined ? 'All' : filters.isActive ? 'Active' : 'Inactive'}
            onChange={(e) => setFilters({
              ...filters,
              isActive: e.target.value === 'All' ? undefined : e.target.value === 'Active',
              page: 1
            })}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Pricing Tier</label>
          <select
            value={filters.pricingTier || 'All'}
            onChange={(e) => setFilters({
              ...filters,
              pricingTier: e.target.value === 'All' ? undefined : e.target.value as any,
              page: 1
            })}
          >
            {pricingTiers.map(tier => (
              <option key={tier} value={tier}>{tier}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading scanner tools...</p>
        </div>
      ) : filteredTools.length > 0 ? (
        <div className="tools-grid">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onToggle={async (toolId) => {
                const tool = filteredTools.find(t => t.id === toolId);
                if (tool) {
                  await handleSave({ ...tool, isActive: !tool.isActive });
                }
              }}
              onViewDetails={handleViewDetails}
              onSettings={(toolId) => {
                const tool = filteredTools.find(t => t.id === toolId);
                setSelectedTool(tool || null);
                setModalMode('edit');
                setIsModalOpen(true);
              }}
              role="super-admin"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No scanner tools found. Create your first tool to get started.</p>
        </div>
      )}

      <ToolModal
        tool={selectedTool}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
        role="super-admin"
      />
      </div>
    </Layout>
  );
};

export default AdminScannerTools;

