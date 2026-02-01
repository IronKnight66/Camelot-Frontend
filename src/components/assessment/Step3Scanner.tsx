// src/components/assessment/Step3Scanner.tsx
import React, { useState, useEffect } from 'react';
import { AssessmentFormData, ToolSetting, ScannerTool } from '../../types/assessment';
import './AssessmentWizard.css';

interface Step3ScannerProps {
  formData: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
  scannerTools: ScannerTool[];
}

const Step3Scanner: React.FC<Step3ScannerProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
  scannerTools,
}) => {

  // Transform database scanner tools to match expected format
  const availableTools = scannerTools.map(tool => ({
    id: tool.name, // Use tool name as ID for consistency with backend
    name: tool.displayName || tool.name,
    description: tool.description || '',
    category: tool.category
  }));

  // Initialize all tools as enabled by default when test type is set or changes
  useEffect(() => {
    if (availableTools.length > 0 && formData.testType) {
      const updatedToolSettings: { [toolId: string]: ToolSetting } = { ...formData.toolSettings };
      let hasChanges = false;

      availableTools.forEach(tool => {
        if (!updatedToolSettings[tool.id]) {
          updatedToolSettings[tool.id] = { enabled: true };
          hasChanges = true;
        } else if (updatedToolSettings[tool.id].enabled === undefined) {
          updatedToolSettings[tool.id] = { ...updatedToolSettings[tool.id], enabled: true };
          hasChanges = true;
        }
      });

      if (hasChanges) {
        onChange({ toolSettings: updatedToolSettings });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.testType]);

  const handleToolEnableToggle = (toolId: string) => {
    const currentSettings = formData.toolSettings[toolId] || {};
    // Explicitly handle the enabled state - default to true if undefined, then toggle
    const currentEnabled = currentSettings.enabled === true;
    const updatedSettings = {
      ...formData.toolSettings,
      [toolId]: { ...currentSettings, enabled: !currentEnabled },
    };
    onChange({ toolSettings: updatedSettings });
  };

  const handleGlobalSettingChange = (setting: Partial<typeof formData.globalToolSettings>) => {
    onChange({
      globalToolSettings: { ...formData.globalToolSettings, ...setting },
    });
  };

  const handleGlobalCredentialChange = (field: 'username' | 'password' | 'apiKey', value: string) => {
    const currentCredentials = formData.globalToolSettings.credentials || {};
    handleGlobalSettingChange({
      credentials: { ...currentCredentials, [field]: value },
    });
  };

  const handleGlobalHeaderAdd = (key: string, value: string) => {
    if (!key.trim() || !value.trim()) return;
    const customHeaders = { ...(formData.globalToolSettings.customHeaders || {}), [key]: value };
    handleGlobalSettingChange({ customHeaders });
  };

  const handleGlobalHeaderRemove = (key: string) => {
    const customHeaders = { ...(formData.globalToolSettings.customHeaders || {}) };
    delete customHeaders[key];
    handleGlobalSettingChange({ customHeaders });
  };

  const handleToggleAllTools = () => {
    // Check if all tools are currently enabled
    const allEnabled = availableTools.every(tool => {
      const settings = formData.toolSettings[tool.id] || {};
      return settings.enabled !== false;
    });

    // Toggle all tools to the opposite state
    const updatedSettings = { ...formData.toolSettings };
    availableTools.forEach(tool => {
      const currentSettings = updatedSettings[tool.id] || {};
      updatedSettings[tool.id] = { ...currentSettings, enabled: !allEnabled };
    });

    onChange({ toolSettings: updatedSettings });
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Scanner Configuration</h2>
        <p>Configure global settings and tool-specific options for your security scanners.</p>
      </div>

      {/* Global Tool Settings Section */}
      <div className="section">
        <h3>Global Tool Settings</h3>
        <div className="global-settings-content">
          {/* Rate Limiting */}
          <div className="setting-group">
            <label>Rate Limiting (requests per minute)</label>
            <input
              type="number"
              min="1"
              value={formData.globalToolSettings.rateLimiting || ''}
              onChange={(e) =>
                handleGlobalSettingChange({
                  rateLimiting: parseInt(e.target.value) || undefined,
                })
              }
              placeholder="e.g., 60"
            />
          </div>

          {/* Credentials */}
          <div className="setting-group">
            <label>Credentials</label>
            <div className="credentials-inputs">
              <input
                type="text"
                placeholder="Username"
                value={formData.globalToolSettings.credentials?.username || ''}
                onChange={(e) =>
                  handleGlobalCredentialChange('username', e.target.value)
                }
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.globalToolSettings.credentials?.password || ''}
                onChange={(e) =>
                  handleGlobalCredentialChange('password', e.target.value)
                }
              />
              <input
                type="text"
                placeholder="API Key (optional)"
                value={formData.globalToolSettings.credentials?.apiKey || ''}
                onChange={(e) =>
                  handleGlobalCredentialChange('apiKey', e.target.value)
                }
              />
            </div>
          </div>

          {/* Custom Headers */}
          <div className="setting-group">
            <label>Custom Headers</label>
            <div className="headers-input">
              <input
                type="text"
                placeholder="Header name"
                id="global-header-key"
              />
              <input
                type="text"
                placeholder="Header value"
                id="global-header-value"
              />
              <button
                type="button"
                onClick={(e) => {
                  const keyInput = document.getElementById(
                    'global-header-key'
                  ) as HTMLInputElement;
                  const valueInput = document.getElementById(
                    'global-header-value'
                  ) as HTMLInputElement;
                  if (keyInput && valueInput) {
                    handleGlobalHeaderAdd(keyInput.value, valueInput.value);
                    keyInput.value = '';
                    valueInput.value = '';
                  }
                }}
                className="btn-add"
              >
                Add
              </button>
            </div>
            <div className="headers-list">
              {Object.entries(formData.globalToolSettings.customHeaders || {}).map(([key, value]) => (
                <div key={key} className="header-item">
                  <span>
                    <strong>{key}:</strong> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGlobalHeaderRemove(key)}
                    className="btn-remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Select Tools Section */}
      {availableTools.length > 0 && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Select Tools</h3>
            <button
              type="button"
              onClick={handleToggleAllTools}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
            >
              {availableTools.every(tool => {
                const settings = formData.toolSettings[tool.id] || {};
                return settings.enabled !== false;
              }) ? '☐ Uncheck All' : '☑ Check All'}
            </button>
          </div>
          {availableTools.map((tool) => {
            const settings = formData.toolSettings[tool.id] || {};
            const isEnabled = settings.enabled !== false; // Default to true

            return (
              <div key={tool.id} className="tool-settings-card">
                <div className="tool-settings-header">
                  <div className="tool-settings-header-left">
                    <label className="tool-enable-checkbox">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => handleToolEnableToggle(tool.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="tool-settings-title">{tool.name}</span>
                    </label>
                    <span className="tool-description-small">{tool.description}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="step-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step3Scanner;
