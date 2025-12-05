/*
================================================================================
COMMENTED OUT - Bedrock uses IAM, no API keys needed. Kept for reference.
Date: December 2024

This wrapper component has been deprecated because the chatbot now uses Amazon
Bedrock, which authenticates via IAM roles rather than API keys.

See APIKeysSettings.tsx for the main component that has also been commented out.
================================================================================
*/

/*
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
*/

// COMMENTED OUT - END OF FILE
// ================================================================================

// Empty export to satisfy TypeScript --isolatedModules
export {};
