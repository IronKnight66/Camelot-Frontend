/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  ColumnFiltersState,
  SortingState,
} from '@tanstack/react-table';
import Layout from './Layout';
import api from '../services/api';
import './LLMLogs.css';

interface LLMLog {
  id: number;
  session_id: string;
  user_id: string;
  provider: string;
  model_name: string | null;
  user_message: string;
  assistant_message: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_usd: number | null;
  latency_ms: number | null;
  status: string;
  error_message: string | null;
  action_triggered: string | null;
  created_at: string;
}

interface LLMLogsResponse {
  logs: LLMLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

const LLMLogs: React.FC = () => {
  const [logs, setLogs] = useState<LLMLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<LLMLog | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [pageSize] = useState(50);
  
  // Filters
  const [providerFilter, setProviderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [campaignFilter, setCampaignFilter] = useState<string>('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  
  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    loadLogs();
  }, [currentPage, providerFilter, statusFilter, campaignFilter]);

  const loadCampaigns = async () => {
    try {
      const response = await api.getScanParentsWithScans({ page_size: 1000 });
      setCampaigns(response.scan_parents || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        page: currentPage,
        page_size: pageSize,
      };
      
      if (providerFilter) {
        params.provider = providerFilter;
      }
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (campaignFilter) {
        params.assessment_campaign_id = parseInt(campaignFilter);
      }
      
      console.log('Loading LLM logs with params:', params);
      
      const response: LLMLogsResponse = await api.getLLMLogs(params);
      
      console.log('LLM Logs API Response:', response);
      console.log('Logs count:', response.logs?.length);
      console.log('Total:', response.total);
      console.log('Campaign filter applied:', campaignFilter);
      
      setLogs(response.logs);
      setTotalPages(response.total_pages);
      setTotalLogs(response.total);
      setLoading(false);
    } catch (err: any) {
      console.error('Error loading LLM logs:', err);
      setError(err.response?.data?.detail || 'Failed to load LLM logs');
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatCost = (cost: number | null) => {
    if (cost === null || cost === undefined) return 'N/A';
    return `$${cost.toFixed(4)}`;
  };

  const formatLatency = (latency: number | null) => {
    if (latency === null || latency === undefined) return 'N/A';
    return `${latency.toFixed(0)}ms`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'status-badge status-success';
      case 'error':
        return 'status-badge status-error';
      case 'timeout':
        return 'status-badge status-timeout';
      default:
        return 'status-badge';
    }
  };

  const getProviderBadgeClass = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'bedrock':
        return 'provider-badge provider-bedrock';
      case 'openai':
        return 'provider-badge provider-openai';
      case 'anthropic':
        return 'provider-badge provider-anthropic';
      default:
        return 'provider-badge';
    }
  };

  const truncateText = (text: string | null, maxLength: number = 100) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const columns = useMemo<ColumnDef<LLMLog>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Timestamp',
        cell: (info) => formatDate(info.getValue() as string),
        size: 160,
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: (info) => (
          <span className={getProviderBadgeClass(info.getValue() as string)}>
            {(info.getValue() as string).toUpperCase()}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'model_name',
        header: 'Model',
        cell: (info) => {
          const modelName = info.getValue() as string | null;
          if (!modelName) return 'N/A';
          // Extract short model name (e.g., "claude-3-5-sonnet" from full ID)
          const shortName = modelName.split('.').pop()?.split(':')[0] || modelName;
          return <span title={modelName}>{shortName}</span>;
        },
        size: 140,
      },
      {
        accessorKey: 'user_message',
        header: 'User Message',
        cell: (info) => (
          <span className="message-preview" title={info.getValue() as string}>
            {truncateText(info.getValue() as string, 60)}
          </span>
        ),
        size: 300,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <span className={getStatusBadgeClass(info.getValue() as string)}>
            {(info.getValue() as string).toUpperCase()}
          </span>
        ),
        size: 90,
      },
      {
        accessorKey: 'total_tokens',
        header: 'Tokens',
        cell: (info) => {
          const tokens = info.getValue() as number | null;
          return tokens !== null ? tokens.toLocaleString() : 'N/A';
        },
        size: 80,
      },
      {
        accessorKey: 'latency_ms',
        header: 'Latency',
        cell: (info) => formatLatency(info.getValue() as number | null),
        size: 90,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => (
          <button
            className="btn-view-details"
            onClick={() => setSelectedLog(info.row.original)}
          >
            View
          </button>
        ),
        size: 80,
      },
    ],
    []
  );

  const table = useReactTable({
    data: logs,
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
    manualPagination: true,
  });

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const closeModal = () => {
    setSelectedLog(null);
  };

  return (
    <Layout>
      <div className="llm-logs-container">
        <div className="llm-logs-header">
          <h1>LLM Message History</h1>
          <p className="subtitle">
            View all AI interactions from AWS Bedrock, Agent Core, and other providers
          </p>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label htmlFor="provider-filter">Provider:</label>
            <select
              id="provider-filter"
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Providers</option>
              <option value="bedrock">Bedrock</option>
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
              <option value="timeout">Timeout</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="campaign-filter">Campaign:</label>
            <select
              id="campaign-filter"
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="filter-select"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((campaign) => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaign_name || `Campaign ${campaign.id}`} (ID: {campaign.id})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="search-filter">Search:</label>
            <input
              id="search-filter"
              type="text"
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search messages..."
              className="filter-input"
            />
          </div>

          <button onClick={loadLogs} className="btn-refresh">
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-label">Total Messages</div>
            <div className="stat-value">{totalLogs.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Current Page</div>
            <div className="stat-value">{currentPage} / {totalPages}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Showing</div>
            <div className="stat-value">{logs.length} logs</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading LLM logs...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="table-container">
              <table className="llm-logs-table">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          style={{ width: header.getSize() }}
                          className={header.column.getCanSort() ? 'sortable' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="no-data">
                        No LLM logs found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination-container">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                First
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next
              </button>
              <button
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Last
              </button>
            </div>
          </>
        )}

        {/* Detail Modal */}
        {selectedLog && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>LLM Log Details</h2>
                <button className="modal-close" onClick={closeModal}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>General Information</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Timestamp:</label>
                      <span>{formatDate(selectedLog.created_at)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Session ID:</label>
                      <span className="monospace">{selectedLog.session_id}</span>
                    </div>
                    <div className="detail-item">
                      <label>Provider:</label>
                      <span className={getProviderBadgeClass(selectedLog.provider)}>
                        {selectedLog.provider.toUpperCase()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Model:</label>
                      <span>{selectedLog.model_name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={getStatusBadgeClass(selectedLog.status)}>
                        {selectedLog.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Messages</h3>
                  <div className="message-container">
                    <div className="message-block">
                      <label>User Message:</label>
                      <div className="message-content user-message">
                        {selectedLog.user_message}
                      </div>
                    </div>
                    <div className="message-block">
                      <label>Assistant Response:</label>
                      <div className="message-content assistant-message">
                        {selectedLog.assistant_message || 'No response'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h3>Metrics</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <label>Input Tokens:</label>
                      <span>{selectedLog.input_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Output Tokens:</label>
                      <span>{selectedLog.output_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Total Tokens:</label>
                      <span>{selectedLog.total_tokens?.toLocaleString() || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <label>Cost:</label>
                      <span>{formatCost(selectedLog.cost_usd)}</span>
                    </div>
                    <div className="detail-item">
                      <label>Latency:</label>
                      <span>{formatLatency(selectedLog.latency_ms)}</span>
                    </div>
                  </div>
                </div>

                {selectedLog.error_message && (
                  <div className="detail-section">
                    <h3>Error Details</h3>
                    <div className="error-details">
                      {selectedLog.error_message}
                    </div>
                  </div>
                )}

                {selectedLog.action_triggered && (
                  <div className="detail-section">
                    <h3>Action Triggered</h3>
                    <div className="action-details">
                      <pre>{selectedLog.action_triggered}</pre>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-close" onClick={closeModal}>
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

export default LLMLogs;
