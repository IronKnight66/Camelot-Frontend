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
      timeout: 60000, // 60 seconds - increased for long-running operations (scans, chatbot, AI analysis)
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
      (response: AxiosResponse) => {
        // Log findings API responses for debugging
        if (response.config.url?.includes('/api/v1/findings') && !response.config.url?.includes('/stats/summary')) {
          console.log('🔍 Findings API Raw Response:', {
            url: response.config.url,
            status: response.status,
            data: response.data,
            dataKeys: Object.keys(response.data || {}),
            findingsLength: response.data?.findings?.length,
            total: response.data?.total
          });
        }
        return response;
      },
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
    const response = await this.api.post('/api/v1/scans/assessment', scanData);
    return response.data;
  }

  async getScan(scanId: string) {
    const response = await this.api.get(`/api/v1/scans/${scanId}`);
    return response.data;
  }

  async startScan(scanId: string) {
    const response = await this.api.post(`/api/v1/scans/${scanId}/start`);
    return response.data;
  }

  async getScanStatus(scanId: string) {
    const response = await this.api.get(`/api/v1/scans/${scanId}/status`);
    return response.data;
  }

  async getScanResults(scanId: string) {
    const response = await this.api.get(`/api/v1/scans/${scanId}/results`);
    return response.data;
  }

  async cancelScan(scanId: string) {
    const response = await this.api.delete(`/api/v1/scans/${scanId}`);
    return response.data;
  }

  async downloadScanResults(scanId: number): Promise<Blob> {
    const response = await this.api.get(`/api/v1/scans/${scanId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Endpoint Discovery (Subfinder scanner trigger)
  async discoverEndpoints(target: string, scanType: string = 'network', toolName: string = 'subfinder') {
    const response = await this.api.post('/api/v1/scans/discover-endpoints', {
      target,
      scan_type: scanType,
      tool_name: toolName
    });
    return response.data;
  }

  // Scan Parents API
  async getScanParentsWithScans(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const url = `/api/v1/scan-parents/with-scans${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  async getScanParentWithScans(parentId: number) {
    const response = await this.api.get(`/api/v1/scan-parents/${parentId}/scans`);
    return response.data;
  }

  async downloadParentScanResults(parentId: number): Promise<Blob> {
    const response = await this.api.get(`/api/v1/scan-parents/${parentId}/download`, {
      responseType: 'blob'
    });
    return response.data;
  }

  // Orphaned Scans API
  async getOrphanedScans(params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    // Add orphaned_only=true to filter for scans without a parent
    queryParams.append('orphaned_only', 'true');
    const queryString = queryParams.toString();
    const url = `/api/v1/scans${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  // Findings API
  async getFindings(params?: {
    page?: number;
    page_size?: number;
    severity_filter?: string;
    status_filter?: string;
    category_filter?: string;
    scan_id?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value.toString());
        }
      });
    }
    const queryString = queryParams.toString();
    const url = `/api/v1/findings${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  async getFinding(findingId: string) {
    const response = await this.api.get(`/api/v1/findings/${findingId}`);
    return response.data;
  }

  async updateFinding(findingId: string, findingData: {
    title?: string;
    description?: string;
    severity?: string;
    category?: string;
    status?: string;
    assigned_to?: string;
    due_date?: string;
    resolution_notes?: string;
    false_positive_reason?: string;
  }) {
    const response = await this.api.put(`/api/v1/findings/${findingId}`, findingData);
    return response.data;
  }

  async addFindingComment(findingId: string, commentData: {
    comment_text: string;
    comment_type?: string;
    is_internal?: boolean;
  }) {
    const response = await this.api.post(`/api/v1/findings/${findingId}/comments`, commentData);
    return response.data;
  }

  async markFindingFalsePositive(findingId: string, reason: string) {
    const response = await this.api.post(`/api/v1/findings/${findingId}/mark-false-positive`, {
      reason
    });
    return response.data;
  }

  async assignFinding(findingId: string, assignedTo: string, dueDate?: string) {
    const response = await this.api.post(`/api/v1/findings/${findingId}/assign`, {
      assigned_to: assignedTo,
      due_date: dueDate
    });
    return response.data;
  }

  async getFindingComments(findingId: string) {
    const response = await this.api.get(`/api/v1/findings/${findingId}/comments`);
    return response.data;
  }

  async triggerPocGeneration(findingId: string) {
    const response = await this.api.post(`/api/v1/findings/${findingId}/trigger-poc`);
    return response.data;
  }

  async verifyFinding(findingId: number, request?: { timeout?: number; intensity?: string }) {
    const response = await this.api.post(`/api/v1/findings/${findingId}/verify`, request || {});
    return response.data;
  }

  async getFindingsSummary(scanId?: number) {
    const params = scanId ? `?scan_id=${scanId}` : '';
    const response = await this.api.get(`/api/v1/findings/stats/summary${params}`);
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

  // Scan Types API (Public)
  async getScanTypes() {
    const response = await this.api.get('/api/v1/scan-types');
    return response.data;
  }

  async createScanType(scanTypeData: {
    name: string;
    display_name: string;
    description?: string | null;
    is_active?: boolean;
  }) {
    const response = await this.api.post('/api/v1/scan-types', scanTypeData);
    return response.data;
  }

  async updateScanType(scanTypeId: number, scanTypeData: {
    name?: string;
    display_name?: string;
    description?: string | null;
    is_active?: boolean;
  }) {
    const response = await this.api.put(`/api/v1/scan-types/${scanTypeId}`, scanTypeData);
    return response.data;
  }

  async deleteScanType(scanTypeId: number) {
    const response = await this.api.delete(`/api/v1/scan-types/${scanTypeId}`);
    return response.data;
  }

  // User Profile API
  async getCurrentUser() {
    const response = await this.api.get('/api/v1/auth/me');
    return response.data;
  }

  async updateProfile(profileData: any) {
    const response = await this.api.put('/api/v1/auth/profile', profileData);
    return response.data;
  }

  // COMMENTED OUT - Bedrock uses IAM authentication (December 2024)
  // Tenant API Keys API
  // async getTenantAPIKeys() {
  //   const response = await this.api.get('/api/v1/tenant/api-keys');
  //   return response.data;
  // }

  // async addTenantAPIKey(provider: string, apiKey: string, description?: string) {
  //   const response = await this.api.post('/api/v1/tenant/api-keys', {
  //     provider,
  //     api_key: apiKey,
  //     description
  //   });
  //   return response.data;
  // }

  // async updateTenantAPIKey(provider: string, apiKey: string, description?: string) {
  //   const response = await this.api.put(`/api/v1/tenant/api-keys/${provider}`, {
  //     api_key: apiKey,
  //     description
  //   });
  //   return response.data;
  // }

  // async deleteTenantAPIKey(provider: string) {
  //   const response = await this.api.delete(`/api/v1/tenant/api-keys/${provider}`);
  //   return response.data;
  // }

  // Tenant Management API (Super Admin Only)
  async getTenants() {
    const response = await this.api.get('/api/v1/tenants');
    return response.data;
  }

  async createTenant(tenantData: {
    name: string;
    slug: string;
    description?: string;
    contact_email?: string;
    contact_name?: string;
    subscription_plan?: string;
    subscription_status?: string;
    is_active?: boolean;
    max_scans_per_month?: number;
    max_storage_gb?: number;
  }) {
    const response = await this.api.post('/api/v1/tenants', tenantData);
    return response.data;
  }

  async updateTenant(tenantId: number, tenantData: {
    name?: string;
    slug?: string;
    description?: string;
    is_active?: boolean;
    subscription_plan?: string;
    subscription_status?: string;
    contact_email?: string;
    contact_name?: string;
  }) {
    const response = await this.api.put(`/api/v1/tenants/${tenantId}`, tenantData);
    return response.data;
  }

  async enableTenantToolForSpecificTenant(toolId: string, tenantId: number, limits?: any) {
    const response = await this.api.post(`/api/v1/tenants/${tenantId}/scanner-tools/${toolId}/enable`, limits);
    return response.data;
  }

  // COMMENTED OUT - Bedrock uses IAM authentication (December 2024)
  // async testAPIKey(provider: string) {
  //   const response = await this.api.post(`/api/v1/tenant/api-keys/${provider}/test`);
  //   return response.data;
  // }

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

  // Billing API (Admin)
  async getBillingSubscription() {
    const response = await this.api.get('/api/v1/billing/subscription');
    return response.data;
  }

  async createCheckoutSession(plan: string) {
    const response = await this.api.post('/api/v1/billing/checkout', { plan });
    return response.data;
  }

  async createPortalSession() {
    const response = await this.api.post('/api/v1/billing/portal');
    return response.data;
  }

  async getBillingPaymentMethods() {
    const response = await this.api.get('/api/v1/billing/payment-methods');
    return response.data;
  }

  async getBillingInvoices(limit: number = 10) {
    const response = await this.api.get(`/api/v1/billing/invoices?limit=${limit}`);
    return response.data;
  }

  async cancelSubscription(atPeriodEnd: boolean = true) {
    const response = await this.api.post('/api/v1/billing/subscription/cancel', {
      at_period_end: atPeriodEnd
    });
    return response.data;
  }

  // Stripe Configuration API (Super-admin)
  async getStripeConfig() {
    const response = await this.api.get('/api/v1/admin/stripe-config');
    return response.data;
  }

  async updateStripeConfig(config: {
    secret_key?: string;
    publishable_key?: string;
    webhook_secret?: string;
    price_id_basic?: string;
    price_id_professional?: string;
    price_id_enterprise?: string;
  }) {
    const response = await this.api.put('/api/v1/admin/stripe-config', config);
    return response.data;
  }

  async testStripeConnection() {
    const response = await this.api.post('/api/v1/admin/stripe-config/test');
    return response.data;
  }

  async deleteStripeConfigKey(configKey: string) {
    const response = await this.api.delete(`/api/v1/admin/stripe-config/${configKey}`);
    return response.data;
  }

  // Chatbot API
  async sendChatMessage(message: string, sessionId?: string, modelId?: string) {
    const response = await this.api.post('/api/v1/chatbot/chat', {
      message,
      session_id: sessionId,
      model_id: modelId
    });
    return response.data;
  }
  
  async getAvailableModels() {
    const response = await this.api.get('/api/v1/chatbot/models');
    return response.data;
  }
  
  async getTenantModelConfig() {
    const response = await this.api.get('/api/v1/chatbot/models/config');
    return response.data;
  }
  
  async updateTenantModelConfig(models: Array<{model_id: string, is_enabled: boolean}>) {
    const response = await this.api.put('/api/v1/chatbot/models/config', {
      models
    });
    return response.data;
  }

  async createChatSession(provider?: string) {
    const response = await this.api.post('/api/v1/chatbot/session', 
      provider ? { provider } : {}
    );
    return response.data;
  }

  async getChatSession(sessionId: string) {
    const response = await this.api.get(`/api/v1/chatbot/session/${sessionId}`);
    return response.data;
  }

  async clearChatSession(sessionId: string) {
    const response = await this.api.delete(`/api/v1/chatbot/session/${sessionId}`);
    return response.data;
  }

  async listChatSessions() {
    const response = await this.api.get('/api/v1/chatbot/sessions');
    return response.data;
  }

  async updateChatSession(sessionId: string, sessionName: string) {
    const response = await this.api.patch(`/api/v1/chatbot/session/${sessionId}`, {
      session_name: sessionName
    });
    return response.data;
  }

  async getChatPresets() {
    const response = await this.api.get('/api/v1/chatbot/presets');
    return response.data;
  }

  async updateChatPreset(presetNumber: number, data: {title: string, message: string, is_active: boolean}) {
    const response = await this.api.put(`/api/v1/chatbot/presets/${presetNumber}`, data);
    return response.data;
  }

  async resetChatPresets() {
    const response = await this.api.post('/api/v1/chatbot/presets/reset');
    return response.data;
  }

  // Chatbot Provider Settings
  async getChatbotProvider() {
    const response = await this.api.get('/api/v1/tenant/chatbot-provider');
    return response.data;
  }

  async updateChatbotProvider(provider: string) {
    const response = await this.api.put('/api/v1/tenant/chatbot-provider', {
      provider
    });
    return response.data;
  }

  // Chat Logs API
  async getChatLogs(filters?: {
    provider?: string;
    model_name?: string;
    status?: string;
    session_id?: string;
    user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const queryString = params.toString();
    const url = `/api/v1/chatbot/logs${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  async getChatLogsSummary() {
    const response = await this.api.get('/api/v1/chatbot/logs/summary');
    return response.data;
  }

  async getChatLogsCosts(startDate?: string, endDate?: string) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const queryString = params.toString();
    const url = `/api/v1/chatbot/logs/costs${queryString ? `?${queryString}` : ''}`;
    const response = await this.api.get(url);
    return response.data;
  }

  async getChatLog(logId: number) {
    const response = await this.api.get(`/api/v1/chatbot/logs/${logId}`);
    return response.data;
  }

  async searchChatLogs(query: string, limit: number = 50) {
    const response = await this.api.get(`/api/v1/chatbot/logs/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  }

  // System Prompts API (Super Admin Only)
  async getSystemPrompts() {
    const response = await this.api.get('/api/v1/admin/system-prompts');
    return response.data;
  }

  async getActiveSystemPrompt() {
    const response = await this.api.get('/api/v1/admin/system-prompts/active');
    return response.data;
  }

  async createSystemPrompt(promptData: {
    prompt_type?: string;
    prompt_text: string;
    is_active?: boolean;
  }) {
    const response = await this.api.post('/api/v1/admin/system-prompts', promptData);
    return response.data;
  }

  async updateSystemPrompt(promptId: number, promptData: {
    prompt_type?: string;
    prompt_text?: string;
    is_active?: boolean;
    change_reason?: string;
  }) {
    const response = await this.api.put(`/api/v1/admin/system-prompts/${promptId}`, promptData);
    return response.data;
  }

  async getSystemPromptHistory(promptId: number, promptType: string = 'global') {
    const response = await this.api.get(`/api/v1/admin/system-prompts/${promptId}/history?prompt_type=${promptType}`);
    return response.data;
  }

  async getTenantSystemPrompt(tenantId: number) {
    const response = await this.api.get(`/api/v1/admin/system-prompts/tenants/${tenantId}`);
    return response.data;
  }

  async listTenantSystemPrompts(tenantId: number) {
    const response = await this.api.get(`/api/v1/admin/system-prompts/tenants/${tenantId}/all`);
    return response.data;
  }

  async createTenantSystemPrompt(tenantId: number, promptData: {
    prompt_type?: string;
    prompt_text: string;
    is_active?: boolean;
  }) {
    const response = await this.api.post(`/api/v1/admin/system-prompts/tenants/${tenantId}`, promptData);
    return response.data;
  }

  async updateTenantSystemPrompt(tenantId: number, promptData: {
    prompt_type?: string;
    prompt_text?: string;
    is_active?: boolean;
    change_reason?: string;
  }) {
    const response = await this.api.put(`/api/v1/admin/system-prompts/tenants/${tenantId}`, promptData);
    return response.data;
  }

  // ============================================================================
  // Tenant Configuration - Severity Levels
  // ============================================================================

  async getSeverityLevels(includeInactive: boolean = false) {
    const response = await this.api.get('/api/v1/tenant-config/severity-levels', {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  }

  async createSeverityLevel(data: {
    label: string;
    value: string;
    color: string;
    sort_order: number;
  }) {
    const response = await this.api.post('/api/v1/tenant-config/severity-levels', data);
    return response.data;
  }

  async updateSeverityLevel(id: number, data: {
    label?: string;
    color?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const response = await this.api.put(`/api/v1/tenant-config/severity-levels/${id}`, data);
    return response.data;
  }

  async deleteSeverityLevel(id: number) {
    const response = await this.api.delete(`/api/v1/tenant-config/severity-levels/${id}`);
    return response.data;
  }

  async getSeverityLevelUsage(value: string) {
    const response = await this.api.get(`/api/v1/tenant-config/severity-levels/${value}/usage`);
    return response.data;
  }

  // ============================================================================
  // Tenant Configuration - Status Levels
  // ============================================================================

  async getStatusLevels(includeInactive: boolean = false) {
    const response = await this.api.get('/api/v1/tenant-config/status-levels', {
      params: { include_inactive: includeInactive }
    });
    return response.data;
  }

  async createStatusLevel(data: {
    label: string;
    value: string;
    color: string;
    sort_order: number;
  }) {
    const response = await this.api.post('/api/v1/tenant-config/status-levels', data);
    return response.data;
  }

  async updateStatusLevel(id: number, data: {
    label?: string;
    color?: string;
    sort_order?: number;
    is_active?: boolean;
  }) {
    const response = await this.api.put(`/api/v1/tenant-config/status-levels/${id}`, data);
    return response.data;
  }

  async deleteStatusLevel(id: number) {
    const response = await this.api.delete(`/api/v1/tenant-config/status-levels/${id}`);
    return response.data;
  }

  async getStatusLevelUsage(value: string) {
    const response = await this.api.get(`/api/v1/tenant-config/status-levels/${value}/usage`);
    return response.data;
  }

  // ============================================================================
  // Tenant Configuration - Migration
  // ============================================================================

  async migrateFindingsLevel(oldValue: string, newValue: string, levelType: 'severity' | 'status') {
    const response = await this.api.post('/api/v1/tenant-config/migrate-findings', {
      old_value: oldValue,
      new_value: newValue,
      level_type: levelType
    });
    return response.data;
  }

  async initializeTenantDefaults() {
    const response = await this.api.post('/api/v1/tenant-config/initialize-defaults');
    return response.data;
  }

  // ============================================================================
  // Reports
  // ============================================================================

  async downloadReport(reportUrl: string) {
    const response = await this.api.get(reportUrl, {
      responseType: 'blob'
    });
    return response.data;
  }
}

export default new ApiService();
