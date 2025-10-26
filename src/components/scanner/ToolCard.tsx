// src/components/scanner/ToolCard.tsx
import React from 'react';
import { ScannerTool, TenantToolSettings, UserToolPreferences } from '../../types/scanner';
import './ToolCard.css';

interface ToolCardProps {
  tool: ScannerTool;
  tenantSettings?: TenantToolSettings;
  userPreferences?: UserToolPreferences;
  onToggle?: (toolId: string) => void;
  onViewDetails?: (toolId: string) => void;
  onSettings?: (toolId: string) => void;
  role: 'super-admin' | 'tenant-admin' | 'user';
}

const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  tenantSettings,
  userPreferences,
  onToggle,
  onViewDetails,
  onSettings,
  role
}) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Web Application': '#4f46e5',
      'Network': '#059669',
      'Infrastructure': '#dc2626',
      'Code Analysis': '#7c3aed',
      'Database': '#ea580c',
      'Custom': '#64748b'
    };
    return colors[category] || '#64748b';
  };

  const getPricingTierColor = (tier: string) => {
    const colors: Record<string, string> = {
      'Free': '#10b981',
      'Basic': '#3b82f6',
      'Professional': '#8b5cf6',
      'Enterprise': '#f59e0b'
    };
    return colors[tier] || '#6b7280';
  };

  const isEnabled = tenantSettings?.isEnabled || false;
  const isActivated = userPreferences?.isActivated || false;

  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <div className="tool-card-title">
          <h3>{tool.displayName || tool.name}</h3>
          <div className="tool-card-badges">
            {tool.category && (
              <span 
                className="category-badge"
                style={{ backgroundColor: getCategoryColor(tool.category) }}
              >
                {tool.category}
              </span>
            )}
            {tool.pricingTier && (
              <span 
                className="pricing-badge"
                style={{ backgroundColor: getPricingTierColor(tool.pricingTier) }}
              >
                {tool.pricingTier}
              </span>
            )}
          </div>
        </div>
        <div className="tool-card-actions">
          {role === 'super-admin' && !tool.isActive && (
            <span className="inactive-badge">Inactive</span>
          )}
          {role === 'tenant-admin' && (
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={() => onToggle?.(tool.id)}
              />
              <span className="slider"></span>
            </label>
          )}
          {role === 'user' && (
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={isActivated}
                onChange={() => onToggle?.(tool.id)}
              />
              <span className="slider"></span>
            </label>
          )}
        </div>
      </div>

      <div className="tool-card-body">
        <p className="tool-description">{tool.description}</p>
        
        {role === 'tenant-admin' && tenantSettings && (
          <div className="tool-usage-info">
            <div className="usage-stats">
              <span>Usage: {tenantSettings.currentUsage}</span>
              {tenantSettings.usageLimit && (
                <span> / {tenantSettings.usageLimit}</span>
              )}
            </div>
          </div>
        )}

        {role === 'user' && userPreferences && (
          <div className="tool-usage-info">
            <div className="usage-stats">
              <span>Times used: {userPreferences.timesUsed}</span>
              {userPreferences.lastUsedAt && (
                <span className="last-used">
                  Last: {new Date(userPreferences.lastUsedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="tool-meta">
          <div className="tool-info-row">
            <span className="label">Version:</span>
            <span className="value">{tool.version}</span>
          </div>
          <div className="tool-info-row">
            <span className="label">Docker:</span>
            <span className="value">{tool.dockerImage}:{tool.dockerTag}</span>
          </div>
        </div>
      </div>

        <div className="tool-card-footer">
        <div className="scan-types">
          {(tool.supportedScanTypes || []).map(type => (
            <span key={type} className="scan-type-tag">{type}</span>
          ))}
        </div>
        <div className="tool-actions">
          <button 
            className="btn btn-secondary"
            onClick={() => onViewDetails?.(tool.id)}
          >
            View Details
          </button>
          {onSettings && (
            <button 
              className="btn btn-primary"
              onClick={() => onSettings(tool.id)}
            >
              Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ToolCard;

