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
import { Asset, AssetListResponse, AssetFilters, AssetCreate } from '../types/asset';
import AssetFormModal from './assets/AssetFormModal';
import './Assets.css';

const Assets: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssets, setTotalAssets] = useState(0);
  const [pageSize] = useState(20);
  
  // Filters
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [criticalityFilter, setCriticalityFilter] = useState<string>('');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // TanStack Table state
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    loadAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, assetTypeFilter, statusFilter, criticalityFilter, environmentFilter, searchTerm]);

  const loadAssets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const filters: AssetFilters = {
        page: currentPage,
        page_size: pageSize,
      };
      
      if (assetTypeFilter) filters.asset_type = assetTypeFilter as any;
      if (statusFilter) filters.status = statusFilter as any;
      if (criticalityFilter) filters.criticality = criticalityFilter as any;
      if (environmentFilter) filters.environment = environmentFilter as any;
      if (searchTerm) filters.search = searchTerm;
      
      const response: AssetListResponse = await api.getAssets(filters);
      
      console.log('📦 Assets Response:', response);
      
      setAssets(response.assets || []);
      setTotalPages(response.total_pages || 1);
      setTotalAssets(response.total || 0);
    } catch (err: any) {
      console.error('❌ Error loading assets:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setAssetTypeFilter('');
    setStatusFilter('');
    setCriticalityFilter('');
    setEnvironmentFilter('');
    setSearchTerm('');
    setColumnFilters([]);
    setSorting([]);
    setCurrentPage(1);
  };

  const handleViewDetails = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
  }, []);

  const handleEdit = useCallback((asset: Asset) => {
    setSelectedAsset(asset);
    setShowEditModal(true);
  }, []);

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Are you sure you want to delete asset "${asset.name}"?`)) {
      return;
    }
    
    try {
      await api.deleteAsset(asset.id);
      alert('Asset deleted successfully');
      loadAssets();
    } catch (err: any) {
      console.error('❌ Error deleting asset:', err);
      alert(err.response?.data?.detail || 'Failed to delete asset');
    }
  };

  const handleStartScan = (asset: Asset) => {
    // Navigate to assessment page with asset pre-selected
    window.location.href = `/assessment?asset_id=${asset.id}`;
  };

  const closeDetailsModal = () => {
    setSelectedAsset(null);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    loadAssets();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedAsset(null);
    loadAssets();
  };

  const handleCreateAsset = async (assetData: AssetCreate) => {
    try {
      await api.createAsset(assetData);
      alert('✅ Asset created successfully!');
      loadAssets();
    } catch (err: any) {
      console.error('❌ Error creating asset:', err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  const handleUpdateAsset = async (assetData: AssetCreate) => {
    if (!selectedAsset) return;
    
    try {
      await api.updateAsset(selectedAsset.id, assetData);
      alert('✅ Asset updated successfully!');
      loadAssets();
    } catch (err: any) {
      console.error('❌ Error updating asset:', err);
      throw err; // Re-throw to let the modal handle it
    }
  };

  const getAssetTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      web: '🌐',
      ip: '🔢',
      domain: '🏰',
      api: '⚙️',
      cloud: '☁️',
      server: '🖥️',
    };
    return icons[type] || '📦';
  };

  const getCriticalityColor = (criticality: string) => {
    const colors: Record<string, string> = {
      critical: '#ff0000',
      high: '#ff6b00',
      medium: '#ffa500',
      low: '#00ff00',
    };
    return colors[criticality] || '#888';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; className: string }> = {
      active: { label: 'Active', className: 'status-active' },
      inactive: { label: 'Inactive', className: 'status-inactive' },
      archived: { label: 'Archived', className: 'status-archived' },
    };
    return badges[status] || { label: status, className: '' };
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Define table columns
  const columns = useMemo<ColumnDef<Asset>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <div className="asset-name-cell">
            <span className="asset-icon">{getAssetTypeIcon(row.original.asset_type)}</span>
            <span className="asset-name">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'asset_type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="asset-type-badge">{row.original.asset_type}</span>
        ),
      },
      {
        accessorKey: 'url',
        header: 'URL/IP',
        cell: ({ row }) => (
          <span className="asset-target">
            {row.original.url || row.original.ip_address || row.original.domain || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'owner',
        header: 'Owner',
        cell: ({ row }) => row.original.owner || '-',
      },
      {
        accessorKey: 'criticality',
        header: 'Criticality',
        cell: ({ row }) => (
          <span
            className="criticality-badge"
            style={{ color: getCriticalityColor(row.original.criticality) }}
          >
            {row.original.criticality}
          </span>
        ),
      },
      {
        accessorKey: 'environment',
        header: 'Environment',
        cell: ({ row }) => row.original.environment || '-',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const badge = getStatusBadge(row.original.status);
          return <span className={`status-badge ${badge.className}`}>{badge.label}</span>;
        },
      },
      {
        accessorKey: 'last_scanned_at',
        header: 'Last Scan',
        cell: ({ row }) => formatDate(row.original.last_scanned_at),
      },
      {
        accessorKey: 'scan_count',
        header: 'Scans',
        cell: ({ row }) => row.original.scan_count || 0,
      },
      {
        accessorKey: 'vulnerability_count',
        header: 'Vulnerabilities',
        cell: ({ row }) => {
          const total = row.original.vulnerability_count || 0;
          const critical = row.original.critical_vulnerabilities || 0;
          const high = row.original.high_vulnerabilities || 0;
          const medium = row.original.medium_vulnerabilities || 0;
          const low = row.original.low_vulnerabilities || 0;
          
          if (total === 0) {
            return <span className="vuln-count-zero">0</span>;
          }
          
          return (
            <div className="vuln-breakdown">
              <span className="vuln-total">{total}</span>
              <div className="vuln-details">
                {critical > 0 && <span className="vuln-critical" title="Critical">{critical}C</span>}
                {high > 0 && <span className="vuln-high" title="High">{high}H</span>}
                {medium > 0 && <span className="vuln-medium" title="Medium">{medium}M</span>}
                {low > 0 && <span className="vuln-low" title="Low">{low}L</span>}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="action-buttons">
            <button
              className="btn-details"
              onClick={() => handleViewDetails(row.original)}
              title="View Details"
            >
              Details
            </button>
            <button
              className="btn-edit"
              onClick={() => handleEdit(row.original)}
              title="Edit Asset"
            >
              Edit
            </button>
            <button
              className="btn-scan"
              onClick={() => handleStartScan(row.original)}
              title="Start Scan"
            >
              Scan
            </button>
            <button
              className="btn-delete"
              onClick={() => handleDelete(row.original)}
              title="Delete Asset"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [handleViewDetails, handleEdit]
  );

  const table = useReactTable({
    data: assets,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  return (
    <Layout>
      <div className="assets-container">
        <div className="assets-header page-header">
          <h1 style={{ color: '#ffffff' }}>Asset Management</h1>
          <p>Register and manage assets for security assessments</p>
          <div className="assets-header-actions">
            <button className="btn-create-asset" onClick={() => setShowCreateModal(true)}>
              Create Asset
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <input
              type="text"
              placeholder="🔍 Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <select
              value={assetTypeFilter}
              onChange={(e) => setAssetTypeFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="web">Web</option>
              <option value="ip">IP</option>
              <option value="domain">Domain</option>
              <option value="api">API</option>
              <option value="cloud">Cloud</option>
              <option value="server">Server</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Criticality</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <select
              value={environmentFilter}
              onChange={(e) => setEnvironmentFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Environments</option>
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
              <option value="test">Test</option>
            </select>
          </div>

          <button onClick={clearFilters} className="btn-clear-filters">
            Clear Filters
          </button>
        </div>

        {/* Stats */}
        <div className="assets-stats">
          <div className="stat-card">
            <span className="stat-label">Total Assets</span>
            <span className="stat-value">{totalAssets}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Current Page</span>
            <span className="stat-value">{currentPage} / {totalPages}</span>
          </div>
        </div>

        {/* Loading/Error States */}
        {loading && <div className="loading">Loading assets...</div>}
        {error && <div className="error-message">{error}</div>}

        {/* Assets Table */}
        {!loading && !error && (
          <>
            <div className="table-container">
              <table className="assets-table">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id}>
                          {header.isPlaceholder ? null : (
                            <div
                              {...{
                                className: header.column.getCanSort()
                                  ? 'sortable-header'
                                  : '',
                                onClick: header.column.getToggleSortingHandler(),
                              }}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: ' 🔼',
                                desc: ' 🔽',
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          )}
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
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ⏮️ First
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="pagination-btn"
              >
                ◀️ Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Next ▶️
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="pagination-btn"
              >
                Last ⏭️
              </button>
            </div>
          </>
        )}

        {/* Asset Details Modal */}
        {selectedAsset && !showEditModal && (
          <div className="modal-overlay" onClick={closeDetailsModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>
                  {getAssetTypeIcon(selectedAsset.asset_type)} {selectedAsset.name}
                </h2>
                <button className="modal-close" onClick={closeDetailsModal}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <div className="asset-details">
                  <div className="detail-row">
                    <span className="detail-label">Asset ID:</span>
                    <span className="detail-value">{selectedAsset.asset_id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type:</span>
                    <span className="detail-value">{selectedAsset.asset_type}</span>
                  </div>
                  {selectedAsset.url && (
                    <div className="detail-row">
                      <span className="detail-label">URL:</span>
                      <span className="detail-value">{selectedAsset.url}</span>
                    </div>
                  )}
                  {selectedAsset.ip_address && (
                    <div className="detail-row">
                      <span className="detail-label">IP Address:</span>
                      <span className="detail-value">{selectedAsset.ip_address}</span>
                    </div>
                  )}
                  {selectedAsset.domain && (
                    <div className="detail-row">
                      <span className="detail-label">Domain:</span>
                      <span className="detail-value">{selectedAsset.domain}</span>
                    </div>
                  )}
                  {selectedAsset.port && (
                    <div className="detail-row">
                      <span className="detail-label">Port:</span>
                      <span className="detail-value">{selectedAsset.port}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Owner:</span>
                    <span className="detail-value">{selectedAsset.owner || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Department:</span>
                    <span className="detail-value">{selectedAsset.department || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Criticality:</span>
                    <span
                      className="detail-value"
                      style={{ color: getCriticalityColor(selectedAsset.criticality) }}
                    >
                      {selectedAsset.criticality}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Environment:</span>
                    <span className="detail-value">{selectedAsset.environment || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Status:</span>
                    <span className="detail-value">{selectedAsset.status}</span>
                  </div>
                  {selectedAsset.description && (
                    <div className="detail-row">
                      <span className="detail-label">Description:</span>
                      <span className="detail-value">{selectedAsset.description}</span>
                    </div>
                  )}
                  <div className="detail-row">
                    <span className="detail-label">Scan Count:</span>
                    <span className="detail-value">{selectedAsset.scan_count}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Last Scanned:</span>
                    <span className="detail-value">{formatDate(selectedAsset.last_scanned_at)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(selectedAsset.created_at)}</span>
                  </div>
                  {selectedAsset.tags && selectedAsset.tags.length > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Tags:</span>
                      <span className="detail-value">
                        {selectedAsset.tags.map((tag, idx) => (
                          <span key={idx} className="tag-badge">
                            {tag}
                          </span>
                        ))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-edit" onClick={() => handleEdit(selectedAsset)}>
                  Edit
                </button>
                <button className="btn-scan" onClick={() => handleStartScan(selectedAsset)}>
                  Start Scan
                </button>
                <button className="btn-close" onClick={closeDetailsModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Asset Modal */}
        {showCreateModal && (
          <AssetFormModal
            onClose={closeCreateModal}
            onSave={handleCreateAsset}
          />
        )}

        {/* Edit Asset Modal */}
        {showEditModal && selectedAsset && (
          <AssetFormModal
            asset={selectedAsset}
            onClose={closeEditModal}
            onSave={handleUpdateAsset}
          />
        )}
      </div>
    </Layout>
  );
};

export default Assets;

