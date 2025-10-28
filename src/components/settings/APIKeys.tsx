import React from 'react';
import Layout from '../Layout';
import APIKeysSettings from './APIKeysSettings';
import './APIKeysSettings.css';

const APIKeys: React.FC = () => {
  return (
    <Layout>
      <div className="api-keys-container">
        <div className="api-keys-header">
          <h1>API Key Management</h1>
          <p>Manage API keys for AI providers and external services</p>
        </div>
        <APIKeysSettings />
      </div>
    </Layout>
  );
};

export default APIKeys;

