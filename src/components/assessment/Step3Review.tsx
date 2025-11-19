// src/components/assessment/Step3Review.tsx
import React, { useState } from 'react';
import { AssessmentFormData } from '../../types/assessment';
import { mockTools } from './mockData';
import './AssessmentWizard.css';

interface Step3ReviewProps {
  formData: AssessmentFormData;
  onBack: () => void;
  onSubmit: () => void;
}

const Step3Review: React.FC<Step3ReviewProps> = ({ formData, onBack, onSubmit }) => {
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

  const selectedEndpoints = formData.endpoints.filter(ep => ep.selected);
  
  // Get enabled tools based on test type
  const availableTools = formData.testType ? mockTools[formData.testType as keyof typeof mockTools] || [] : [];
  const enabledTools = availableTools.filter(tool => {
    const settings = formData.toolSettings[tool.id];
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
            <span className="review-count">{selectedEndpoints.length} endpoint(s)</span>
          </div>
          <div className="review-section-content">
            {selectedEndpoints.length > 0 ? (
              <ul className="review-list">
                {selectedEndpoints.map((endpoint, index) => (
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

export default Step3Review;

