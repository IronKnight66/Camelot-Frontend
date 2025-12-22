import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  ExpandedState,
  Row,
} from '@tanstack/react-table';
import Layout from './Layout';
import api from '../services/api';
import './Scans.css';

interface ScanParent {
  id: number;
  name: string;
  description: string | null;
  target_url: string | null;
  target_ip: string | null;
  target_domain: string | null;
  status: string;
  total_scans: number;
  completed_scans: number;
  created_at: string;
  updated_at: string;
  scans?: Scan[];
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
  scan_parent_id: number | null;
  scan_config?: any;
  scanner_tools?: string[];
}

interface ScanParentsResponse {
  scan_parents: ScanParent[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

interface OrphanedScansResponse {
  scans: Scan[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const Scans: React.FC = () => {
  const [scanParents, setScanParents] = useState<ScanParent[]>([]);
  const [orphanedScans, setOrphanedScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  
  // Pagination
  const [currentParentPage, setCurrentParentPage] = useState(1);
  const [totalParentPages, setTotalParentPages] = useState(1);
  const [currentOrphanPage, setCurrentOrphanPage] = useState(1);
  const [totalOrphanPages, setTotalOrphanPages] = useState(1);
  const [pageSize] = useState(20);
  
  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    loadScans();
  }, [currentParentPage, currentOrphanPage]);

  const loadScans = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [parentsResponse, orphansResponse] = await Promise.all([
        api.getScanParentsWithScans({
          page: currentParentPage,
          page_size: pageSize
        }) as Promise<ScanParentsResponse>,
        api.getOrphanedScans({
          page: currentOrphanPage,
          page_size: pageSize
        }) as Promise<OrphanedScansResponse>
      ]);
      
      console.log('📊 Scan Parents Response:', parentsResponse);
      console.log('📊 Orphaned Scans Response:', orphansResponse);
      
      setScanParents(parentsResponse.scan_parents || []);
      setTotalParentPages(parentsResponse.total_pages || 1);
      
      setOrphanedScans(orphansResponse.scans || []);
      setTotalOrphanPages(orphansResponse.total_pages || 1);
    } catch (err: any) {
      console.error('❌ Error loading scans:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load scans');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setColumnFilters([]);
    setSorting([]);
  };

  const handleViewScanDetails = useCallback((scan: Scan) => {
    setSelectedScan(scan);
  }, []);

  const closeDetailsModal = () => {
    setSelectedScan(null);
  };

  const handleViewFindings = (scanId: number) => {
    window.location.href = `/findings?scan_id=${scanId}`;
  };

  const handleDownloadScan = async (scan: Scan) => {
    try {
      const response = await apiService.downloadScanResults(scan.id);
      const blob = new Blob([response], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scan_${scan.id}_${scan.name}_results.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download scan results');
    }
  };

  const handleDownloadParentScans = async (parentId: number, parentName: string) => {
    try {
      const response = await apiService.downloadParentScanResults(parentId);
      const blob = new Blob([response], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parent_scan_${parentId}_${parentName}_results.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download parent scan results');
    }
  };

  const getScanStatusClass = (status: string) => {
    return `scan-status-${status.toLowerCase()}`;
  };

  const getParentStatusClass = (status: string) => {
    return `parent-status-${status.toLowerCase()}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const renderStatusBadge = (status: string, isParent: boolean = false) => {
    const statusColors: { [key: string]: string } = {
      pending: '#3b82f6',
      running: '#f59e0b',
      active: '#f59e0b',
      completed: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280'
    };
    
    const color = statusColors[status.toLowerCase()] || '#6b7280';
    
    return (
      <span 
        className={`status-badge ${isParent ? getParentStatusClass(status) : getScanStatusClass(status)}`}
        style={{ backgroundColor: color, color: '#fff', border: `1px solid ${color}` }}
      >
        {status.toUpperCase()}
      </span>
    );
  };

  const renderTarget = (parent: ScanParent | Scan) => {
    return (
      <div className="target-info">
        {parent.target_url && (
          <div className="target-url" title={parent.target_url}>
            {parent.target_url.length > 40
              ? `${parent.target_url.substring(0, 40)}...`
              : parent.target_url}
          </div>
        )}
        {parent.target_ip && <div className="target-ip">{parent.target_ip}</div>}
        {parent.target_domain && <div className="target-domain">{parent.target_domain}</div>}
        {!parent.target_url && !parent.target_ip && !parent.target_domain && <span>—</span>}
      </div>
    );
  };

  // Define column definitions for Parent Scans Table
  const parentColumns = useMemo<ColumnDef<ScanParent>[]>(
    () => [
      {
        id: 'expander',
        header: () => null,
        cell: ({ row }) => {
          return row.original.scans && row.original.scans.length > 0 ? (
            <button
              onClick={row.getToggleExpandedHandler()}
              className="expand-button"
            >
              {row.getIsExpanded() ? '▼' : '▶'}
            </button>
          ) : null;
        },
        size: 50,
      },
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => `#${info.getValue()}`,
        enableSorting: true,
        size: 80,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => {
          const parent = info.row.original;
          return (
            <div className="name-cell">
              <div className="name-text">{parent.name}</div>
              {parent.description && (
                <div className="description-text">{parent.description}</div>
              )}
            </div>
          );
        },
        enableSorting: true,
        enableGlobalFilter: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => renderStatusBadge(info.getValue() as string, true),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        id: 'target',
        header: 'Target',
        cell: (info) => renderTarget(info.row.original),
        enableGlobalFilter: true,
        accessorFn: (row) => row.target_url || row.target_ip || row.target_domain || '',
        enableSorting: true,
      },
      {
        id: 'scans_progress',
        header: 'Scans',
        cell: (info) => {
          const parent = info.row.original;
          return (
            <div className="scans-progress">
              <span className="progress-text">
                {parent.completed_scans} / {parent.total_scans}
              </span>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: parent.total_scans > 0 
                      ? `${(parent.completed_scans / parent.total_scans) * 100}%` 
                      : '0%' 
                  }}
                />
              </div>
            </div>
          );
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const progressA = rowA.original.total_scans > 0 
            ? rowA.original.completed_scans / rowA.original.total_scans 
            : 0;
          const progressB = rowB.original.total_scans > 0 
            ? rowB.original.completed_scans / rowB.original.total_scans 
            : 0;
          return progressA - progressB;
        },
      },
      {
        id: 'total_findings',
        header: 'Findings',
        cell: (info) => {
          const parent = info.row.original;
          const totalFindings = parent.scans?.reduce((sum, scan) => sum + scan.findings_count, 0) || 0;
          return <span className="findings-count">{totalFindings}</span>;
        },
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const findingsA = rowA.original.scans?.reduce((sum, scan) => sum + scan.findings_count, 0) || 0;
          const findingsB = rowB.original.scans?.reduce((sum, scan) => sum + scan.findings_count, 0) || 0;
          return findingsA - findingsB;
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        cell: (info) => new Date(info.getValue() as string).toLocaleDateString(),
        enableSorting: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const parent = info.row.original;
          const hasChildScans = parent.scans && parent.scans.length > 0;
          const hasResults = hasChildScans && parent.scans.some(scan => scan.mcp_job_id && scan.selected_tool);
          
          return hasResults ? (
            <div className="actions-cell">
              <button
                className="download-all-btn"
                onClick={() => handleDownloadParentScans(parent.id, parent.name)}
                title="Download all child scan results as ZIP"
              >
                Download All
              </button>
            </div>
          ) : null;
        },
      },
    ],
    []
  );

  // Define column definitions for Child/Orphaned Scans Table
  const scanColumns = useMemo<ColumnDef<Scan>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => `#${info.getValue()}`,
        size: 80,
        enableSorting: true,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => {
          const scan = info.row.original;
          return (
            <div className="name-cell">
              <div className="name-text">{scan.name}</div>
            </div>
          );
        },
        enableGlobalFilter: true,
        enableSorting: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => renderStatusBadge(info.getValue() as string),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'scan_type',
        header: 'Type',
        cell: (info) => (
          <span className="scan-type-badge">{info.getValue() as string}</span>
        ),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        id: 'target',
        header: 'Target',
        cell: (info) => renderTarget(info.row.original),
        accessorFn: (row) => row.target_url || row.target_ip || row.target_domain || '',
        enableGlobalFilter: true,
        enableSorting: true,
      },
      {
        id: 'findings',
        header: 'Findings',
        cell: (info) => {
          const scan = info.row.original;
          return (
            <div className="findings-breakdown">
              {scan.critical_findings > 0 && <span className="critical">{scan.critical_findings}C</span>}
              {scan.high_findings > 0 && <span className="high">{scan.high_findings}H</span>}
              {scan.medium_findings > 0 && <span className="medium">{scan.medium_findings}M</span>}
              {scan.low_findings > 0 && <span className="low">{scan.low_findings}L</span>}
              {scan.findings_count === 0 && <span>—</span>}
            </div>
          );
        },
      },
      {
        id: 'timing',
        header: 'Timing',
        cell: (info) => {
          const scan = info.row.original;
          return (
            <div className="timing-info">
              {scan.started_at && <div>Started: {new Date(scan.started_at).toLocaleString()}</div>}
              {scan.completed_at && <div>Completed: {new Date(scan.completed_at).toLocaleString()}</div>}
              {!scan.started_at && !scan.completed_at && <span>Not started</span>}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const scan = info.row.original;
          return (
            <div className="actions-cell">
              <button
                className="view-details-btn"
                onClick={() => handleViewScanDetails(scan)}
              >
                Details
              </button>
              {scan.findings_count > 0 && (
                <button
                  className="view-findings-btn"
                  onClick={() => handleViewFindings(scan.id)}
                >
                  Findings
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [handleViewScanDetails]
  );

  // Configure TanStack Table for Parent Scans
  const parentTable = useReactTable({
    data: scanParents,
    columns: parentColumns,
    state: {
      columnFilters,
      globalFilter,
      sorting,
      expanded,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: (row) => !!(row.original.scans && row.original.scans.length > 0),
  });

  // Configure TanStack Table for Orphaned Scans
  const [orphanColumnFilters, setOrphanColumnFilters] = useState<ColumnFiltersState>([]);
  const [orphanGlobalFilter, setOrphanGlobalFilter] = useState('');
  const [orphanSorting, setOrphanSorting] = useState<SortingState>([]);
  
  const orphanTable = useReactTable({
    data: orphanedScans,
    columns: scanColumns,
    state: {
      columnFilters: orphanColumnFilters,
      globalFilter: orphanGlobalFilter,
      sorting: orphanSorting,
    },
    onColumnFiltersChange: setOrphanColumnFilters,
    onGlobalFilterChange: setOrphanGlobalFilter,
    onSortingChange: setOrphanSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });
  
  const clearOrphanFilters = () => {
    setOrphanGlobalFilter('');
    setOrphanColumnFilters([]);
    setOrphanSorting([]);
  };

  const renderChildScansTable = (scans: Scan[]) => {
    return (
      <div className="child-scans-table">
        <table className="scans-table nested-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Target</th>
              <th>Findings</th>
              <th>Timing</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {scans.map((scan) => (
              <tr key={scan.id} className="child-scan-row">
                <td>#{scan.id}</td>
                <td>
                  <div className="name-cell">
                    <div className="name-text">{scan.name}</div>
                    <span className="scan-type-badge">{scan.scan_type}</span>
                  </div>
                </td>
                <td>{renderStatusBadge(scan.status)}</td>
                <td>{renderTarget(scan)}</td>
                <td>
                  <div className="findings-breakdown">
                    {scan.critical_findings > 0 && <span className="critical">{scan.critical_findings}C</span>}
                    {scan.high_findings > 0 && <span className="high">{scan.high_findings}H</span>}
                    {scan.medium_findings > 0 && <span className="medium">{scan.medium_findings}M</span>}
                    {scan.low_findings > 0 && <span className="low">{scan.low_findings}L</span>}
                    {scan.findings_count === 0 && <span>—</span>}
                  </div>
                </td>
                <td>
                  <div className="timing-info">
                    {scan.started_at && <div>Started: {new Date(scan.started_at).toLocaleString()}</div>}
                    {scan.completed_at && <div>Completed: {new Date(scan.completed_at).toLocaleString()}</div>}
                    {!scan.started_at && !scan.completed_at && <span>Not started</span>}
                  </div>
                </td>
                <td>
                  <div className="actions-cell">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewScanDetails(scan)}
                    >
                      Details
                    </button>
                    {scan.findings_count > 0 && (
                      <button
                        className="view-findings-btn"
                        onClick={() => handleViewFindings(scan.id)}
                      >
                        Findings
                      </button>
                    )}
                    {scan.mcp_job_id && scan.selected_tool && (
                      <button
                        className="download-btn"
                        onClick={() => handleDownloadScan(scan)}
                        title="Download scan results from S3"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Layout>
      <div className="scans-container">
        <div className="scans-header">
          <h1>Scan History</h1>
          <p>View and manage all security scans and their results</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={loadScans}>Retry</button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading scans...</p>
          </div>
        ) : (
          <>
            {/* Parent Scans Section */}
            <div className="scans-section">
              <h2>Scan Groups</h2>
              {scanParents.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>No Scan Groups Found</h3>
                  <p>No grouped scans available.</p>
                </div>
              ) : (
                <>
                  {/* Filters and Search */}
                  <div className="table-controls">
                    <div className="table-filters">
                      <select
                        className="filter-dropdown"
                        value={columnFilters.find(f => f.id === 'status')?.value as string || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            setColumnFilters(columnFilters.filter(f => f.id !== 'status'));
                          } else {
                            setColumnFilters([
                              ...columnFilters.filter(f => f.id !== 'status'),
                              { id: 'status', value }
                            ]);
                          }
                        }}
                      >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    
                    <div className="table-search-wrapper">
                      <input
                        type="text"
                        placeholder="Search scan groups..."
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
                  </div>

                  {/* Parent Scans Table */}
                  <div className="scans-table-wrapper tanstack-table-wrapper">
                    <table className="scans-table tanstack-table">
                      <thead>
                        {parentTable.getHeaderGroups().map((headerGroup) => (
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
                        {parentTable.getRowModel().rows.map((row) => (
                          <React.Fragment key={row.id}>
                            <tr className="parent-scan-row">
                              {row.getVisibleCells().map((cell) => (
                                <td key={cell.id}>
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                              ))}
                            </tr>
                            {row.getIsExpanded() && row.original.scans && row.original.scans.length > 0 && (
                              <tr className="expanded-row">
                                <td colSpan={parentColumns.length}>
                                  {renderChildScansTable(row.original.scans)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {totalParentPages > 1 && (
                    <div className="pagination">
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentParentPage(Math.max(1, currentParentPage - 1))}
                        disabled={currentParentPage === 1}
                      >
                        Previous
                      </button>
                      <span className="pagination-info">
                        Page {currentParentPage} of {totalParentPages}
                      </span>
                      <button
                        className="pagination-btn"
                        onClick={() => setCurrentParentPage(Math.min(totalParentPages, currentParentPage + 1))}
                        disabled={currentParentPage === totalParentPages}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Orphaned Scans Section */}
            {orphanedScans.length > 0 && (
              <div className="scans-section orphaned-section">
                <h2>Individual Scans</h2>
                <p className="section-description">Scans not associated with any group</p>
                
                {/* Filters and Search for Orphaned Scans */}
                <div className="table-controls">
                  <div className="table-filters">
                    <select
                      className="filter-dropdown"
                      value={orphanColumnFilters.find(f => f.id === 'status')?.value as string || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setOrphanColumnFilters(orphanColumnFilters.filter(f => f.id !== 'status'));
                        } else {
                          setOrphanColumnFilters([
                            ...orphanColumnFilters.filter(f => f.id !== 'status'),
                            { id: 'status', value }
                          ]);
                        }
                      }}
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="running">Running</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    
                    <select
                      className="filter-dropdown"
                      value={orphanColumnFilters.find(f => f.id === 'scan_type')?.value as string || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setOrphanColumnFilters(orphanColumnFilters.filter(f => f.id !== 'scan_type'));
                        } else {
                          setOrphanColumnFilters([
                            ...orphanColumnFilters.filter(f => f.id !== 'scan_type'),
                            { id: 'scan_type', value }
                          ]);
                        }
                      }}
                    >
                      <option value="">All Types</option>
                      <option value="vulnerability_scan">Vulnerability Scan</option>
                      <option value="port_scan">Port Scan</option>
                      <option value="web_scan">Web Scan</option>
                      <option value="network_scan">Network Scan</option>
                      <option value="compliance_scan">Compliance Scan</option>
                    </select>
                  </div>
                  
                  <div className="table-search-wrapper">
                    <input
                      type="text"
                      placeholder="Search individual scans..."
                      value={orphanGlobalFilter ?? ''}
                      onChange={(e) => setOrphanGlobalFilter(e.target.value)}
                      className="table-search-input"
                    />
                    {(orphanGlobalFilter || orphanColumnFilters.length > 0) && (
                      <button className="clear-filters-btn" onClick={clearOrphanFilters} style={{ marginLeft: '10px' }}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="scans-table-wrapper tanstack-table-wrapper">
                  <table className="scans-table tanstack-table">
                    <thead>
                      {orphanTable.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                          {headerGroup.headers.map((header) => (
                            <th
                              key={header.id}
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
                      {orphanTable.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="orphan-scan-row">
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

                {/* Pagination for Orphaned Scans */}
                {totalOrphanPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentOrphanPage(Math.max(1, currentOrphanPage - 1))}
                      disabled={currentOrphanPage === 1}
                    >
                      Previous
                    </button>
                    <span className="pagination-info">
                      Page {currentOrphanPage} of {totalOrphanPages}
                    </span>
                    <button
                      className="pagination-btn"
                      onClick={() => setCurrentOrphanPage(Math.min(totalOrphanPages, currentOrphanPage + 1))}
                      disabled={currentOrphanPage === totalOrphanPages}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Scan Details Modal */}
        {selectedScan && (
          <div className="modal-overlay" onClick={closeDetailsModal}>
            <div className="modal-content scan-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Scan Details</h2>
                <button className="close-modal-btn" onClick={closeDetailsModal}>×</button>
              </div>

              <div className="modal-body">
                <div className="detail-section">
                  <h3>{selectedScan.name}</h3>
                  <div className="detail-badges">
                    {renderStatusBadge(selectedScan.status)}
                    <span className="scan-type-badge">{selectedScan.scan_type}</span>
                  </div>
                </div>

                <div className="detail-section detail-grid">
                  <div className="detail-item">
                    <strong>Scan ID:</strong>
                    <span>#{selectedScan.id}</span>
                  </div>
                  {selectedScan.scan_parent_id && (
                    <div className="detail-item">
                      <strong>Parent ID:</strong>
                      <span>#{selectedScan.scan_parent_id}</span>
                    </div>
                  )}
                </div>

                {(selectedScan.target_url || selectedScan.target_ip || selectedScan.target_domain) && (
                  <div className="detail-section">
                    <h4>Target Information</h4>
                    <div className="detail-grid">
                      {selectedScan.target_url && (
                        <div className="detail-item">
                          <strong>URL:</strong>
                          <span className="url-text">{selectedScan.target_url}</span>
                        </div>
                      )}
                      {selectedScan.target_ip && (
                        <div className="detail-item">
                          <strong>IP:</strong>
                          <span>{selectedScan.target_ip}</span>
                        </div>
                      )}
                      {selectedScan.target_domain && (
                        <div className="detail-item">
                          <strong>Domain:</strong>
                          <span>{selectedScan.target_domain}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h4>Findings Summary</h4>
                  <div className="findings-summary-grid">
                    <div className="finding-stat critical">
                      <span className="stat-label">Critical</span>
                      <span className="stat-value">{selectedScan.critical_findings}</span>
                    </div>
                    <div className="finding-stat high">
                      <span className="stat-label">High</span>
                      <span className="stat-value">{selectedScan.high_findings}</span>
                    </div>
                    <div className="finding-stat medium">
                      <span className="stat-label">Medium</span>
                      <span className="stat-value">{selectedScan.medium_findings}</span>
                    </div>
                    <div className="finding-stat low">
                      <span className="stat-label">Low</span>
                      <span className="stat-value">{selectedScan.low_findings}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Timing</h4>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <strong>Created:</strong>
                      <span>{formatDate(selectedScan.created_at)}</span>
                    </div>
                    {selectedScan.started_at && (
                      <div className="detail-item">
                        <strong>Started:</strong>
                        <span>{formatDate(selectedScan.started_at)}</span>
                      </div>
                    )}
                    {selectedScan.completed_at && (
                      <div className="detail-item">
                        <strong>Completed:</strong>
                        <span>{formatDate(selectedScan.completed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedScan.scanner_tools && selectedScan.scanner_tools.length > 0 && (
                  <div className="detail-section">
                    <h4>Scanner Tools</h4>
                    <div className="tools-list">
                      {selectedScan.scanner_tools.map((tool, index) => (
                        <span key={index} className="tool-badge">{tool}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {selectedScan.findings_count > 0 && (
                  <button 
                    className="btn-primary" 
                    onClick={() => handleViewFindings(selectedScan.id)}
                  >
                    View Findings ({selectedScan.findings_count})
                  </button>
                )}
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

export default Scans;

