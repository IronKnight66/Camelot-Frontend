// src/components/scanner/MyScanners.tsx
import React, { useState, useEffect } from 'react';
import { ScannerTool, UserToolPreferences } from '../../types/scanner';
import apiService from '../../services/api';
import Layout from '../Layout';
import ToolCard from './ToolCard';
import './MyScanners.css';

const MyScanners: React.FC = () => {
  const [tools, setTools] = useState<(ScannerTool & { userPreferences?: UserToolPreferences })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    loadMyTools();
  }, []);

  const loadMyTools = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getMyScannerTools();
      // Extract preferences array from response
      const preferences = data?.preferences || data || [];
      setTools(Array.isArray(preferences) ? preferences : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load your scanners');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (toolId: string) => {
    try {
      const tool = tools.find(t => t.id === toolId);
      if (!tool) return;

      if (tool.userPreferences?.isActivated) {
        await apiService.deactivateScannerTool(toolId);
      } else {
        await apiService.activateScannerTool(toolId);
      }
      loadMyTools();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle scanner');
    }
  };

  const handleViewDetails = (toolId: string) => {
    const tool = tools.find(t => t.id === toolId);
    if (tool) {
      // Could open a modal or navigate to details page
      console.log('View details for:', tool.displayName);
    }
  };

  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(tools.map(t => t.category)))];
  const activatedCount = tools.filter(t => t.userPreferences?.isActivated).length;

  return (
    <Layout>
      <div className="my-scanners">
        <div className="my-scanners-header">
          <h1>My Scanners</h1>
          <p>Manage your personal scanner preferences and activated tools</p>
        </div>

        <div className="stats-section">
          <div className="stats">
          <div className="stat-card">
            <div className="stat-value">{tools.length}</div>
            <div className="stat-label">Available</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activatedCount}</div>
            <div className="stat-label">Activated</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={loadMyTools}>Retry</button>
        </div>
      )}

      <div className="filters-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search scanners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="category-filter">
          <label>Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your scanners...</p>
        </div>
      ) : filteredTools.length > 0 ? (
        <div className="tools-grid">
          {filteredTools.map(tool => (
            <ToolCard
              key={tool.id}
              tool={tool}
              userPreferences={tool.userPreferences}
              onToggle={handleToggle}
              onViewDetails={handleViewDetails}
              role="user"
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No scanners match your search criteria.</p>
        </div>
      )}
      </div>
    </Layout>
  );
};

export default MyScanners;

