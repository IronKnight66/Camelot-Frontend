import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';
import Layout from './Layout';
import api from '../services/api';
import './Findings.css';

interface Finding {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  scan_id: number;
  vulnerability_type: string | null;
  cve_id: string | null;
  cwe_id: string | null;
  cvss_score: number | null;
  target_url: string | null;
  target_ip: string | null;
  target_port: number | null;
  file_path: string | null;
  line_number: number | null;
  proof_of_concept: string | null;
  remediation_steps: string | null;
  references: string[] | null;
  risk_score: number | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  poc_status?: string;
  poc_confidence_score?: number;
}

interface FindingsResponse {
  findings: Finding[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface FindingsSummary {
  total: number;
  by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  by_status: {
    new: number;
    confirmed: number;
    false_positive: number;
    fixed: number;
  };
}

interface Level {
  id: number;
  label: string;
  value: string;
  color: string;
  sort_order: number;
  is_active: boolean;
}

const Findings: React.FC = () => {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [summary, setSummary] = useState<FindingsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
  
  // Dynamic severity and status levels
  const [severityLevels, setSeverityLevels] = useState<Level[]>([]);
  const [statusLevels, setStatusLevels] = useState<Level[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(20);
  
  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const [activeTab, setActiveTab] = useState<'list' | 'summary'>('list');

  useEffect(() => {
    loadLevels();
    loadFindings();
  }, [currentPage]);

  useEffect(() => {
    if (activeTab === 'summary') {
      loadSummary();
    }
  }, [activeTab]);

  const loadLevels = async () => {
    try {
      const [severity, status] = await Promise.all([
        api.getSeverityLevels(),
        api.getStatusLevels()
      ]);
      
      setSeverityLevels(severity);
      setStatusLevels(status);
    } catch (err) {
      console.error('Failed to load severity/status levels:', err);
      // Don't show error to user - fall back to empty levels
    }
  };

  const loadFindings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: any = {
        page: currentPage,
        page_size: pageSize
      };
      
      const response: FindingsResponse = await api.getFindings(params);
      console.log('🔍 Findings API Response:', response);
      console.log('📊 Number of findings:', response.findings?.length || 0);
      setFindings(response.findings || []);
      setTotalPages(response.total_pages || 1);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load findings');
      console.error('Error loading findings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    try {
      const summaryData = await api.getFindingsSummary();
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error loading summary:', err);
    }
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setColumnFilters([]);
    setSorting([]);
  };

  const handleViewDetails = useCallback((finding: Finding) => {
    setSelectedFinding(finding);
  }, []);

  const closeDetailsModal = () => {
    setSelectedFinding(null);
  };

  const handleStatusChange = useCallback(async (findingId: number, newStatus: string) => {
    setUpdatingStatus(findingId);
    try {
      await api.updateFinding(findingId.toString(), { status: newStatus });
      
      // Update the finding in the local state
      setFindings(prevFindings => 
        prevFindings.map(f => 
          f.id === findingId ? { ...f, status: newStatus } : f
        )
      );
      
      // If the modal is open for this finding, update it too
      if (selectedFinding && selectedFinding.id === findingId) {
        setSelectedFinding({ ...selectedFinding, status: newStatus });
      }
    } catch (err: any) {
      console.error('Error updating finding status:', err);
      alert('Failed to update status: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUpdatingStatus(null);
    }
  }, [selectedFinding]);

  const getSeverityClass = (severity: string) => {
    return `severity-${severity.toLowerCase()}`;
  };

  const getStatusClass = (status: string) => {
    return `status-${status.toLowerCase().replace('_', '-')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderSeverityBadge = (severity: string) => {
    const level = severityLevels.find(l => l.value === severity);
    const color = level?.color || '#808080';
    const label = level?.label || severity;
    
    return (
      <span 
        className={`severity-badge ${getSeverityClass(severity)}`}
        style={{ backgroundColor: color, color: '#fff', border: `1px solid ${color}` }}
      >
        {label.toUpperCase()}
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    const level = statusLevels.find(l => l.value === status);
    const color = level?.color || '#808080';
    const label = level?.label || status.replace('_', ' ');
    
    return (
      <span 
        className={`status-badge ${getStatusClass(status)}`}
        style={{ backgroundColor: color, color: '#fff', border: `1px solid ${color}` }}
      >
        {label.toUpperCase()}
      </span>
    );
  };

  // Define column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Finding>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => `#${info.getValue()}`,
        enableSorting: true,
        size: 80,
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: (info) => {
          const finding = info.row.original;
          return (
            <div className="title-cell">
              <div>{finding.title}</div>
              {finding.vulnerability_type && (
                <span className="vuln-type">{finding.vulnerability_type}</span>
              )}
            </div>
          );
        },
        enableSorting: true,
        enableGlobalFilter: true,
      },
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: (info) => renderSeverityBadge(info.getValue() as string),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => {
          const finding = info.row.original;
          const currentLevel = statusLevels.find(l => l.value === finding.status);
          const color = currentLevel?.color || '#808080';
          
          return (
            <select
              className={`status-dropdown ${getStatusClass(finding.status)}`}
              style={{ backgroundColor: color, color: '#fff', borderColor: color }}
              value={finding.status}
              onChange={(e) => handleStatusChange(finding.id, e.target.value)}
              disabled={updatingStatus === finding.id}
            >
              {statusLevels.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          );
        },
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: (info) => (info.getValue() as string).replace('_', ' '),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        id: 'cve_cwe',
        header: 'CVE/CWE',
        cell: (info) => {
          const finding = info.row.original;
          return (
            <>
              {finding.cve_id && <div className="cve-badge">{finding.cve_id}</div>}
              {finding.cwe_id && <div className="cwe-badge">{finding.cwe_id}</div>}
              {!finding.cve_id && !finding.cwe_id && <span>—</span>}
            </>
          );
        },
        enableGlobalFilter: true,
      },
      {
        id: 'target',
        header: 'Target',
        cell: (info) => {
          const finding = info.row.original;
          return (
            <>
              {finding.target_url && (
                <div className="target-url" title={finding.target_url}>
                  {finding.target_url.length > 30
                    ? `${finding.target_url.substring(0, 30)}...`
                    : finding.target_url}
                </div>
              )}
              {finding.target_ip && <div className="target-ip">{finding.target_ip}</div>}
              {!finding.target_url && !finding.target_ip && <span>—</span>}
            </>
          );
        },
        enableGlobalFilter: true,
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('created_at') as string).getTime();
          const dateB = new Date(rowB.getValue('created_at') as string).getTime();
          return dateA - dateB;
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const finding = info.row.original;
          return (
            <button
              className="view-details-btn"
              onClick={() => handleViewDetails(finding)}
            >
              View Details
            </button>
          );
        },
      },
    ],
    [updatingStatus, handleStatusChange, handleViewDetails]
  );

  // Configure TanStack Table
  const table = useReactTable({
    data: findings,
    columns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const finding = row.original;
      const searchLower = filterValue.toLowerCase();
      
      // Search across multiple fields
      const searchableFields = [
        finding.title,
        finding.description,
        finding.vulnerability_type,
        finding.cve_id,
        finding.cwe_id,
        finding.target_url,
        finding.target_ip,
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
    },
    manualPagination: true, // We use server-side pagination
    pageCount: totalPages,
  });

  return (
    <Layout>
      <div className="findings-container">
        <div className="findings-header">
          <h1>Security Findings</h1>
          <p>Manage and track security vulnerabilities discovered during scans</p>
        </div>

        {/* Tabs */}
        <div className="findings-tabs">
          <button
            className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            Findings List
          </button>
          <button
            className={`tab-button ${activeTab === 'summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('summary')}
          >
            Summary
          </button>
        </div>

        {activeTab === 'list' && (
          <>
            {/* Error Display */}
            {error && (
              <div className="error-banner">
                <p>{error}</p>
                <button onClick={loadFindings}>Retry</button>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading findings...</p>
              </div>
            ) : findings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Findings Found</h3>
                <p>No security findings available.</p>
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Findings Found</h3>
                <p>No security findings match your current search or filters.</p>
                {(globalFilter || columnFilters.length > 0) && (
                  <button className="clear-filters-btn" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Global Search */}
                <div className="table-search-wrapper">
                  <input
                    type="text"
                    placeholder="Search findings by title, description, CVE/CWE, target..."
                    value={globalFilter ?? ''}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="table-search-input"
                  />
                  {(globalFilter || columnFilters.length > 0) && (
                    <button className="clear-filters-btn" onClick={clearFilters} style={{ marginLeft: '10px' }}>
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Findings Table */}
                <div className="findings-table-wrapper tanstack-table-wrapper">
                  <table className="findings-table tanstack-table">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
                              style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                              className={header.column.getCanSort() ? 'sortable-header' : ''}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              <div className="header-content">
                                {flexRender(header.column.columnDef.header, header.getContext())}
                                {header.column.getCanSort() && (
                                  <span className="sort-indicator">
                                    {{
                                      asc: ' ↑',
                                      desc: ' ↓',
                                    }[header.column.getIsSorted() as string] ?? ' ⇅'}
                                  </span>
                                )}
                              </div>
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="finding-row">
                          {row.getVisibleCells().map((cell) => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && summary && (
          <div className="findings-summary">
            <div className="summary-card">
              <h3>Total Findings</h3>
              <div className="summary-total">{summary.total}</div>
            </div>

            <div className="summary-section">
              <h3>By Severity</h3>
              <div className="summary-grid">
                <div className="summary-item severity-critical">
                  <span className="summary-label">Critical</span>
                  <span className="summary-value">{summary.by_severity.critical}</span>
                </div>
                <div className="summary-item severity-high">
                  <span className="summary-label">High</span>
                  <span className="summary-value">{summary.by_severity.high}</span>
                </div>
                <div className="summary-item severity-medium">
                  <span className="summary-label">Medium</span>
                  <span className="summary-value">{summary.by_severity.medium}</span>
                </div>
                <div className="summary-item severity-low">
                  <span className="summary-label">Low</span>
                  <span className="summary-value">{summary.by_severity.low}</span>
                </div>
                <div className="summary-item severity-info">
                  <span className="summary-label">Info</span>
                  <span className="summary-value">{summary.by_severity.info}</span>
                </div>
              </div>
            </div>

            <div className="summary-section">
              <h3>By Status</h3>
              <div className="summary-grid">
                <div className="summary-item status-new">
                  <span className="summary-label">New</span>
                  <span className="summary-value">{summary.by_status.new}</span>
                </div>
                <div className="summary-item status-confirmed">
                  <span className="summary-label">Confirmed</span>
                  <span className="summary-value">{summary.by_status.confirmed}</span>
                </div>
                <div className="summary-item status-false-positive">
                  <span className="summary-label">False Positive</span>
                  <span className="summary-value">{summary.by_status.false_positive}</span>
                </div>
                <div className="summary-item status-fixed">
                  <span className="summary-label">Fixed</span>
                  <span className="summary-value">{summary.by_status.fixed}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {selectedFinding && (
          <div className="modal-overlay" onClick={closeDetailsModal}>
            <div className="modal-content finding-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Finding Details</h2>
                <button className="close-modal-btn" onClick={closeDetailsModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <h3>{selectedFinding.title}</h3>
                  <div className="detail-badges">
                    {renderSeverityBadge(selectedFinding.severity)}
                    {renderStatusBadge(selectedFinding.status)}
                    <span className="category-badge">
                      {selectedFinding.category.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Description</h4>
                  <p className="detail-text">{selectedFinding.description}</p>
                </div>

                {selectedFinding.vulnerability_type && (
                  <div className="detail-section">
                    <h4>Vulnerability Type</h4>
                    <p className="detail-text">{selectedFinding.vulnerability_type}</p>
                  </div>
                )}

                <div className="detail-section detail-grid">
                  {selectedFinding.cve_id && (
                    <div className="detail-item">
                      <strong>CVE ID:</strong>
                      <span>{selectedFinding.cve_id}</span>
                    </div>
                  )}
                  {selectedFinding.cwe_id && (
                    <div className="detail-item">
                      <strong>CWE ID:</strong>
                      <span>{selectedFinding.cwe_id}</span>
                    </div>
                  )}
                  {selectedFinding.cvss_score && (
                    <div className="detail-item">
                      <strong>CVSS Score:</strong>
                      <span>{selectedFinding.cvss_score.toFixed(1)}</span>
                    </div>
                  )}
                  {selectedFinding.risk_score && (
                    <div className="detail-item">
                      <strong>Risk Score:</strong>
                      <span>{selectedFinding.risk_score.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {(selectedFinding.target_url || selectedFinding.target_ip || selectedFinding.target_port) && (
                  <div className="detail-section">
                    <h4>Target Information</h4>
                    <div className="detail-grid">
                      {selectedFinding.target_url && (
                        <div className="detail-item">
                          <strong>URL:</strong>
                          <span className="url-text">{selectedFinding.target_url}</span>
                        </div>
                      )}
                      {selectedFinding.target_ip && (
                        <div className="detail-item">
                          <strong>IP:</strong>
                          <span>{selectedFinding.target_ip}</span>
                        </div>
                      )}
                      {selectedFinding.target_port && (
                        <div className="detail-item">
                          <strong>Port:</strong>
                          <span>{selectedFinding.target_port}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {(selectedFinding.file_path || selectedFinding.line_number) && (
                  <div className="detail-section">
                    <h4>Location</h4>
                    <div className="detail-grid">
                      {selectedFinding.file_path && (
                        <div className="detail-item">
                          <strong>File:</strong>
                          <span className="code-text">{selectedFinding.file_path}</span>
                        </div>
                      )}
                      {selectedFinding.line_number && (
                        <div className="detail-item">
                          <strong>Line:</strong>
                          <span>{selectedFinding.line_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedFinding.proof_of_concept && (
                  <div className="detail-section">
                    <h4>Proof of Concept</h4>
                    <pre className="code-block">{selectedFinding.proof_of_concept}</pre>
                  </div>
                )}

                {selectedFinding.remediation_steps && (
                  <div className="detail-section">
                    <h4>Remediation Steps</h4>
                    <p className="detail-text">{selectedFinding.remediation_steps}</p>
                  </div>
                )}

                {selectedFinding.references && selectedFinding.references.length > 0 && (
                  <div className="detail-section">
                    <h4>References</h4>
                    <ul className="references-list">
                      {selectedFinding.references.map((ref, index) => (
                        <li key={index}>
                          <a href={ref} target="_blank" rel="noopener noreferrer">
                            {ref}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Metadata</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Scan ID:</strong>
                      <span>#{selectedFinding.scan_id}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Created:</strong>
                      <span>{formatDate(selectedFinding.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <strong>Updated:</strong>
                      <span>{formatDate(selectedFinding.updated_at)}</span>
                    </div>
                    {selectedFinding.assigned_to && (
                      <div className="detail-item">
                        <strong>Assigned To:</strong>
                        <span>{selectedFinding.assigned_to}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Findings;

