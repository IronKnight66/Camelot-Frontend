// src/types/assessment.ts

export type TestType = 'network' | 'dast' | 'web' | 'server';

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

