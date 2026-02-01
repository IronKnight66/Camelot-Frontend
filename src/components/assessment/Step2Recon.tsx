// src/components/assessment/Step2Recon.tsx
import React, { useState } from 'react';
import { AssessmentFormData, Endpoint } from '../../types/assessment';
import apiService from '../../services/api';
import './AssessmentWizard.css';

interface ConnectivityResult {
  success: boolean;
  url: string;
  status_code: number | null;
  response_time_ms: number | null;
  error: string | null;
  details: {
    ip_address?: string;
    ssl_valid?: boolean;
    redirect_url?: string;
    http_error?: string;
  };
}

interface TechFingerprintResult {
  success: boolean;
  url: string;
  technologies: {
    [category: string]: {
      name: string;
      confidence: 'low' | 'medium' | 'high';
    };
  };
  indicators: Array<{
    type: string;
    name?: string;
    value?: string;
    pattern?: string;
  }>;
  error: string | null;
  response_time_ms: number | null;
}

interface CredentialLeakResult {
  success: boolean;
  domain: string;
  total_breaches: number;
  total_credentials: number;
  breaches: Array<{
    source: string;
    title?: string;
    date: string | null;
    service: string;
    exposed_data?: string[];
    credentials_count: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description?: string;
    is_verified?: boolean;
    is_sensitive?: boolean;
  }>;
  credentials: Array<{
    email: string;
    username: string;
    password: string;
    source: string;
    breach_date: string;
    fields: string[];
  }>;
  service_results: {
    hibp: {
      success: boolean;
      breach_count?: number;
      total_breaches_in_db?: number;
      error?: string;
    };
    leakcheck?: {
      success: boolean;
      credentials_found?: number;
      source_count?: number;
      quota?: number;
      error?: string;
    };
  };
  error: string | null;
  response_time_ms: number | null;
}

interface Step2ReconProps {
  formData: AssessmentFormData;
  onChange: (data: Partial<AssessmentFormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const Step2Recon: React.FC<Step2ReconProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
}) => {
  // Initialize endpoints from formData (if previously discovered) or empty array
  const [endpoints, setEndpoints] = useState<Endpoint[]>(() => {
    return formData.endpoints && formData.endpoints.length > 0 
      ? formData.endpoints 
      : [];
  });
  const [isDiscoveringEndpoints, setIsDiscoveringEndpoints] = useState<boolean>(false);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [connectivityCheck, setConnectivityCheck] = useState<{
    status: 'idle' | 'checking' | 'success' | 'failed' | 'error';
    result: ConnectivityResult | null;
  }>({ status: 'idle', result: null });
  const [techFingerprint, setTechFingerprint] = useState<{
    status: 'idle' | 'detecting' | 'success' | 'failed' | 'error';
    result: TechFingerprintResult | null;
  }>({ status: 'idle', result: null });
  const [credentialLeak, setCredentialLeak] = useState<{
    status: 'idle' | 'checking' | 'success' | 'failed' | 'error';
    result: CredentialLeakResult | null;
  }>({ status: 'idle', result: null });
  const [showCredentials, setShowCredentials] = useState(false);

  const handleEndpointToggle = (url: string) => {
    const updatedEndpoints = endpoints.map(ep =>
      ep.url === url ? { ...ep, selected: !ep.selected } : ep
    );
    setEndpoints(updatedEndpoints);
    onChange({ endpoints: updatedEndpoints });
  };

  const handleAttackableChange = (url: string, isAttackable: boolean) => {
    const updatedEndpoints = endpoints.map(ep =>
      ep.url === url ? { ...ep, isAttackable } : ep
    );
    setEndpoints(updatedEndpoints);
    onChange({ endpoints: updatedEndpoints });
  };

  const handleConnectivityCheck = async () => {
    if (!formData.websiteUrl) {
      return;
    }
    
    setConnectivityCheck({ status: 'checking', result: null });
    
    try {
      const result = await apiService.checkConnectivity(formData.websiteUrl);
      setConnectivityCheck({
        status: result.success ? 'success' : 'failed',
        result
      });
    } catch (error: any) {
      console.error('Connectivity check error:', error);
      setConnectivityCheck({
        status: 'error',
        result: {
          success: false,
          url: formData.websiteUrl,
          status_code: null,
          response_time_ms: null,
          error: error?.response?.data?.detail || error?.message || 'Failed to check connectivity',
          details: {}
        }
      });
    }
  };

  const handleTechFingerprint = async () => {
    if (!formData.websiteUrl) {
      return;
    }
    
    setTechFingerprint({ status: 'detecting', result: null });
    
    try {
      const result = await apiService.techFingerprint(formData.websiteUrl);
      setTechFingerprint({
        status: result.success ? 'success' : 'failed',
        result
      });
    } catch (error: any) {
      console.error('Tech fingerprint error:', error);
      setTechFingerprint({
        status: 'error',
        result: {
          success: false,
          url: formData.websiteUrl,
          technologies: {},
          indicators: [],
          error: error?.response?.data?.detail || error?.message || 'Failed to detect technologies',
          response_time_ms: null
        }
      });
    }
  };

  const handleCredentialLeak = async () => {
    if (!formData.websiteUrl) {
      return;
    }
    
    // Extract domain from URL
    const domain = formData.websiteUrl
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '')
      .split(':')[0];
    
    setCredentialLeak({ status: 'checking', result: null });
    
    try {
      const result = await apiService.credentialLeak(domain);
      setCredentialLeak({
        status: result.success ? 'success' : 'failed',
        result
      });
    } catch (error: any) {
      console.error('Credential leak check error:', error);
      setCredentialLeak({
        status: 'error',
        result: {
          success: false,
          domain,
          total_breaches: 0,
          total_credentials: 0,
          breaches: [],
          credentials: [],
          service_results: {
            hibp: { success: false, error: 'Request failed' }
          },
          error: error?.response?.data?.detail || error?.message || 'Failed to check credential leaks',
          response_time_ms: null
        }
      });
    }
  };

  const handleDiscoverEndpoints = async () => {
    if (!formData.websiteUrl) {
      alert('Please enter a website URL in Step 1 first');
      return;
    }

    setIsDiscoveringEndpoints(true);
    setDiscoveryError(null);

    try {
      console.log('🔍 Discovering endpoints for:', formData.websiteUrl);

      // Extract domain from URL
      const domain = formData.websiteUrl.replace('https://', '').replace('http://', '').split('/')[0];

      // Call API to start subfinder scan
      const result = await apiService.discoverEndpoints(domain, 'network');
      console.log('Discovery scan started:', result);

      const scanId = result.job_id;
      const scanParentId = result.scan_parent_id;
      let pollCount = 0;
      const maxPolls = 90; // 3 minutes max (poll every 2 seconds)

      // Poll for scan completion
      const pollInterval = setInterval(async () => {
        try {
          pollCount++;
          console.log(`Polling scan status (${pollCount}/${maxPolls})...`);

          const status = await apiService.getScanStatus(scanId);
          console.log('Scan status:', status);

          if (status.status === 'completed') {
            clearInterval(pollInterval);

            // Wait for aggregation to complete, then fetch discovered endpoints
            console.log('📊 Scan completed. Waiting for aggregation to finish...');

            // Retry fetching aggregated findings with exponential backoff
            let aggregationRetries = 0;
            const maxAggregationRetries = 10;

            const fetchWithRetry = async () => {
              try {
                console.log(`Fetching discovered endpoints (attempt ${aggregationRetries + 1}/${maxAggregationRetries})...`);
                const endpointUrls = await apiService.getDiscoveredEndpoints(scanParentId);
                console.log('Discovered endpoint URLs:', endpointUrls);

                // Transform URLs into Endpoint format
                const discoveredEndpoints = endpointUrls.map((url: string) => ({
                  url: url,
                  selected: true,
                  isAttackable: true
                }));

                if (discoveredEndpoints.length > 0) {
                  setEndpoints(discoveredEndpoints);
                  onChange({ endpoints: discoveredEndpoints });
                  alert(`✅ Discovered ${discoveredEndpoints.length} endpoints!`);
                } else {
                  setDiscoveryError('No endpoints discovered. Try manual entry.');
                }
                setIsDiscoveringEndpoints(false);
              } catch (endpointError: any) {
                aggregationRetries++;
                console.error(`Failed to fetch discovered endpoints (attempt ${aggregationRetries}):`, endpointError);
                
                const errorStatus = endpointError?.response?.status;
                const errorDetail = endpointError?.response?.data?.detail || endpointError?.message || 'Unknown error';

                // If 404 and still have retries, wait and try again
                if (errorStatus === 404 && aggregationRetries < maxAggregationRetries) {
                  const waitTime = 2000 + (aggregationRetries * 1000); // 2s, 3s, 4s, 5s...
                  console.log(`Aggregation not ready yet. Retrying in ${waitTime}ms...`);
                  setTimeout(fetchWithRetry, waitTime);
                } else {
                  // Max retries reached or other error
                  if (errorStatus === 404) {
                    setDiscoveryError('Aggregation timeout. Findings may not be ready yet. Check Scans page later.');
                  } else if (errorStatus === 400) {
                    // Handle 400 errors (e.g., invalid campaign ID)
                    setDiscoveryError(`Configuration error: ${errorDetail}. Please try again or use manual entry.`);
                  } else {
                    // Show the actual error message from backend
                    setDiscoveryError(`Failed to retrieve discovered endpoints: ${errorDetail}. Try manual entry.`);
                  }
                  setIsDiscoveringEndpoints(false);
                }
              }
            };

            // Start fetching with initial delay to give aggregation time to start
            setTimeout(fetchWithRetry, 3000); // Wait 3 seconds before first attempt
          } else if (status.status === 'failed') {
            clearInterval(pollInterval);
            setDiscoveryError('Endpoint discovery failed. Please try again.');
            setIsDiscoveringEndpoints(false);
          } else if (pollCount >= maxPolls) {
            clearInterval(pollInterval);
            setDiscoveryError('Discovery timeout. Scan is still running - check Scans page.');
            setIsDiscoveringEndpoints(false);
          }
        } catch (pollError: any) {
          console.error('Poll error:', pollError);
        }
      }, 2000); // Poll every 2 seconds

    } catch (error: any) {
      console.error('❌ Endpoint discovery failed:', error);
      setDiscoveryError(error?.response?.data?.detail || error?.message || 'Failed to discover endpoints');
      setIsDiscoveringEndpoints(false);
    }
  };

  const handleNext = () => {
    // Update endpoints in formData
    onChange({ endpoints });
    onNext();
  };

  return (
    <div className="step-container">
      <div className="step-header">
        <h2>Reconnaissance</h2>
        <p>Verify connectivity, detect technologies, and discover endpoints.</p>
      </div>

      {/* Scanner Connectivity Check Section */}
      {formData.websiteUrl && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Scanner Connectivity</h3>
            <button
              type="button"
              onClick={handleConnectivityCheck}
              disabled={connectivityCheck.status === 'checking'}
              className={`btn-connectivity ${connectivityCheck.status}`}
            >
              {connectivityCheck.status === 'checking' ? (
                <>Checking...</>
              ) : connectivityCheck.status === 'success' ? (
                <>&#10003; Reachable</>
              ) : connectivityCheck.status === 'failed' ? (
                <>&#10007; Not Reachable</>
              ) : (
                <>Check Connectivity</>
              )}
            </button>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
            Verify the target URL ({formData.websiteUrl}) is reachable from the scanner network before running your assessment.
          </p>
          
          {connectivityCheck.result && (
            <div className={`connectivity-result ${connectivityCheck.status}`}>
              {connectivityCheck.result.success ? (
                <div className="connectivity-success">
                  <span className="connectivity-icon">&#10003;</span>
                  <div className="connectivity-details">
                    <strong>Target is reachable from scanner network</strong>
                    <ul>
                      {connectivityCheck.result.status_code && (
                        <li>HTTP Status: {connectivityCheck.result.status_code}</li>
                      )}
                      {connectivityCheck.result.response_time_ms && (
                        <li>Response Time: {connectivityCheck.result.response_time_ms}ms</li>
                      )}
                      {connectivityCheck.result.details.ip_address && (
                        <li>IP Address: {connectivityCheck.result.details.ip_address}</li>
                      )}
                      {connectivityCheck.result.details.ssl_valid !== undefined && (
                        <li>SSL Valid: {connectivityCheck.result.details.ssl_valid ? 'Yes' : 'No'}</li>
                      )}
                      {connectivityCheck.result.details.redirect_url && (
                        <li>Redirects to: {connectivityCheck.result.details.redirect_url}</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="connectivity-failure">
                  <span className="connectivity-icon">&#10007;</span>
                  <div className="connectivity-details">
                    <strong>Target is not reachable from scanner network</strong>
                    {connectivityCheck.result.error && (
                      <p className="connectivity-error">{connectivityCheck.result.error}</p>
                    )}
                    <p className="connectivity-warning">
                      The scan may fail if the target cannot be reached. Please verify the URL and try again.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Technology Detection Section */}
      {formData.websiteUrl && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Technology Detection</h3>
            <button
              type="button"
              onClick={handleTechFingerprint}
              disabled={techFingerprint.status === 'detecting'}
              className={`btn-tech-detect ${techFingerprint.status}`}
            >
              {techFingerprint.status === 'detecting' ? (
                <>Detecting...</>
              ) : techFingerprint.status === 'success' ? (
                <>&#10003; Detected</>
              ) : techFingerprint.status === 'failed' || techFingerprint.status === 'error' ? (
                <>&#10007; Failed</>
              ) : (
                <>Detect Technologies</>
              )}
            </button>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
            Identify the technology stack (CMS, frameworks, server) of the target website using passive fingerprinting.
          </p>
          
          {techFingerprint.result && (
            <div className={`tech-fingerprint-result ${techFingerprint.status}`}>
              {techFingerprint.result.success && Object.keys(techFingerprint.result.technologies).length > 0 ? (
                <div className="tech-fingerprint-success">
                  <div className="tech-stack-grid">
                    {Object.entries(techFingerprint.result.technologies).map(([category, tech]) => (
                      <div key={category} className="tech-badge-container">
                        <span className="tech-category">{category}</span>
                        <span className={`tech-badge confidence-${tech.confidence}`}>
                          {tech.name}
                          <span className="confidence-indicator" title={`Confidence: ${tech.confidence}`}>
                            {tech.confidence === 'high' ? '●●●' : tech.confidence === 'medium' ? '●●○' : '●○○'}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                  {techFingerprint.result.response_time_ms && (
                    <p className="tech-response-time">
                      Detection completed in {techFingerprint.result.response_time_ms}ms
                    </p>
                  )}
                </div>
              ) : techFingerprint.result.success && Object.keys(techFingerprint.result.technologies).length === 0 ? (
                <div className="tech-fingerprint-empty">
                  <span className="tech-icon">&#128269;</span>
                  <div className="tech-details">
                    <strong>No technologies detected</strong>
                    <p>The target website may be using uncommon technologies or hiding its stack.</p>
                  </div>
                </div>
              ) : (
                <div className="tech-fingerprint-failure">
                  <span className="tech-icon">&#10007;</span>
                  <div className="tech-details">
                    <strong>Technology detection failed</strong>
                    {techFingerprint.result.error && (
                      <p className="tech-error">{techFingerprint.result.error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Credential Leak Section */}
      {formData.websiteUrl && (
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>Credential Leak Detection</h3>
            <button
              type="button"
              onClick={handleCredentialLeak}
              disabled={credentialLeak.status === 'checking'}
              className={`btn-credential-check ${credentialLeak.status}`}
            >
              {credentialLeak.status === 'checking' ? (
                <>Checking...</>
              ) : credentialLeak.status === 'success' ? (
                <>&#10003; Checked</>
              ) : credentialLeak.status === 'failed' || credentialLeak.status === 'error' ? (
                <>&#10007; Failed</>
              ) : (
                <>Check Credential Leaks</>
              )}
            </button>
          </div>
          
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 16px 0' }}>
            Search for leaked credentials specifically associated with this domain in breach databases.
          </p>
          
          {credentialLeak.result && (
            <div className={`credential-leak-result ${credentialLeak.status}`}>
              {credentialLeak.result.success && credentialLeak.result.total_credentials > 0 ? (
                <div className="credential-leak-found">
                  <div className="leak-summary">
                    <div className="leak-stat critical">
                      <span className="leak-icon">&#9888;</span>
                      <div>
                        <strong>{credentialLeak.result.total_breaches}</strong>
                        <span>Breach Sources</span>
                      </div>
                    </div>
                    <div 
                      className="leak-stat clickable"
                      onClick={() => setShowCredentials(!showCredentials)}
                      style={{ cursor: 'pointer' }}
                      title="Click to view leaked credentials"
                    >
                      <span className="leak-icon">&#128273;</span>
                      <div>
                        <strong>{credentialLeak.result.total_credentials}</strong>
                        <span>Credentials Exposed {showCredentials ? '▼' : '▶'}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Leaked Credentials Table */}
                  {showCredentials && credentialLeak.result.credentials && credentialLeak.result.credentials.length > 0 && (
                    <div className="credentials-table-container">
                      <h4 style={{ color: '#f87171', marginBottom: '12px' }}>Leaked Credentials</h4>
                      <div className="credentials-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Email</th>
                              <th>Username</th>
                              <th>Password</th>
                              <th>Source</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {credentialLeak.result.credentials.slice(0, 20).map((cred, idx) => (
                              <tr key={idx}>
                                <td className="cred-email">{cred.email || '-'}</td>
                                <td className="cred-username">{cred.username || '-'}</td>
                                <td className="cred-password">{cred.password || '-'}</td>
                                <td className="cred-source">{cred.source}</td>
                                <td className="cred-date">{cred.breach_date || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {credentialLeak.result.credentials.length > 20 && (
                          <p className="credentials-more">
                            Showing 20 of {credentialLeak.result.credentials.length} credentials
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Breach Sources */}
                  <div className="breach-list">
                    <h4 style={{ color: '#94a3b8', marginBottom: '12px', marginTop: '16px' }}>Breach Sources</h4>
                    {credentialLeak.result.breaches.slice(0, 5).map((breach, idx) => (
                      <div key={idx} className={`breach-item severity-${breach.severity}`}>
                        <div className="breach-header">
                          <strong>{breach.title || breach.source}</strong>
                          <span className={`severity-badge ${breach.severity}`}>
                            {breach.credentials_count} credentials
                          </span>
                        </div>
                        {breach.date && (
                          <div className="breach-details">
                            <span className="breach-date">Breach date: {breach.date}</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {credentialLeak.result.breaches.length > 5 && (
                      <div className="breach-more">
                        +{credentialLeak.result.breaches.length - 5} more sources
                      </div>
                    )}
                  </div>
                  
                  {credentialLeak.result.response_time_ms && (
                    <p className="leak-response-time">
                      Checked in {credentialLeak.result.response_time_ms}ms
                    </p>
                  )}
                </div>
              ) : credentialLeak.result.success && credentialLeak.result.total_credentials === 0 ? (
                <div className="credential-leak-clean">
                  <span className="leak-icon">&#10003;</span>
                  <div className="leak-details">
                    <strong>No credential leaks found</strong>
                    <p>This domain was not found in any breach databases.</p>
                  </div>
                </div>
              ) : (
                <div className="credential-leak-error">
                  <span className="leak-icon">&#10007;</span>
                  <div className="leak-details">
                    <strong>Credential leak check failed</strong>
                    {credentialLeak.result.error && (
                      <p className="leak-error">{credentialLeak.result.error}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Endpoints Section */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Select Endpoints</h3>
          <button
            type="button"
            onClick={handleDiscoverEndpoints}
            disabled={isDiscoveringEndpoints || !formData.websiteUrl}
            className="btn-secondary"
            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
          >
            {isDiscoveringEndpoints ? '🔍 Discovering...' : '🔍 Discover Endpoints'}
          </button>
        </div>

        {discoveryError && (
          <div style={{ padding: '0.75rem', backgroundColor: '#fee', color: '#c00', borderRadius: '4px', marginBottom: '1rem' }}>
            ⚠️ {discoveryError}
          </div>
        )}

        {isDiscoveringEndpoints && (
          <div style={{ padding: '0.75rem', backgroundColor: '#e3f2fd', color: '#1976d2', borderRadius: '4px', marginBottom: '1rem' }}>
            🔍 Running subfinder scan... This may take 30-60 seconds.
          </div>
        )}

        {endpoints.length > 0 ? (
          <div className="endpoints-list">
            {endpoints.map((endpoint) => (
              <div key={endpoint.url} className="endpoint-item">
                <div className="endpoint-row">
                  <label className="endpoint-checkbox">
                    <input
                      type="checkbox"
                      checked={endpoint.selected || false}
                      onChange={() => handleEndpointToggle(endpoint.url)}
                    />
                    <span className="endpoint-url">{endpoint.url}</span>
                  </label>
                  <div className="endpoint-attackable-select">
                    <select
                      id={`attackable-${endpoint.url}`}
                      value={endpoint.isAttackable ? 'true' : 'false'}
                      onChange={(e) =>
                        handleAttackableChange(endpoint.url, e.target.value === 'true')
                      }
                      className="attackable-dropdown"
                    >
                      <option value="true">Attackable</option>
                      <option value="false">Not Attackable</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
            No endpoints discovered yet. Click "Discover Endpoints" to find endpoints automatically, or continue to configure scanner settings.
          </div>
        )}
      </div>

      <div className="step-actions">
        <button type="button" onClick={onBack} className="btn-secondary">
          ← Back
        </button>
        <button type="button" onClick={handleNext} className="btn-primary">
          Next →
        </button>
      </div>
    </div>
  );
};

export default Step2Recon;
