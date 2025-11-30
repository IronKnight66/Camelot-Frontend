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
  
  // Date filters for costs tab (keep these for server-side filtering)
  const [dateFilters, setDateFilters] = useState({
    startDate: '',
    endDate: '',
  });
  
  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<SortingState>([]);
  
  const [activeTab, setActiveTab] = useState<'logs' | 'summary' | 'costs'>('logs');
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, dateFilters]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'logs') {
        const response = await api.getChatLogs({ limit: 1000 });
        console.log('🔍 Chat Logs API Response:', response);
        console.log('🔍 Response structure:', {
          isArray: Array.isArray(response),
          hasLogs: 'logs' in response,
          hasData: 'data' in response,
          total: response.total,
          filters: response.filters_applied
        });
        // Handle different response formats
        const logsData = Array.isArray(response) 
          ? response 
          : (response.logs || response.data || []);
        console.log('📊 Number of logs:', logsData.length);
        if (logsData.length > 0) {
          console.log('📋 First log sample:', logsData[0]);
        }
        setLogs(logsData);
      } else if (activeTab === 'summary') {
        const summaryData = await api.getChatLogsSummary();
        setSummary(summaryData);
      } else if (activeTab === 'costs') {
        const costs = await api.getChatLogsCosts(dateFilters.startDate || undefined, dateFilters.endDate || undefined);
        setCostSummary(costs);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load data');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilterChange = (key: string, value: string) => {
    setDateFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setGlobalFilter('');
    setColumnFilters([]);
    setSorting([]);
  };

  const clearDateFilters = () => {
    setDateFilters({
      startDate: '',
      endDate: '',
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

  const handleViewLog = useCallback((log: ChatLog) => {
    setSelectedLog(log);
  }, []);

  // Define column definitions for TanStack Table
  const columns = useMemo<ColumnDef<ChatLog>[]>(
    () => [
      {
        accessorKey: 'created_at',
        header: 'Time',
        cell: (info) => formatDate(info.getValue() as string),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const dateA = new Date(rowA.getValue('created_at') as string).getTime();
          const dateB = new Date(rowB.getValue('created_at') as string).getTime();
          return dateA - dateB;
        },
      },
      {
        accessorKey: 'provider',
        header: 'Provider',
        cell: (info) => info.getValue() as string,
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'model_name',
        header: 'Model',
        cell: (info) => info.getValue() as string || 'N/A',
        enableSorting: true,
        enableGlobalFilter: true,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: (info) => (
          <span className={`status-badge status-${info.getValue()}`}>
            {info.getValue() as string}
          </span>
        ),
        enableSorting: true,
        filterFn: (row, id, value) => {
          return value === '' || row.getValue(id) === value;
        },
      },
      {
        accessorKey: 'total_tokens',
        header: 'Tokens',
        cell: (info) => formatTokens(info.getValue() as number | null),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const tokensA = rowA.getValue('total_tokens') as number | null ?? 0;
          const tokensB = rowB.getValue('total_tokens') as number | null ?? 0;
          return tokensA - tokensB;
        },
      },
      {
        accessorKey: 'cost_usd',
        header: 'Cost',
        cell: (info) => formatCost(info.getValue() as number | null),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const costA = rowA.getValue('cost_usd') as number | null ?? 0;
          const costB = rowB.getValue('cost_usd') as number | null ?? 0;
          return costA - costB;
        },
      },
      {
        accessorKey: 'latency_ms',
        header: 'Latency',
        cell: (info) => formatLatency(info.getValue() as number | null),
        enableSorting: true,
        sortingFn: (rowA, rowB) => {
          const latencyA = rowA.getValue('latency_ms') as number | null ?? 0;
          const latencyB = rowB.getValue('latency_ms') as number | null ?? 0;
          return latencyA - latencyB;
        },
      },
      {
        accessorKey: 'user_message',
        header: 'User Message',
        cell: (info) => {
          const message = info.getValue() as string;
          return (
            <div className="message-cell" title={message}>
              {message.length > 50 ? `${message.substring(0, 50)}...` : message}
            </div>
          );
        },
        enableGlobalFilter: true,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const log = info.row.original;
          return (
            <button
              className="view-details-btn"
              onClick={() => handleViewLog(log)}
            >
              View
            </button>
          );
        },
      },
    ],
    [handleViewLog]
  );

  // Configure TanStack Table
  const table = useReactTable({
    data: logs || [],
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
      if (!filterValue) return true;
      const log = row.original;
      const searchLower = filterValue.toLowerCase();
      
      // Search across multiple fields
      const searchableFields = [
        log.provider,
        log.model_name,
        log.status,
        log.user_message,
        log.assistant_message,
        log.session_id,
        log.user_id,
      ].filter(Boolean);
      
      return searchableFields.some(field => 
        field?.toLowerCase().includes(searchLower)
      );
    },
  });

  return (
    <Layout>
      <div className="reports-container">
        <div className="reports-header">
          <h1>Reports & Analytics</h1>
          <p>View chat logs, usage statistics, and cost breakdowns</p>
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
            {loading ? (
              <div className="loading">Loading logs...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : logs.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Logs Found</h3>
                <p>No chat logs available.</p>
              </div>
            ) : table.getRowModel().rows.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>No Logs Found</h3>
                <p>No chat logs match your current search or filters.</p>
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
                    placeholder="Search logs by provider, model, status, message..."
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

                {/* Logs Table */}
                <div className="logs-table-container tanstack-table-wrapper">
                  <table className="logs-table tanstack-table">
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
                        <tr key={row.id}>
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
              </>
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
                    value={dateFilters.startDate}
                    onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    value={dateFilters.endDate}
                    onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                  />
                </div>
                <div className="filter-group">
                  <button className="clear-filters-btn" onClick={clearDateFilters}>
                    Clear Date Filters
                  </button>
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

