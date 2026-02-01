// src/components/assessment/Step4Review.tsx
import React, { useState, useEffect } from 'react';
import { AssessmentFormData, ScannerTool } from '../../types/assessment';
import './AssessmentWizard.css';

interface Step4ReviewProps {
  formData: AssessmentFormData;
  onBack: () => void;
  onSubmit: () => void;
  onChange?: (data: Partial<AssessmentFormData>) => void;
  scannerTools: ScannerTool[];
}

const Step4Review: React.FC<Step4ReviewProps> = ({ formData, onBack, onSubmit, onChange, scannerTools }) => {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    globalSettings: false,
    toolSettings: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Transform database scanner tools to match expected format
  const availableTools = scannerTools.map(tool => ({
    id: tool.name, // Use tool name as ID for consistency with backend
    name: tool.displayName || tool.name,
    description: tool.description || '',
    category: tool.category
  }));
  
  // Initialize tools if not already set (fallback for when Step 2 useEffect didn't run)
  useEffect(() => {
    if (availableTools.length > 0 && onChange) {
      const updatedToolSettings: { [toolId: string]: any } = { ...formData.toolSettings };
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
  }, [scannerTools.length]);

  // If no endpoints are selected, default to the website URL
  const selectedEndpoints = (formData.endpoints || []).filter(ep => ep.selected);
  const endpointsToDisplay = selectedEndpoints.length > 0 
    ? selectedEndpoints 
    : formData.websiteUrl 
      ? [{ url: formData.websiteUrl, isAttackable: true, selected: true }] 
      : [];
  
  const enabledTools = availableTools.filter(tool => {
    const settings = formData.toolSettings?.[tool.id];
    return settings?.enabled !== false; // Default to enabled if not set
  });

  const handleSubmit = () => {
    // Placeholder for future API call
    console.log('Submitting assessment:', formData);
    onSubmit();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Review Assessment</h2>
        <p>Review your assessment configuration before submitting.</p>
      </div>

      <div className="review-summary">
        {/* Website URL */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Website URL</h3>
          </div>
          <div className="review-section-content">
            <p className="review-value">{formData.websiteUrl || 'Not specified'}</p>
          </div>
        </div>

        {/* Test Type */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Test Type</h3>
          </div>
          <div className="review-section-content">
            <p className="review-value">
              {formData.testType
                ? formData.testType.charAt(0).toUpperCase() + formData.testType.slice(1)
                : 'Not specified'}
            </p>
          </div>
        </div>

        {/* Enabled Tools */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Enabled Tools</h3>
            <span className="review-count">{enabledTools.length} tool(s)</span>
          </div>
          <div className="review-section-content">
            {enabledTools.length > 0 ? (
              <ul className="review-list">
                {enabledTools.map(tool => (
                  <li key={tool.id}>{tool.name}</li>
                ))}
              </ul>
            ) : (
              <p className="review-value">No tools enabled</p>
            )}
          </div>
        </div>

        {/* Selected Endpoints */}
        <div className="review-section">
          <div className="review-section-header">
            <h3>Selected Endpoints</h3>
            <span className="review-count">{endpointsToDisplay.length} endpoint(s)</span>
          </div>
          <div className="review-section-content">
            {endpointsToDisplay.length > 0 ? (
              <ul className="review-list">
                {endpointsToDisplay.map((endpoint, index) => (
                  <li key={index} className="endpoint-review-item">
                    <span>{endpoint.url}</span>
                    <span
                      className={`attackable-badge ${endpoint.isAttackable ? 'attackable' : 'not-attackable'}`}
                    >
                      {endpoint.isAttackable ? 'Attackable' : 'Not Attackable'}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="review-value">No endpoints selected</p>
            )}
          </div>
        </div>

        {/* Global Tool Settings */}
        <div className="review-section">
          <div
            className="review-section-header clickable"
            onClick={() => toggleSection('globalSettings')}
          >
            <h3>Global Tool Settings</h3>
            <span className="review-toggle">
              {expandedSections.globalSettings ? '▼' : '▶'}
            </span>
          </div>
          {expandedSections.globalSettings && (
            <div className="review-section-content">
              <div className="settings-details">
                {formData.globalToolSettings.rateLimiting && (
                  <div className="setting-detail">
                    <strong>Rate Limiting:</strong> {formData.globalToolSettings.rateLimiting} requests/min
                  </div>
                )}
                {formData.globalToolSettings.credentials &&
                  (formData.globalToolSettings.credentials.username ||
                    formData.globalToolSettings.credentials.password ||
                    formData.globalToolSettings.credentials.apiKey) && (
                    <div className="setting-detail">
                      <strong>Credentials:</strong> Configured
                    </div>
                  )}
                {formData.globalToolSettings.customHeaders &&
                  Object.keys(formData.globalToolSettings.customHeaders).length > 0 && (
                    <div className="setting-detail">
                      <strong>Custom Headers:</strong>{' '}
                      {Object.keys(formData.globalToolSettings.customHeaders).length} header(s)
                      <ul className="nested-list">
                        {Object.entries(formData.globalToolSettings.customHeaders).map(([key, value]) => (
                          <li key={key}>
                            <strong>{key}:</strong> {value}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {!formData.globalToolSettings.rateLimiting &&
                  !formData.globalToolSettings.credentials &&
                  (!formData.globalToolSettings.customHeaders ||
                    Object.keys(formData.globalToolSettings.customHeaders).length === 0) && (
                    <div className="setting-detail">No global settings configured</div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Tool-Specific Settings (Blocked URLs) */}
        {availableTools.length > 0 && (
          <div className="review-section">
            <div
              className="review-section-header clickable"
              onClick={() => toggleSection('toolSettings')}
            >
              <h3>Tool-Specific Settings</h3>
              <span className="review-toggle">
                {expandedSections.toolSettings ? '▼' : '▶'}
              </span>
            </div>
            {expandedSections.toolSettings && (
              <div className="review-section-content">
                {availableTools.map(tool => {
                  const settings = formData.toolSettings[tool.id] || {};
                  const isEnabled = settings.enabled !== false;
                  return (
                    <div key={tool.id} className="tool-settings-review">
                      <h4>
                        {tool.name} {!isEnabled && <span className="disabled-badge">(Disabled)</span>}
                      </h4>
                      <div className="settings-details">
                        {settings.blockedUrls && settings.blockedUrls.length > 0 ? (
                          <div className="setting-detail">
                            <strong>Blocked URLs:</strong> {settings.blockedUrls.length} URL(s)
                            <ul className="nested-list">
                              {settings.blockedUrls.map((url, idx) => (
                                <li key={idx}>{url}</li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <div className="setting-detail">No blocked URLs configured</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="step-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button type="button" onClick={handleSubmit} className="btn-primary btn-submit">
          Submit Assessment
        </button>
      </div>
    </div>
  );
};

export default Step4Review;

