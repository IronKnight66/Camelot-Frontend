// src/components/assessment/Step1Configuration.tsx
import React, { useState, useEffect } from 'react';
import { AssessmentFormData, TestType, ScanType } from '../../types/assessment';
import ApiService from '../../services/api';
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
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [loadingScanTypes, setLoadingScanTypes] = useState<boolean>(true);

  useEffect(() => {
    const fetchScanTypes = async () => {
      try {
        setLoadingScanTypes(true);
        const response = await ApiService.getScanTypes();
        setScanTypes(response.scan_types || []);
      } catch (error) {
        console.error('Error fetching scan types:', error);
        // Use fallback scan types if fetch fails
        setScanTypes([]);
      } finally {
        setLoadingScanTypes(false);
      }
    };

    fetchScanTypes();
  }, []);

  const validateUrl = (input: string): boolean => {
    if (!input.trim()) {
      return false;
    }
    
    const trimmed = input.trim();
    
    // Try to parse as full URL (with protocol)
    try {
      const urlObj = new URL(trimmed);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      // Not a full URL, check if it's a domain or IP
    }
    
    // Check for IP address (IPv4)
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(:\d+)?$/;
    if (ipv4Regex.test(trimmed)) {
      const parts = trimmed.split(':')[0].split('.');
      return parts.every(part => {
        const num = parseInt(part, 10);
        return num >= 0 && num <= 255;
      });
    }
    
    // Check for domain name (basic validation)
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return domainRegex.test(trimmed);
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
      newErrors.websiteUrl = 'Target is required';
    } else if (!validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL, domain, or IP address';
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
          placeholder="https://example.com, example.com, or 192.168.1.1"
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
          disabled={loadingScanTypes}
        >
          <option value="">
            {loadingScanTypes ? 'Loading scan types...' : 'Select test type...'}
          </option>
          {scanTypes.map((scanType) => (
            <option key={scanType.id} value={scanType.name}>
              {scanType.display_name}
            </option>
          ))}
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

