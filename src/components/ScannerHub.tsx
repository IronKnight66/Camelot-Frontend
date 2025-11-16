import React from 'react';
import { Link } from 'react-router-dom';
import Layout from './Layout';
import './ScannerHub.css';

const ScannerHub: React.FC = () => {
  return (
    <Layout>
      <div className="scanner-hub-container">
        <div className="scanner-hub-header">
          <h1>Scanner Management Hub</h1>
          <p>Choose a scanner management area based on your role and permissions</p>
        </div>

        <div className="scanner-hub-grid">
          {/* My Scanners - Available to all authenticated users */}
          <div className="scanner-hub-card">
            <div className="scanner-hub-card-icon">🔧</div>
            <h2>My Scanners</h2>
            <p>View and manage your personal scanner preferences and activated tools</p>
            <Link to="/my-scanners" className="scanner-hub-btn">
              Open My Scanners
            </Link>
          </div>
        </div>

        {/* Info box */}
        <div className="scanner-hub-info">
          <h3>About Scanner Management</h3>
          <div className="scanner-hub-info-content">
            <div className="info-item">
              <strong>My Scanners:</strong> Personal scanner preferences where you activate tools available to your tenant.
            </div>
            <div className="info-item">
              <strong>Settings:</strong> Access global scanner registry, super-admin settings, and tenant scanner tools from the Settings page.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ScannerHub;

