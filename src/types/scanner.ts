// src/types/scanner.ts

export type ScannerCategory = 
  | 'Web Application'
  | 'Network'
  | 'Infrastructure'
  | 'Code Analysis'
  | 'Database'
  | 'Custom';

export type PricingTier = 
  | 'Free'
  | 'Basic'
  | 'Professional'
  | 'Enterprise';

export type ScanType = 
  | 'Vulnerability'
  | 'Compliance'
  | 'Security'
  | 'Performance';

export type RequiredPermission = 
  | 'network_access'
  | 'file_access'
  | 'database_access'
  | 'infrastructure_access';

export interface ScannerTool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: ScannerCategory;
  dockerImage: string;
  dockerTag: string;
  awsEcrRepository?: string;
  executionMethod?: string; // 'mcp', 'orchestration', or 'both'
  version: string;
  latestVersion: string;
  configSchema: Record<string, any>;
  defaultSettings: Record<string, any>;
  pricingTier: PricingTier;
  isActive: boolean;
  supportedScanTypes: ScanType[];
  requiredPermissions: RequiredPermission[];
  documentationUrl: string;
  helpText: string;
  scanCount?: number;
  recentScanId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TenantToolSettings {
  toolId: string;
  isEnabled: boolean;
  usageLimit?: number;
  currentUsage: number;
  settings: Record<string, any>;
  lastResetDate: string;
  enabledAt?: string;
  disabledAt?: string;
}

export interface UserToolPreferences {
  toolId: string;
  isActivated: boolean;
  preferences: Record<string, any>;
  activatedAt?: string;
  deactivatedAt?: string;
  timesUsed: number;
  lastUsedAt?: string;
}

export interface ScannerToolsListParams {
  page?: number;
  pageSize?: number;
  category?: ScannerCategory;
  isActive?: boolean;
  pricingTier?: PricingTier;
  search?: string;
}

export interface ScannerToolsListResponse {
  tools: ScannerTool[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

