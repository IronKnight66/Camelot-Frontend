// src/components/assessment/Step1Configuration.tsx
import React, { useState, useEffect } from 'react';
import { AssessmentFormData, TestType, ScanType } from '../../types/assessment';
import ApiService from '../../services/api';
import './AssessmentWizard.css';

interface Asset {
  id: number;
  name: string;
  asset_type: string;
  url?: string;
  ip_address?: string;
  domain?: string;
  status: string;
}

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
  const [errors, setErrors] = useState<{ websiteUrl?: string; testType?: string; asset?: string; authorizationAccepted?: string }>({});
  const [scanTypes, setScanTypes] = useState<ScanType[]>([]);
  const [loadingScanTypes, setLoadingScanTypes] = useState<boolean>(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);
  const [useExistingAsset, setUseExistingAsset] = useState<boolean>(formData.useExistingAsset || false);

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

  useEffect(() => {
    const fetchAssets = async () => {
      if (!useExistingAsset) return;
      
      try {
        setLoadingAssets(true);
        const response = await ApiService.getAssets({ page: 1, page_size: 100, status: 'active' });
        setAssets(response.assets || []);
      } catch (error) {
        console.error('Error fetching assets:', error);
        setAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    };

    fetchAssets();
  }, [useExistingAsset]);

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

  const handleAssetModeChange = (useExisting: boolean) => {
    setUseExistingAsset(useExisting);
    onChange({ 
      useExistingAsset: useExisting,
      assetId: null,
      websiteUrl: ''
    });
    setErrors({});
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value ? parseInt(e.target.value) : null;
    const selectedAsset = assets.find(a => a.id === assetId);
    
    onChange({ 
      assetId,
      websiteUrl: selectedAsset ? (selectedAsset.url || selectedAsset.domain || selectedAsset.ip_address || '') : ''
    });
    
    if (errors.asset || errors.websiteUrl) {
      setErrors({ ...errors, asset: undefined, websiteUrl: undefined });
    }
  };

  const handleWebsiteUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    onChange({ websiteUrl: url, assetId: null });
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

  const handleAuthorizationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ authorizationAccepted: e.target.checked });
    if (errors.authorizationAccepted) {
      setErrors({ ...errors, authorizationAccepted: undefined });
    }
  };

  const handleNext = () => {
    const newErrors: { websiteUrl?: string; testType?: string; asset?: string; authorizationAccepted?: string } = {};

    if (useExistingAsset) {
      if (!formData.assetId) {
        newErrors.asset = 'Please select an asset';
      }
    } else {
      if (!formData.websiteUrl.trim()) {
        newErrors.websiteUrl = 'Target is required';
      } else if (!validateUrl(formData.websiteUrl)) {
        newErrors.websiteUrl = 'Please enter a valid URL, domain, or IP address';
      }
    }

    if (!formData.testType) {
      newErrors.testType = 'Test type is required';
    }

    if (!formData.authorizationAccepted) {
      newErrors.authorizationAccepted = 'You must accept the authorization statement to continue.';
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
        <p>Select an existing asset or enter a new target to test.</p>
      </div>

      <div className="form-group">
        <label>Target Selection <span className="required">*</span></label>
        <div className="asset-mode-toggle">
          <button
            type="button"
            className={`toggle-btn ${!useExistingAsset ? 'active' : ''}`}
            onClick={() => handleAssetModeChange(false)}
          >
            Enter New Target
          </button>
          <button
            type="button"
            className={`toggle-btn ${useExistingAsset ? 'active' : ''}`}
            onClick={() => handleAssetModeChange(true)}
          >
            Select Existing Asset
          </button>
        </div>
      </div>

      {useExistingAsset ? (
        <div className="form-group">
          <label htmlFor="assetSelect">
            Select Asset <span className="required">*</span>
          </label>
          <select
            id="assetSelect"
            value={formData.assetId || ''}
            onChange={handleAssetChange}
            className={errors.asset ? 'input-error' : ''}
            disabled={loadingAssets}
          >
            <option value="">
              {loadingAssets ? 'Loading assets...' : 'Select an asset...'}
            </option>
            {assets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.name} - {asset.asset_type} {asset.url ? `(${asset.url})` : asset.ip_address ? `(${asset.ip_address})` : ''}
              </option>
            ))}
          </select>
          {errors.asset && (
            <span className="error-message">{errors.asset}</span>
          )}
          {formData.websiteUrl && (
            <div className="selected-target-info">
              <strong>Target:</strong> {formData.websiteUrl}
            </div>
          )}
        </div>
      ) : (
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
      )}

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

      <div className="form-group">
        <label>Authorization and Responsibility <span className="required">*</span></label>
        <div className="acceptance-statement">
          <p>
            I confirm that I have the legal authority and permission to perform security scans 
            (including vulnerability assessments) against the target(s) specified. I own or control 
            the systems/domains listed, or have obtained written permission from the owner(s). 
            I warrant that the scanning I request is lawful, within scope, and will not violate 
            any contracts, third-party rights, or applicable laws. I understand that scans may 
            cause disruption or expose vulnerabilities and accept responsibility for all outcomes. 
            I agree to hold harmless and indemnify Camelot from any third-party claims, damages, 
            or losses arising from scanning without appropriate authorization or beyond agreed scope.
          </p>
        </div>
        <div className="acceptance-checkbox">
          <input
            type="checkbox"
            id="authorizationAccepted"
            checked={formData.authorizationAccepted || false}
            onChange={handleAuthorizationChange}
          />
          <label htmlFor="authorizationAccepted">
            I have read, understood, and accept the above statement, and I authorize these scans under the stated terms.
          </label>
        </div>
        {errors.authorizationAccepted && (
          <span className="error-message">{errors.authorizationAccepted}</span>
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

