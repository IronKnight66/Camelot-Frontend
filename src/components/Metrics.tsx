import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import './Metrics.css';

const Metrics: React.FC = () => {
  return (
    <Layout>
      <div className="metrics-container">
        <div className="metrics-content">
          <h1>Metrics & Dashboards</h1>
          <p className="metrics-subtitle">
            This page is coming soon. You'll be able to view comprehensive metrics, dashboards, and findings overview here.
          </p>
          
          <div className="metrics-placeholder">
            <div className="placeholder-icon">📊</div>
            <h2>Analytics Dashboard</h2>
            <p>
              The metrics dashboard will provide:
            </p>
            <ul>
              <li>Real-time security metrics and KPIs</li>
              <li>Findings overview with severity breakdown</li>
              <li>Scan execution statistics</li>
              <li>Trend analysis and historical data</li>
              <li>Customizable dashboard widgets</li>
            </ul>
          </div>

          <div className="metrics-actions">
            <Link to="/" className="back-link">
              ← Back to Dashboard
            </Link>
            <Link to="/findings" className="findings-link">
              View Findings →
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Metrics;

