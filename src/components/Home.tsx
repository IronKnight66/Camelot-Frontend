// src/components/Home.tsx
import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import Layout from './Layout';
import './Home.css';

interface Scan {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

interface Finding {
  id: string;
  title: string;
  severity: string;
  status: string;
  createdAt: string;
}

const Home: React.FC = () => {
  const [scans, setScans] = useState<Scan[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load scans and findings in parallel
      const [scansData, findingsData] = await Promise.all([
        apiService.getScans().catch(() => ({ scans: [] })),
        apiService.getFindings().catch(() => ({ findings: [] }))
      ]);

      // Extract arrays from response objects
      setScans(scansData?.scans || scansData || []);
      setFindings(findingsData?.findings || findingsData || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };


  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#dc3545';
      case 'high':
        return '#fd7e14';
      case 'medium':
        return '#ffc107';
      case 'low':
        return '#28a745';
      default:
        return '#6c757d';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return '#28a745';
      case 'running':
        return '#007bff';
      case 'failed':
        return '#dc3545';
      case 'pending':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="home-container">
      <main className="main-content">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadDashboardData}>Retry</button>
          </div>
        )}

        <div className="dashboard-grid">
          {/* Overview Cards */}
          <div className="overview-cards">
            <div className="card">
              <h3>Total Scans</h3>
              <div className="card-value">{scans.length}</div>
            </div>
            <div className="card">
              <h3>Total Findings</h3>
              <div className="card-value">{findings.length}</div>
            </div>
            <div className="card">
              <h3>Critical Findings</h3>
              <div className="card-value">
                {findings.filter(f => f.severity.toLowerCase() === 'critical').length}
              </div>
            </div>
            <div className="card">
              <h3>High Findings</h3>
              <div className="card-value">
                {findings.filter(f => f.severity.toLowerCase() === 'high').length}
              </div>
            </div>
          </div>

          {/* Recent Scans */}
          <div className="section">
            <h2>Recent Scans</h2>
            <div className="table-container">
              {scans.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scans.slice(0, 5).map((scan) => (
                      <tr key={scan.id}>
                        <td>{scan.name}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(scan.status) }}
                          >
                            {scan.status}
                          </span>
                        </td>
                        <td>{new Date(scan.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No scans found. Create your first scan to get started.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Findings */}
          <div className="section">
            <h2>Recent Findings</h2>
            <div className="table-container">
              {findings.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Severity</th>
                      <th>Status</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {findings.slice(0, 5).map((finding) => (
                      <tr key={finding.id}>
                        <td>{finding.title}</td>
                        <td>
                          <span 
                            className="severity-badge"
                            style={{ backgroundColor: getSeverityColor(finding.severity) }}
                          >
                            {finding.severity}
                          </span>
                        </td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(finding.status) }}
                          >
                            {finding.status}
                          </span>
                        </td>
                        <td>{new Date(finding.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <p>No findings found. Run a scan to discover security issues.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </Layout>
  );
};

export default Home;
