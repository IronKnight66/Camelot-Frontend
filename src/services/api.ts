// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    // In development, use relative path to leverage setupProxy.js
    // In production, use the API gateway URL from environment
    const baseURL = process.env.NODE_ENV === 'development' ? '/' : (process.env.REACT_APP_API_URL || '/');
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 30000, // Increased from 10000ms to 30000ms (30 seconds)
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const session = await fetchAuthSession({ forceRefresh: false });
          
          // In production behind API Gateway Cognito authorizer, prefer ID token.
          // API Gateway Cognito authorizer validates ID tokens by default.
          // Always use ID token for API Gateway
          let token = session.tokens?.idToken || session.tokens?.accessToken;
          let tokenType = session.tokens?.idToken ? 'ID' : 'Access';
          
          if (token) {
            // In AWS Amplify v6, tokens are JWT objects with a toString() method
            // that returns the actual JWT string
            let tokenString: string;
            
            if (typeof token === 'string') {
              tokenString = token;
            } else {
              tokenString = token.toString();
            }
            
            // Verify the token is a valid JWT format (starts with eyJ)
            if (!tokenString.startsWith('eyJ')) {
              console.error('Token does not look like a valid JWT:', tokenString.substring(0, 50));
            }
            
            config.headers.Authorization = `Bearer ${tokenString}`;
            console.log(`✓ Added ${tokenType} token to request:`, {
              url: config.url,
              tokenLength: tokenString.length,
              tokenStart: tokenString.substring(0, 20),
              tokenEnd: tokenString.substring(tokenString.length - 20)
            });
          } else {
            console.warn('⚠️ No token found in session');
            console.warn('Session tokens:', session.tokens ? Object.keys(session.tokens) : 'no tokens');
          }
        } catch (error: any) {
          console.error('Error fetching session:', error?.message || error);
          // Don't block the request if session fetch fails - let backend handle auth
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.error('Request timeout:', {
            url: error.config?.url,
            timeout: error.config?.timeout,
            message: 'The request took too long to complete. The server may be slow or unavailable.'
          });
        } else if (error.response?.status === 401) {
          console.error('401 Unauthorized error:', error.response?.data);
          console.warn('Token may be expired or user may not have required permissions');
          // Don't redirect to login automatically - let the app handle it
        } else if (error.response?.status === 403) {
          console.error('403 Forbidden error:', error.response?.data);
        }
        return Promise.reject(error);
      }
    );
  }

  // Scans API
  async getScans() {
    const response = await this.api.get('/api/v1/scans');
    return response.data;
  }

  async createScan(scanData: any) {
    const response = await this.api.post('/api/v1/scans', scanData);
    return response.data;
  }

  async getScan(scanId: string) {
    const response = await this.api.get(`/api/v1/scans/${scanId}`);
    return response.data;
  }

  // Findings API
  async getFindings() {
    const response = await this.api.get('/api/v1/findings');
    return response.data;
  }

  async getFinding(findingId: string) {
    const response = await this.api.get(`/api/v1/findings/${findingId}`);
    return response.data;
  }

  // AI Analysis API
  async analyzeFinding(findingId: string, analysisData: any) {
    const response = await this.api.post(`/api/v1/ai/analyze/${findingId}`, analysisData);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await this.api.get('/health');
    return response.data;
  }

  // Scanner Tools API - Super Admin
  async getScannerTools(params?: any) {
    const response = await this.api.get('/api/v1/admin/scanner-tools', { params });
    return response.data;
  }

  async createScannerTool(toolData: any) {
    const response = await this.api.post('/api/v1/admin/scanner-tools', toolData);
    return response.data;
  }

  async getScannerTool(toolId: string) {
    const response = await this.api.get(`/api/v1/admin/scanner-tools/${toolId}`);
    return response.data;
  }

  async updateScannerTool(toolId: string, toolData: any) {
    const response = await this.api.put(`/api/v1/admin/scanner-tools/${toolId}`, toolData);
    return response.data;
  }

  async deleteScannerTool(toolId: string) {
    const response = await this.api.delete(`/api/v1/admin/scanner-tools/${toolId}`);
    return response.data;
  }

  // Scanner Tools API - Tenant Admin
  async getTenantScannerTools(isEnabled?: boolean) {
    const response = await this.api.get('/api/v1/scanner-tools', { 
      params: { is_enabled: isEnabled } 
    });
    return response.data;
  }

  async enableTenantTool(toolId: string, limits?: any) {
    const response = await this.api.post(`/api/v1/scanner-tools/${toolId}/enable`, limits);
    return response.data;
  }

  async disableTenantTool(toolId: string) {
    const response = await this.api.post(`/api/v1/scanner-tools/${toolId}/disable`);
    return response.data;
  }

  async deleteTenantTool(toolId: string) {
    const response = await this.api.delete(`/api/v1/scanner-tools/${toolId}`);
    return response.data;
  }

  async updateTenantToolLimits(toolId: string, limits: any) {
    const response = await this.api.put(`/api/v1/scanner-tools/${toolId}/limits`, limits);
    return response.data;
  }

  // Scanner Tools API - Regular Users
  async getMyScannerTools() {
    const response = await this.api.get('/api/v1/scanner-tools/my-tools');
    return response.data;
  }

  async activateScannerTool(toolId: string, preferences?: any) {
    const response = await this.api.post(`/api/v1/scanner-tools/${toolId}/activate`, preferences);
    return response.data;
  }

  async deactivateScannerTool(toolId: string) {
    const response = await this.api.post(`/api/v1/scanner-tools/${toolId}/deactivate`);
    return response.data;
  }

  // User Profile API
  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(profileData: any) {
    const response = await this.api.put('/api/v1/auth/profile', profileData);
    return response.data;
  }

  // Tenant API Keys API
  async getTenantAPIKeys() {
    const response = await this.api.get('/api/v1/tenant/api-keys');
    return response.data;
  }

  async addTenantAPIKey(provider: string, apiKey: string, description?: string) {
    const response = await this.api.post('/api/v1/tenant/api-keys', {
      provider,
      api_key: apiKey,
      description
    });
    return response.data;
  }

  async updateTenantAPIKey(provider: string, apiKey: string, description?: string) {
    const response = await this.api.put(`/api/v1/tenant/api-keys/${provider}`, {
      api_key: apiKey,
      description
    });
    return response.data;
  }

  async deleteTenantAPIKey(provider: string) {
    const response = await this.api.delete(`/api/v1/tenant/api-keys/${provider}`);
    return response.data;
  }

  // Tenant Management API (Super Admin Only)
  async getTenants() {
    const response = await this.api.get('/api/v1/tenants');
    return response.data;
  }

  async enableTenantToolForSpecificTenant(toolId: string, tenantId: number, limits?: any) {
    const response = await this.api.post(`/api/v1/tenants/${tenantId}/scanner-tools/${toolId}/enable`, limits);
    return response.data;
  }

  async testAPIKey(provider: string) {
    const response = await this.api.post(`/api/v1/tenant/api-keys/${provider}/test`);
    return response.data;
  }

  // User Management API
  async getUsers() {
    const response = await this.api.get('/api/v1/users');
    return response.data;
  }

  async createUser(userData: {
    email: string;
    role: 'admin' | 'user' | 'viewer';
    first_name?: string;
    last_name?: string;
  }) {
    const response = await this.api.post('/api/v1/users', userData);
    return response.data;
  }

  async getUser(userId: string) {
    const response = await this.api.get(`/api/v1/users/${userId}`);
    return response.data;
  }

  async updateUserRole(userId: string, role: 'admin' | 'user' | 'viewer') {
    const response = await this.api.put(`/api/v1/users/${userId}/role`, { role });
    return response.data;
  }

  async updateUserStatus(userId: string, isActive: boolean) {
    const response = await this.api.put(`/api/v1/users/${userId}/status`, { is_active: isActive });
    return response.data;
  }

  async forcePasswordReset(userId: string) {
    const response = await this.api.post(`/api/v1/users/${userId}/reset-password`);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.api.delete(`/api/v1/users/${userId}`);
    return response.data;
  }
}

export default new ApiService();
