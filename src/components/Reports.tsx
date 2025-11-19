import React, { useState, useEffect } from 'react';
import Layout from './Layout';
import api from '../services/api';
import './Reports.css';

interface ChatLog {
  id: number;
  session_id: string;
  user_id: string;
  provider: string;
  model_name: string | null;
  status: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  user_message: string;
  assistant_message: string | null;
  action_triggered: string | null;
  created_at: string;
}

interface ChatLogsSummary {
  total_logs: number;
  logs_by_status: { [key: string]: number };
  logs_by_provider: { [key: string]: number };
  recent_logs_30_days: number;
  total_tokens_30_days: number;
  total_cost_30_days: number;
  most_used_provider_model: string | null;
}

interface CostSummary {
  total_cost: number;
  total_tokens: number;
  by_provider: { [key: string]: { cost: number; tokens: number; count: number } };
  by_model: { [key: string]: { cost: number; tokens: number; count: number } };
}

const Reports: React.FC = () => {
  const [logs, setLogs] = useState<ChatLog[]>([]);
  const [summary, setSummary] = useState<ChatLogsSummary | null>(null);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState({
    provider: '',
    status: '',
    startDate: '',
    endDate: '',
    limit: 100
  });
  
  const [activeTab, setActiveTab] = useState<'logs' | 'summary' | 'costs'>('logs');
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, filters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'logs') {
        const filtersObj: any = {};
        if (filters.provider) filtersObj.provider = filters.provider;
        if (filters.status) filtersObj.status = filters.status;
        if (filters.startDate) filtersObj.start_date = filters.startDate;
        if (filters.endDate) filtersObj.end_date = filters.endDate;
        if (filters.limit) filtersObj.limit = filters.limit;
        
        const response = await api.getChatLogs(filtersObj);
        setLogs(response.logs || []);
      } else if (activeTab === 'summary') {
        const summaryData = await api.getChatLogsSummary();
        setSummary(summaryData);
      } else if (activeTab === 'costs') {
        const costs = await api.getChatLogsCosts(filters.startDate || undefined, filters.endDate || undefined);
        setCostSummary(costs);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      provider: '',
      status: '',
      startDate: '',
      endDate: '',
      limit: 100
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return 'N/A';
    return `$${cost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number | null) => {
    if (tokens === null) return 'N/A';
    return tokens.toLocaleString();
  };

  const formatLatency = (latency: number | null) => {
    if (latency === null) return 'N/A';
    return `${latency.toFixed(0)}ms`;
  };

  return (
    <Layout>
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p className="reports-subtitle">View chat logs, usage statistics, and cost breakdowns</p>
        </div>

        <div className="reports-tabs">
          <button
            className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            Chat Logs
          </button>
          <button
            className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
          <button
            className={`tab-button ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            Cost Analysis
          </button>
        </div>

        {activeTab === 'logs' && (
          <div className="reports-content">
            <div className="filters-section">
              <h3>Filters</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Provider</label>
                  <select
                    value={filters.provider}
                    onChange={(e) => handleFilterChange('provider', e.target.value)}
                  >
                    <option value="">All Providers</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="bedrock">Bedrock</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="timeout">Timeout</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>Limit</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={filters.limit}
                    onChange={(e) => handleFilterChange('limit', parseInt(e.target.value) || 100)}
                  />
                </div>
                <div className="filter-group">
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading logs...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : (
              <div className="logs-table-container">
                <table className="logs-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Provider</th>
                      <th>Model</th>
                      <th>Status</th>
                      <th>Tokens</th>
                      <th>Cost</th>
                      <th>Latency</th>
                      <th>User Message</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="no-data">No logs found</td>
                      </tr>
                    ) : (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td>{formatDate(log.created_at)}</td>
                          <td>{log.provider}</td>
                          <td>{log.model_name || 'N/A'}</td>
                          <td>
                            <span className={`status-badge status-${log.status}`}>
                              {log.status}
                            </span>
                          </td>
                          <td>{formatTokens(log.total_tokens)}</td>
                          <td>{formatCost(log.cost_usd)}</td>
                          <td>{formatLatency(log.latency_ms)}</td>
                          <td className="message-cell">
                            {log.user_message.length > 50
                              ? `${log.user_message.substring(0, 50)}...`
                              : log.user_message}
                          </td>
                          <td>
                            <button
                              className="view-details-btn"
                              onClick={() => setSelectedLog(log)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'summary' && (
          <div className="reports-content">
            {loading ? (
              <div className="loading">Loading summary...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : summary ? (
              <div className="summary-grid">
                <div className="summary-card">
                  <h3>Total Logs</h3>
                  <p className="summary-value">{summary.total_logs.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Recent (30 days)</h3>
                  <p className="summary-value">{summary.recent_logs_30_days.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Tokens (30 days)</h3>
                  <p className="summary-value">{summary.total_tokens_30_days.toLocaleString()}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Cost (30 days)</h3>
                  <p className="summary-value">${summary.total_cost_30_days.toFixed(4)}</p>
                </div>
                <div className="summary-card">
                  <h3>Most Used Model</h3>
                  <p className="summary-value">{summary.most_used_provider_model || 'N/A'}</p>
                </div>
                <div className="summary-card">
                  <h3>Logs by Status</h3>
                  <div className="status-breakdown">
                    {Object.entries(summary.logs_by_status).map(([status, count]) => (
                      <div key={status} className="status-item">
                        <span className="status-label">{status}:</span>
                        <span className="status-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="summary-card">
                  <h3>Logs by Provider</h3>
                  <div className="provider-breakdown">
                    {Object.entries(summary.logs_by_provider).map(([provider, count]) => (
                      <div key={provider} className="provider-item">
                        <span className="provider-label">{provider}:</span>
                        <span className="provider-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data">No summary data available</div>
            )}
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="reports-content">
            <div className="filters-section">
              <h3>Date Range</h3>
              <div className="filters-grid">
                <div className="filter-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="loading">Loading cost data...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : costSummary ? (
              <div className="cost-summary">
                <div className="cost-overview">
                  <div className="cost-card">
                    <h3>Total Cost</h3>
                    <p className="cost-value">${costSummary.total_cost.toFixed(4)}</p>
                  </div>
                  <div className="cost-card">
                    <h3>Total Tokens</h3>
                    <p className="cost-value">{costSummary.total_tokens.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="cost-breakdown">
                  <div className="breakdown-section">
                    <h3>By Provider</h3>
                    <table className="breakdown-table">
                      <thead>
                        <tr>
                          <th>Provider</th>
                          <th>Cost</th>
                          <th>Tokens</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(costSummary.by_provider).map(([provider, data]) => (
                          <tr key={provider}>
                            <td>{provider}</td>
                            <td>${data.cost.toFixed(4)}</td>
                            <td>{data.tokens.toLocaleString()}</td>
                            <td>{data.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="breakdown-section">
                    <h3>By Model</h3>
                    <table className="breakdown-table">
                      <thead>
                        <tr>
                          <th>Model</th>
                          <th>Cost</th>
                          <th>Tokens</th>
                          <th>Count</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(costSummary.by_model).map(([model, data]) => (
                          <tr key={model}>
                            <td>{model}</td>
                            <td>${data.cost.toFixed(4)}</td>
                            <td>{data.tokens.toLocaleString()}</td>
                            <td>{data.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-data">No cost data available</div>
            )}
          </div>
        )}

        {selectedLog && (
          <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Log Details</h2>
                <button className="modal-close" onClick={() => setSelectedLog(null)}>×</button>
              </div>
              <div className="modal-body">
                <div className="log-details">
                  <div className="detail-row">
                    <strong>ID:</strong> {selectedLog.id}
                  </div>
                  <div className="detail-row">
                    <strong>Session ID:</strong> {selectedLog.session_id}
                  </div>
                  <div className="detail-row">
                    <strong>User ID:</strong> {selectedLog.user_id}
                  </div>
                  <div className="detail-row">
                    <strong>Provider:</strong> {selectedLog.provider}
                  </div>
                  <div className="detail-row">
                    <strong>Model:</strong> {selectedLog.model_name || 'N/A'}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> 
                    <span className={`status-badge status-${selectedLog.status}`}>
                      {selectedLog.status}
                    </span>
                  </div>
                  <div className="detail-row">
                    <strong>Tokens:</strong> {formatTokens(selectedLog.total_tokens)} 
                    (Input: {formatTokens(selectedLog.input_tokens)}, Output: {formatTokens(selectedLog.output_tokens)})
                  </div>
                  <div className="detail-row">
                    <strong>Cost:</strong> {formatCost(selectedLog.cost_usd)}
                  </div>
                  <div className="detail-row">
                    <strong>Latency:</strong> {formatLatency(selectedLog.latency_ms)}
                  </div>
                  <div className="detail-row">
                    <strong>Created:</strong> {formatDate(selectedLog.created_at)}
                  </div>
                  {selectedLog.action_triggered && (
                    <div className="detail-row">
                      <strong>Action Triggered:</strong> {selectedLog.action_triggered}
                    </div>
                  )}
                  <div className="detail-row full-width">
                    <strong>User Message:</strong>
                    <div className="message-box">{selectedLog.user_message}</div>
                  </div>
                  {selectedLog.assistant_message && (
                    <div className="detail-row full-width">
                      <strong>Assistant Message:</strong>
                      <div className="message-box">{selectedLog.assistant_message}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

