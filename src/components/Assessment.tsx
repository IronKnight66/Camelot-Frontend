import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import Step1Configuration from './assessment/Step1Configuration';
import Step2EndpointsAndSettings from './assessment/Step2EndpointsAndSettings';
import Step3Review from './assessment/Step3Review';
import { AssessmentFormData } from '../types/assessment';
import apiService from '../services/api';
import './Assessment.css';
import './assessment/AssessmentWizard.css';

const Assessment: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formData, setFormData] = useState<AssessmentFormData>({
    websiteUrl: '',
    testType: '',
    endpoints: [],
    toolSettings: {},
    globalToolSettings: {},
  });

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

      // Extract selected endpoints
      const selectedEndpoints = formData.endpoints
        .filter(ep => ep.selected)
        .map(ep => ep.url);

      // Prepare scan data for backend API
      const scanData = {
        name: `${formData.testType} - ${formData.websiteUrl}`,
        description: `Assessment for ${formData.websiteUrl}`,
        scan_type: formData.testType,
        target_url: formData.websiteUrl,
        scan_config: {
          endpoints: selectedEndpoints,
          global_settings: formData.globalToolSettings,
          tool_settings: formData.toolSettings
        },
        scanner_tools: enabledScanners.length > 0 ? enabledScanners : undefined,
        ai_analysis_enabled: true
      };

      console.log('Creating scan with data:', scanData);

      // Step 1: Create the scan
      const createdScan = await apiService.createScan(scanData);
      console.log('Scan created:', createdScan);

      // Step 2: Start the scan immediately
      const startedScan = await apiService.startScan(createdScan.id);
      console.log('Scan started:', startedScan);

      // Show success message
      alert(`Assessment submitted successfully!\nScan ID: ${createdScan.id}\nStatus: ${startedScan.status}`);

      // Navigate to scans page or scan detail page
      navigate(`/scans`);

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
          />
        );
      case 3:
        return (
          <Step3Review
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
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
          <div className="wizard-content">
            {renderStep()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Assessment;

