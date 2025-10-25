// src/services/api.ts
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const session = await fetchAuthSession();
          const token = session.tokens?.accessToken?.toString();
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.log('No valid session found');
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
        if (error.response?.status === 401) {
          // Token expired or invalid, redirect to login
          window.location.href = '/login';
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
}

export default new ApiService();
