/**
 * Finding types and interfaces
 */

export enum VerificationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  VERIFIED = 'verified',
  FAILED = 'failed',
  FALSE_POSITIVE = 'false_positive'
}

export interface VerificationEvidence {
  payloads?: string[];
  responses?: any[];
  screenshots?: string[];
  exploitation_steps?: string[];
  confidence_score?: number;
  false_positive_reason?: string;
}

export interface VerificationRequest {
  timeout?: number;
  intensity?: string;
}

export interface VerificationResponse {
  finding_id: number;
  status: string;
  request_id?: string;
  estimated_time?: number;
  message: string;
}

export interface Finding {
  id: number;
  title: string;
  description: string;
  severity: string;
  category: string;
  status: string;
  scan_id: number;
  vulnerability_type?: string;
  cve_id?: string;
  cwe_id?: string;
  cvss_score?: number;
  target_url?: string;
  target_ip?: string;
  target_port?: number;
  file_path?: string;
  line_number?: number;
  proof_of_concept?: string;
  remediation_steps?: string;
  references?: string[];
  risk_score?: number;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  tenant_id: string;
  
  // POC fields
  poc_status?: string;
  poc_confidence_score?: number;
  poc_generation_attempts?: number;
  
  // Verification fields
  verification_status?: string;
  verification_started_at?: string;
  verification_completed_at?: string;
  verification_evidence?: VerificationEvidence;
  verification_lambda_request_id?: string;
}

