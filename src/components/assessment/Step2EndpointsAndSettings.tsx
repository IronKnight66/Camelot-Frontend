// src/components/assessment/Step2EndpointsAndSettings.tsx
import React, { useState, useEffect } from 'react';
import { AssessmentFormData, Endpoint, ToolSetting } from '../../types/assessment';
import { mockEndpoints, mockTools } from './mockData';
import './AssessmentWizard.css';

interface Step2EndpointsAndSettingsProps {
  formData: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2EndpointsAndSettings: React.FC<Step2EndpointsAndSettingsProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
}) => {
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => {
    // Initialize endpoints with selected state from formData
    return mockEndpoints.map(ep => ({
      ...ep,
      selected: formData.endpoints.find(e => e.url === ep.url)?.selected || false,
    }));
  });
  const [expandedToolSettings, setExpandedToolSettings] = useState<{ [toolId: string]: boolean }>({});

  const availableTools = formData.testType ? mockTools[formData.testType as keyof typeof mockTools] || [] : [];

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

  const handleEndpointToggle = (url: string) => {
    const updatedEndpoints = endpoints.map(ep =>
      ep.url === url ? { ...ep, selected: !ep.selected } : ep
    );
    setEndpoints(updatedEndpoints);
    onChange({ endpoints: updatedEndpoints });
  };

  const handleAttackableChange = (url: string, isAttackable: boolean) => {
    const updatedEndpoints = endpoints.map(ep =>
      ep.url === url ? { ...ep, isAttackable } : ep
    );
    setEndpoints(updatedEndpoints);
    onChange({ endpoints: updatedEndpoints });
  };

  const handleToolEnableToggle = (toolId: string) => {
    const currentSettings = formData.toolSettings[toolId] || {};
    const updatedSettings = {
      ...formData.toolSettings,
      [toolId]: { ...currentSettings, enabled: !currentSettings.enabled },
    };
    onChange({ toolSettings: updatedSettings });
  };

  const handleToolSettingChange = (toolId: string, setting: Partial<ToolSetting>) => {
    const currentSettings = formData.toolSettings[toolId] || {};
    const updatedSettings = {
      ...formData.toolSettings,
      [toolId]: { ...currentSettings, ...setting },
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

  const handleBlockedUrlAdd = (toolId: string, url: string) => {
    if (!url.trim()) return;
    const currentSettings = formData.toolSettings[toolId] || {};
    const blockedUrls = currentSettings.blockedUrls || [];
    if (!blockedUrls.includes(url)) {
      handleToolSettingChange(toolId, {
        blockedUrls: [...blockedUrls, url],
      });
    }
  };

  const handleBlockedUrlRemove = (toolId: string, url: string) => {
    const currentSettings = formData.toolSettings[toolId] || {};
    const blockedUrls = (currentSettings.blockedUrls || []).filter(u => u !== url);
    handleToolSettingChange(toolId, { blockedUrls });
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

  const toggleToolSettings = (toolId: string) => {
    setExpandedToolSettings(prev => ({
      ...prev,
      [toolId]: !prev[toolId],
    }));
  };

  const handleNext = () => {
    // Update endpoints in formData
    onChange({ endpoints });
    onNext();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Endpoints & Tool Configuration</h2>
        <p>Select endpoints to test and configure your security tools.</p>
      </div>

      {/* Endpoints Section */}
      <div className="section">
        <h3>Select Endpoints</h3>
        <div className="endpoints-list">
          {endpoints.map((endpoint) => (
            <div key={endpoint.url} className="endpoint-item">
              <div className="endpoint-row">
                <label className="endpoint-checkbox">
                  <input
                    type="checkbox"
                    checked={endpoint.selected || false}
                    onChange={() => handleEndpointToggle(endpoint.url)}
                  />
                  <span className="endpoint-url">{endpoint.url}</span>
                </label>
                <div className="endpoint-attackable-select">
                  <select
                    id={`attackable-${endpoint.url}`}
                    value={endpoint.isAttackable ? 'true' : 'false'}
                    onChange={(e) =>
                      handleAttackableChange(endpoint.url, e.target.value === 'true')
                    }
                    className="attackable-dropdown"
                  >
                    <option value="true">Attackable</option>
                    <option value="false">Not Attackable</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
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

      {/* Tool-Specific Settings Section */}
      {availableTools.length > 0 && (
        <div className="section">
          <h3>Tool-Specific Settings</h3>
          {availableTools.map((tool) => {
            const settings = formData.toolSettings[tool.id] || {};
            const isEnabled = settings.enabled !== false; // Default to true
            const isExpanded = expandedToolSettings[tool.id];

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
                  <span
                    className="tool-settings-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleToolSettings(tool.id);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </span>
                </div>

                {isExpanded && (
                  <div className="tool-settings-content">
                    {/* Blocked URLs */}
                    <div className="setting-group">
                      <label>Blocked URLs</label>
                      <div className="blocked-urls-input">
                        <input
                          type="text"
                          placeholder="Enter URL to block"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleBlockedUrlAdd(tool.id, e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            if (input) {
                              handleBlockedUrlAdd(tool.id, input.value);
                              input.value = '';
                            }
                          }}
                          className="btn-add"
                        >
                          Add
                        </button>
                      </div>
                      <div className="blocked-urls-list">
                        {(settings.blockedUrls || []).map((url) => (
                          <div key={url} className="blocked-url-item">
                            <span>{url}</span>
                            <button
                              type="button"
                              onClick={() => handleBlockedUrlRemove(tool.id, url)}
                              className="btn-remove"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="step-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step2EndpointsAndSettings;

