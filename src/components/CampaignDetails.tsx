import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import api from '../services/api';
import './CampaignDetails.css';

interface CampaignStatistics {
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  running_scans: number;
  pending_scans: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
}

interface Scan {
  id: number;
  name: string;
  scan_type: string;
  status: string;
  target_url: string | null;
  target_ip: string | null;
  target_domain: string | null;
  findings_count: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  error_message: string | null;
}

interface CampaignDetails {
  id: number;
  name: string;
  description: string | null;
  target_url: string | null;
  target_ip: string | null;
  target_domain: string | null;
  status: string;
  initiated_by: string | null;
  created_at: string;
  updated_at: string;
  workflow_metadata: any;
  session_id: string | null;
  authorization_accepted: boolean | null;
  authorization_accepted_at: string | null;
  scans: Scan[];
  statistics: CampaignStatistics;
}

interface ChatMessage {
  role: string;
  content: string;
  timestamp: string;
}

interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
  message_count: number;
  created_at: string;
  last_message_at: string | null;
}

const CampaignDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<CampaignDetails | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatError, setChatError] = useState<string | null>(null);
  const [showChatHistory, setShowChatHistory] = useState(true);
  const [confirmStopScan, setConfirmStopScan] = useState<number | null>(null);
  const [stoppingScans, setStoppingScans] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadCampaignDetails();
  }, [id]);

  const loadCampaignDetails = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.getCampaignDetails(parseInt(id));
      setCampaign(data);
      
      // Load chat history if session_id exists
      if (data.session_id) {
        loadChatHistory(data.session_id);
      }
    } catch (err: any) {
      console.error('Error loading campaign details:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load campaign details');
    } finally {
      setLoading(false);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    setChatLoading(true);
    setChatError(null);
    
    try {
      const data = await api.getChatSession(sessionId);
      setChatHistory(data);
    } catch (err: any) {
      console.error('Error loading chat history:', err);
      setChatError('Chat history not available');
    } finally {
      setChatLoading(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusClass = `status-badge status-${status.toLowerCase()}`;
    return (
      <span className={statusClass}>
        {status.toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatDuration = (startedAt: string | null, completedAt: string | null) => {
    if (!startedAt || !completedAt) return '—';
    const start = new Date(startedAt).getTime();
    const end = new Date(completedAt).getTime();
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleDownloadScan = async (scan: Scan) => {
    try {
      const response = await api.downloadScanResults(scan.id);
      const blob = new Blob([response], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan_${scan.id}_${scan.name}_results.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Error downloading scan:', err);
      alert('Failed to download scan results');
    }
  };

  const handleStopScan = async (scanId: number) => {
    // Add to stopping set
    setStoppingScans(prev => new Set(prev).add(scanId));
    setConfirmStopScan(null);

    try {
      await api.cancelScan(scanId.toString());
      alert('Scan stopped successfully');
      // Reload campaign details to show updated status
      loadCampaignDetails();
    } catch (err: any) {
      console.error('Error stopping scan:', err);
      alert(err.response?.data?.detail || err.message || 'Failed to stop scan');
    } finally {
      // Remove from stopping set
      setStoppingScans(prev => {
        const newSet = new Set(prev);
        newSet.delete(scanId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="campaign-details-container">
          <div className="loading-state">Loading campaign details...</div>
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="campaign-details-container">
          <div className="error-state">
            <h2>Error</h2>
            <p>{error || 'Campaign not found'}</p>
            <button onClick={() => navigate('/scans')} className="btn-back">
              Back to Scans
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="campaign-details-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/scans">Scans</Link>
          <span className="separator">›</span>
          <span>Campaign Details</span>
        </div>

        {/* Campaign Overview Section */}
        <div className="campaign-overview-section">
          <div className="section-header">
            <h1>{campaign.name}</h1>
            {renderStatusBadge(campaign.status)}
          </div>
          
          {campaign.description && (
            <p className="campaign-description">{campaign.description}</p>
          )}

          <div className="campaign-info-grid">
            <div className="info-item">
              <label>Target</label>
              <div className="target-info">
                {campaign.target_url && <div className="target-url">{campaign.target_url}</div>}
                {campaign.target_ip && <div className="target-ip">{campaign.target_ip}</div>}
                {campaign.target_domain && <div className="target-domain">{campaign.target_domain}</div>}
                {!campaign.target_url && !campaign.target_ip && !campaign.target_domain && <span>—</span>}
              </div>
            </div>

            <div className="info-item">
              <label>Initiated By</label>
              <div>{campaign.initiated_by || '—'}</div>
            </div>

            <div className="info-item">
              <label>Created</label>
              <div>{formatDate(campaign.created_at)}</div>
            </div>

            <div className="info-item">
              <label>Last Updated</label>
              <div>{formatDate(campaign.updated_at)}</div>
            </div>

            <div className="info-item">
              <label>Progress</label>
              <div className="progress-info">
                {campaign.statistics.completed_scans} / {campaign.statistics.total_scans} scans completed
              </div>
            </div>

            <div className="info-item">
              <label>Total Findings</label>
              <div className="findings-summary">
                <span className="findings-total">{campaign.statistics.total_findings}</span>
                {campaign.statistics.total_findings > 0 && (
                  <span className="findings-breakdown">
                    ({campaign.statistics.critical_findings}C / {campaign.statistics.high_findings}H / 
                    {campaign.statistics.medium_findings}M / {campaign.statistics.low_findings}L)
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat History Section */}
        {campaign.session_id && (
          <div className="chat-history-section">
            <div className="section-header" onClick={() => setShowChatHistory(!showChatHistory)}>
              <h2>Chat History</h2>
              <button className="toggle-button">
                {showChatHistory ? '▼' : '▶'}
              </button>
            </div>

            {showChatHistory && (
              <div className="chat-history-content">
                {chatLoading && <div className="loading-state">Loading chat history...</div>}
                
                {chatError && (
                  <div className="empty-state">
                    <p>{chatError}</p>
                  </div>
                )}

                {!chatLoading && !chatError && chatHistory && chatHistory.messages.length > 0 && (
                  <div className="chat-messages">
                    {chatHistory.messages.map((message, index) => (
                      <div key={index} className={`chat-message ${message.role}`}>
                        <div className="message-header">
                          <span className="message-role">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="message-timestamp">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <div className="message-content">
                          {message.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!chatLoading && !chatError && (!chatHistory || chatHistory.messages.length === 0) && (
                  <div className="empty-state">
                    <p>No chat history available for this campaign.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Scan Execution Log Section */}
        <div className="scan-execution-section">
          <div className="section-header">
            <h2>Scan Execution Log</h2>
            <span className="scan-count">{campaign.scans.length} scan{campaign.scans.length !== 1 ? 's' : ''}</span>
          </div>

          {campaign.scans.length === 0 ? (
            <div className="empty-state">
              <p>No scans have been executed for this campaign yet.</p>
            </div>
          ) : (
            <div className="scans-table-container">
              <table className="scans-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Findings</th>
                    <th>Started</th>
                    <th>Completed</th>
                    <th>Duration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaign.scans.map((scan) => (
                    <React.Fragment key={scan.id}>
                      <tr>
                        <td>#{scan.id}</td>
                        <td className="scan-name">{scan.name}</td>
                        <td>{scan.scan_type}</td>
                        <td>{renderStatusBadge(scan.status)}</td>
                        <td>
                          {scan.findings_count > 0 ? (
                            <Link 
                              to={`/findings?scan_id=${scan.id}`}
                              className="findings-link"
                            >
                              <span className="findings-total">{scan.findings_count}</span>
                              <span className="findings-breakdown">
                                ({scan.critical_findings}C / {scan.high_findings}H / 
                                {scan.medium_findings}M / {scan.low_findings}L)
                              </span>
                            </Link>
                          ) : (
                            <span className="no-findings">0</span>
                          )}
                        </td>
                        <td>{formatDate(scan.started_at)}</td>
                        <td>{formatDate(scan.completed_at)}</td>
                        <td>{formatDuration(scan.started_at, scan.completed_at)}</td>
                        <td>
                          <div className="action-buttons">
                            {(scan.status === 'pending' || scan.status === 'running') && (
                              <button
                                onClick={() => setConfirmStopScan(scan.id)}
                                className="btn-action btn-stop"
                                disabled={stoppingScans.has(scan.id)}
                                title="Stop Scan"
                              >
                                {stoppingScans.has(scan.id) ? 'Stopping...' : 'Stop'}
                              </button>
                            )}
                            {scan.findings_count > 0 && (
                              <Link 
                                to={`/findings?scan_id=${scan.id}`}
                                className="btn-action btn-findings"
                                title="View Findings"
                              >
                                View Findings
                              </Link>
                            )}
                            {scan.status === 'completed' && (
                              <button
                                onClick={() => handleDownloadScan(scan)}
                                className="btn-action btn-download"
                                title="Download Results"
                              >
                                Download
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {scan.error_message && (
                        <tr className="error-row">
                          <td colSpan={9}>
                            <div className="error-message">
                              <strong>Error:</strong> {scan.error_message}
                            </div>
                          </td>
                        </tr>
                      )}
                      {scan.status === 'completed' && !scan.error_message && (
                        <tr className="success-row">
                          <td colSpan={9}>
                            <div className="success-message">
                              Scan completed successfully
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="actions-footer">
          <button onClick={() => navigate('/scans')} className="btn-back">
            ← Back to Scans
          </button>
        </div>

        {/* Stop Scan Confirmation Modal */}
        {confirmStopScan && (
          <div className="modal-overlay" onClick={() => setConfirmStopScan(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>Stop Scan?</h3>
              <p>Are you sure you want to stop this scan? This will terminate the running scanner tasks.</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="modal-actions">
                <button onClick={() => setConfirmStopScan(null)} className="btn-cancel">
                  Cancel
                </button>
                <button onClick={() => handleStopScan(confirmStopScan)} className="btn-danger">
                  Stop Scan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CampaignDetails;
