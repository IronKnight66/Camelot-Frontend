/**
 * Asset type definitions for the Camelot Security Platform
 */

export type AssetType = 'web' | 'ip' | 'domain' | 'api' | 'cloud' | 'server';
export type AssetCriticality = 'critical' | 'high' | 'medium' | 'low';
export type AssetStatus = 'active' | 'inactive' | 'archived';
export type AssetEnvironment = 'production' | 'staging' | 'development' | 'test';

export interface Asset {
  id: number;
  asset_id: string;
  name: string;
  asset_type: AssetType;
  url?: string;
  ip_address?: string;
  domain?: string;
  port?: number;
  owner?: string;
  department?: string;
  criticality: AssetCriticality;
  environment?: AssetEnvironment;
  status: AssetStatus;
  description?: string;
  tags?: string[];
  asset_metadata?: Record<string, any>;
  last_scanned_at?: string;
  scan_count: number;
  vulnerability_count?: number;
  critical_vulnerabilities?: number;
  high_vulnerabilities?: number;
  medium_vulnerabilities?: number;
  low_vulnerabilities?: number;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface AssetCreate {
  name: string;
  asset_type: AssetType;
  url?: string;
  ip_address?: string;
  domain?: string;
  port?: number;
  owner?: string;
  department?: string;
  criticality: AssetCriticality;
  environment?: AssetEnvironment;
  status: AssetStatus;
  description?: string;
  tags?: string[];
  asset_metadata?: Record<string, any>;
}

export interface AssetUpdate {
  name?: string;
  asset_type?: AssetType;
  url?: string;
  ip_address?: string;
  domain?: string;
  port?: number;
  owner?: string;
  department?: string;
  criticality?: AssetCriticality;
  environment?: AssetEnvironment;
  status?: AssetStatus;
  description?: string;
  tags?: string[];
  asset_metadata?: Record<string, any>;
}

export interface AssetListResponse {
  assets: Asset[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AssetStatistics {
  asset_id: number;
  total_scans: number;
  completed_scans: number;
  failed_scans: number;
  total_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  last_scan_date?: string;
  avg_scan_duration?: number;
}

export interface AssetFilters {
  page?: number;
  page_size?: number;
  asset_type?: AssetType;
  status?: AssetStatus;
  criticality?: AssetCriticality;
  environment?: AssetEnvironment;
  search?: string;
}

