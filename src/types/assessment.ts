// src/types/assessment.ts

export type TestType = string;

export interface ScanType {
  id: number;
  name: string;
  display_name: string;
  description: string | null;
  is_active: boolean;
}

export interface Endpoint {
  url: string;
  isAttackable: boolean;
  selected?: boolean;
}

export interface ToolCredentials {
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface ToolSetting {
  enabled?: boolean;
  blockedUrls?: string[];
}

export interface GlobalToolSettings {
  rateLimiting?: number;
  credentials?: ToolCredentials;
  customHeaders?: { [key: string]: string };
}

export interface AssessmentFormData {
  websiteUrl: string;
  testType: TestType | '';
  endpoints: Endpoint[];
  toolSettings: { [toolId: string]: ToolSetting };
  globalToolSettings: GlobalToolSettings;
  assetId?: number | null;
  useExistingAsset?: boolean;
  authorizationAccepted?: boolean;
}

export interface ScannerTool {
  id: string;
  tenantId: string;
  scannerToolId: number;
  isEnabled: boolean;
  name: string;
  displayName: string;
  description: string;
  category: string;
  dockerImage: string;
  dockerTag: string;
  version?: string;
  isActive: boolean;
  pricingTier: string;
  supportedScanTypes?: string[];
}

export interface ChatbotAssessmentData {
  websiteUrl: string;
  testType: TestType;
  recommendedTools: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
  }>;
  discoveredEndpoints: Endpoint[];
  suggestedSettings?: { [toolId: string]: ToolSetting };
}

