import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import Step1Configuration from './assessment/Step1Configuration';
import Step2EndpointsAndSettings from './assessment/Step2EndpointsAndSettings';
import Step3Review from './assessment/Step3Review';
import { AssessmentFormData, ScannerTool } from '../types/assessment';
import apiService from '../services/api';
import './Assessment.css';
import './assessment/AssessmentWizard.css';

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [scannerTools, setScannerTools] = useState<ScannerTool[]>([]);
  const [toolsLoading, setToolsLoading] = useState<boolean>(true);
  const [formData, setFormData] = useState<AssessmentFormData>({
    websiteUrl: '',
    testType: '',
    endpoints: [],
    toolSettings: {},
    globalToolSettings: {},
    assetId: null,
    useExistingAsset: false,
    authorizationAccepted: false,
  });

  useEffect(() => {
    const fetchScannerTools = async () => {
      try {
        console.log('Fetching tenant scanner tools...');
        const response = await apiService.getTenantScannerTools(true);
        console.log('Scanner tools response:', response);
        
        // Transform the API response to flatten the nested scanner_tool structure
        const tools = (response.tools || []).map((tool: any) => {
          const scannerTool = tool.scanner_tool || {};
          return {
            id: tool.id,
            tenantId: tool.tenant_id,
            scannerToolId: tool.scanner_tool_id,
            isEnabled: tool.is_enabled,
            name: scannerTool.name || '',
            displayName: scannerTool.display_name || scannerTool.name || '',
            description: scannerTool.description || '',
            category: scannerTool.category || '',
            dockerImage: scannerTool.docker_image || '',
            dockerTag: scannerTool.docker_tag || '',
            version: scannerTool.version || scannerTool.latest_version,
            isActive: scannerTool.is_active || false,
            pricingTier: scannerTool.pricing_tier || '',
            supportedScanTypes: scannerTool.supported_scan_types || []
          };
        });
        
        setScannerTools(tools);
      } catch (error) {
        console.error('Failed to fetch scanner tools:', error);
        // Set empty array on error so the UI still works
        setScannerTools([]);
      } finally {
        setToolsLoading(false);
      }
    };
    fetchScannerTools();
  }, []);

  const handleFormDataChange = (data: Partial<AssessmentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      console.log('Submitting assessment:', formData);

      // Extract selected scanner tools from toolSettings
      const enabledScanners = Object.entries(formData.toolSettings)
        .filter(([_, settings]: [string, any]) => settings.enabled !== false)
        .map(([toolId, _]: [string, any]) => toolId);

      // Extract selected endpoints, default to website URL if none selected
      const selectedEndpoints = formData.endpoints
        .filter(ep => ep.selected)
        .map(ep => ep.url);
      
      // If no endpoints are selected, use the website URL as the default endpoint
      const endpointsToSubmit = selectedEndpoints.length > 0 
        ? selectedEndpoints 
        : [formData.websiteUrl];

      // Prepare scan data for backend API
      const scanData: any = {
        name: `${formData.testType.trim()} - ${formData.websiteUrl}`,
        description: `Assessment for ${formData.websiteUrl}`,
        scan_type: formData.testType.trim(),  // Remove trailing/leading spaces
        target_url: formData.websiteUrl,
        scan_config: {
          endpoints: endpointsToSubmit,
          global_settings: formData.globalToolSettings,
          tool_settings: formData.toolSettings
        },
        scanner_tools: enabledScanners.length > 0 ? enabledScanners : undefined,
        ai_analysis_enabled: true,
        authorization_accepted: formData.authorizationAccepted === true,
        authorization_accepted_at: formData.authorizationAccepted === true ? new Date().toISOString() : undefined
      };

      // Include asset_id if an existing asset was selected
      if (formData.assetId) {
        scanData.asset_id = formData.assetId;
      }

      console.log('Creating scan with data:', scanData);

      // Submit assessment - scan starts automatically in background
      const assessmentResponse = await apiService.createScan(scanData);
      console.log('Assessment submitted:', assessmentResponse);

      // Assessment endpoint returns: {job_id, campaign_name, scan_parent_id, status}
      // The scan already starts in background, no need to call startScan

      // Show success message
      alert(`Assessment submitted successfully!\nJob ID: ${assessmentResponse.job_id}\nCampaign: ${assessmentResponse.campaign_name}\nStatus: ${assessmentResponse.status}\n\nThe scan is running in the background.`);

      // Navigate to campaign details page
      navigate(`/campaigns/${assessmentResponse.scan_parent_id}`);

    } catch (error: any) {
      console.error('Error submitting assessment:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });

      // Show error message to user
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to submit assessment';
      alert(`Error: ${errorMessage}\n\nPlease check the console for more details.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1Configuration
            formData={formData}
            onChange={handleFormDataChange}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Step2EndpointsAndSettings
            formData={formData}
            onChange={handleFormDataChange}
            onNext={handleNext}
            onBack={handleBack}
            scannerTools={scannerTools}
          />
        );
      case 3:
        return (
          <Step3Review
            formData={formData}
            onChange={handleFormDataChange}
            onBack={handleBack}
            onSubmit={handleSubmit}
            scannerTools={scannerTools}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="assessment-container">
        <div className="assessment-header">
          <h1>New Assessment</h1>
          <p>Configure and launch a comprehensive security assessment</p>
        </div>

        <div className="assessment-content">
          
          {/* Step Indicator */}
          <div className="step-indicator">
            <div className={`step-item ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Configuration</div>
            </div>
            <div className={`step-connector ${currentStep > 1 ? 'completed' : ''}`}></div>
            <div className={`step-item ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Endpoints & Tools</div>
            </div>
            <div className={`step-connector ${currentStep > 2 ? 'completed' : ''}`}></div>
            <div className={`step-item ${currentStep >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Review</div>
            </div>
          </div>

          {/* Step Content */}
          {toolsLoading ? (
            <div className="wizard-content" style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Loading scanner tools...</p>
            </div>
          ) : (
            <div className="wizard-content">
              {renderStep()}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Assessment;

