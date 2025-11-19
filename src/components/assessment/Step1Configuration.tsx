// src/components/assessment/Step1Configuration.tsx
import React, { useState } from 'react';
import { AssessmentFormData, TestType } from '../../types/assessment';
import './AssessmentWizard.css';

interface Step1ConfigurationProps {
  formData: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
  onNext: () => void;
}

const Step1Configuration: React.FC<Step1ConfigurationProps> = ({
  formData,
  onChange,
  onNext,
}) => {
  const [errors, setErrors] = useState<{ websiteUrl?: string; testType?: string }>({});

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) {
      return false;
    }
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleWebsiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange({ websiteUrl: url });
    if (errors.websiteUrl) {
      setErrors({ ...errors, websiteUrl: undefined });
    }
  };

  const handleTestTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const testType = e.target.value as TestType;
    onChange({ testType });
    if (errors.testType) {
      setErrors({ ...errors, testType: undefined });
    }
  };

  const handleNext = () => {
    const newErrors: { websiteUrl?: string; testType?: string } = {};

    if (!formData.websiteUrl.trim()) {
      newErrors.websiteUrl = 'Website URL is required';
    } else if (!validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL (http:// or https://)';
    }

    if (!formData.testType) {
      newErrors.testType = 'Test type is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onNext();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Assessment Configuration</h2>
        <p>Enter the website URL and select the type of test you want to perform.</p>
      </div>

      <div className="form-group">
        <label htmlFor="websiteUrl">
          What is the website we want to test? <span className="required">*</span>
        </label>
        <input
          type="text"
          id="websiteUrl"
          value={formData.websiteUrl}
          onChange={handleWebsiteUrlChange}
          placeholder="https://example.com"
          className={errors.websiteUrl ? 'input-error' : ''}
        />
        {errors.websiteUrl && (
          <span className="error-message">{errors.websiteUrl}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="testType">
          What kind of test? <span className="required">*</span>
        </label>
        <select
          id="testType"
          value={formData.testType}
          onChange={handleTestTypeChange}
          className={errors.testType ? 'input-error' : ''}
        >
          <option value="">Select test type...</option>
          <option value="network">Network</option>
          <option value="dast">DAST (Dynamic Application Security Testing)</option>
          <option value="web">Web</option>
          <option value="server">Server</option>
        </select>
        {errors.testType && (
          <span className="error-message">{errors.testType}</span>
        )}
      </div>

      <div className="step-actions">
        <button type="button" onClick={handleNext} className="btn-primary">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step1Configuration;

