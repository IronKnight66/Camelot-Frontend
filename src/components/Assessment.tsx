import React, { useState } from 'react';
import Layout from './Layout';
import Step1Configuration from './assessment/Step1Configuration';
import Step2EndpointsAndSettings from './assessment/Step2EndpointsAndSettings';
import Step3Review from './assessment/Step3Review';
import { AssessmentFormData } from '../types/assessment';
import './Assessment.css';
import './assessment/AssessmentWizard.css';

const Assessment: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
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

  const handleSubmit = () => {
    // Placeholder for future API integration
    console.log('Assessment submitted:', formData);
    alert('Assessment submitted successfully! (This is a placeholder)');
    // In the future, this will call an API endpoint to create the assessment
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

