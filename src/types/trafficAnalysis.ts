export interface AttackTypeSummary {
  attack_name: string;
  count: number;
  risk_level: string;
  scanner: string;
}

export interface ScannerSummary {
  scanner: string;
  total_tests: number;
  high_risk: number;
  medium_risk: number;
  low_risk: number;
}

export interface RiskDistribution {
  high: number;
  medium: number;
  low: number;
  informational: number;
}

export interface AttackVectorSummary {
  xss_attempts: number;
  sql_injection_attempts: number;
  csrf_attempts: number;
}

export interface EndpointSummary {
  url: string;
  test_count: number;
}

export interface PortSummary {
  port: number;
  protocol: string;
  service: string;
}

export interface TrafficAnalysisResponse {
  campaign_id: string;
  tenant_id: string;
  total_tests: number;
  unique_attack_types: number;
  scanners_executed: string[];
  scanner_summary: ScannerSummary[];
  risk_distribution: RiskDistribution;
  attack_vectors: AttackVectorSummary;
  top_findings: AttackTypeSummary[];
  most_tested_endpoints: EndpointSummary[];
  open_ports: PortSummary[];
  data_source: string;
  generated_at: string;
}
