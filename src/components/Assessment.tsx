import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import './Assessment.css';

const Assessment: React.FC = () => {
  return (
    <Layout>
      <div className="assessment-container">
        <div className="assessment-content">
          <h1>New Assessment</h1>
          <p className="assessment-subtitle">
            This page is coming soon. You'll be able to create and configure new security assessments here.
          </p>
          
          <div className="assessment-placeholder">
            <div className="placeholder-icon">🔒</div>
            <h2>Assessment Creation</h2>
            <p>
              The assessment creation interface will allow you to:
            </p>
            <ul>
              <li>Configure scan targets and parameters</li>
              <li>Select scanner tools for your assessment</li>
              <li>Schedule recurring assessments</li>
              <li>Set up automated reporting</li>
            </ul>
          </div>

          <div className="assessment-actions">
            <Link to="/" className="back-link">
              ← Back to Dashboard
            </Link>
            <Link to="/scanners" className="scanners-link">
              View Scanner Tools →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Assessment;

