/**
 * Subscription Plan API Service
 *
 * Provides methods for interacting with subscription plan endpoints:
 * - Public endpoints: Available to all authenticated users
 * - Admin endpoints: Super-admin only
 */

import axios, { AxiosInstance } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import {
  SubscriptionPlan,
  SubscriptionPlanDetail,
  SubscriptionPlanListResponse,
  SubscriptionPlanAdminListResponse,
  SubscriptionPlanCreate,
  SubscriptionPlanUpdate,
  PlanReorderRequest,
  PlanValidationResponse
} from '../types/subscriptionPlan';

class PlanApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = process.env.NODE_ENV === 'development' ? '/' : (process.env.REACT_APP_API_URL || '/');
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      async (config) => {
        try {
          const session = await fetchAuthSession({ forceRefresh: false });
          const token = session.tokens?.idToken || session.tokens?.accessToken;

          if (token) {
            const tokenString = typeof token === 'string' ? token : token.toString();
            config.headers.Authorization = `Bearer ${tokenString}`;
          }
        } catch (error) {
          console.error('Error fetching session:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          console.error('Unauthorized access to plan API');
        } else if (error.response?.status === 403) {
          console.error('Forbidden: Insufficient permissions for plan API');
        }
        return Promise.reject(error);
      }
    );
  }

  // ============================================================================
  // PUBLIC ENDPOINTS - Available to all authenticated users
  // ============================================================================

  /**
   * Get all active subscription plans for public display (billing page)
   */
  async getPublicPlans(): Promise<SubscriptionPlan[]> {
    const response = await this.api.get<SubscriptionPlanListResponse>(
      '/api/v1/subscription-plans/public'
    );
    return response.data.plans;
  }

  /**
   * Get a specific plan by ID (public view)
   */
  async getPublicPlanById(planId: number): Promise<SubscriptionPlan> {
    const response = await this.api.get<SubscriptionPlan>(
      `/api/v1/subscription-plans/public/${planId}`
    );
    return response.data;
  }

  /**
   * Get a specific plan by slug (public view)
   */
  async getPublicPlanBySlug(slug: string): Promise<SubscriptionPlan> {
    const response = await this.api.get<SubscriptionPlan>(
      `/api/v1/subscription-plans/public/slug/${slug}`
    );
    return response.data;
  }

  /**
   * Validate if a plan exists and is active
   */
  async validatePlan(planName: string): Promise<PlanValidationResponse> {
    const response = await this.api.get<PlanValidationResponse>(
      `/api/v1/subscription-plans/validate/${planName}`
    );
    return response.data;
  }

  // ============================================================================
  // ADMIN ENDPOINTS - Super-admin only
  // ============================================================================

  /**
   * Get all subscription plans (admin view with full details)
   */
  async getAllPlans(activeOnly: boolean = false, skip: number = 0, limit: number = 100): Promise<SubscriptionPlanAdminListResponse> {
    const response = await this.api.get<SubscriptionPlanAdminListResponse>(
      '/api/v1/subscription-plans/admin',
      {
        params: { active_only: activeOnly, skip, limit }
      }
    );
    return response.data;
  }

  /**
   * Get a specific plan by ID (admin view with full details)
   */
  async getPlanById(planId: number): Promise<SubscriptionPlanDetail> {
    const response = await this.api.get<SubscriptionPlanDetail>(
      `/api/v1/subscription-plans/admin/${planId}`
    );
    return response.data;
  }

  /**
   * Create a new subscription plan
   */
  async createPlan(planData: SubscriptionPlanCreate): Promise<SubscriptionPlanDetail> {
    const response = await this.api.post<SubscriptionPlanDetail>(
      '/api/v1/subscription-plans/admin',
      planData
    );
    return response.data;
  }

  /**
   * Update an existing subscription plan
   */
  async updatePlan(planId: number, planData: SubscriptionPlanUpdate): Promise<SubscriptionPlanDetail> {
    const response = await this.api.put<SubscriptionPlanDetail>(
      `/api/v1/subscription-plans/admin/${planId}`,
      planData
    );
    return response.data;
  }

  /**
   * Delete a subscription plan (hard delete)
   */
  async deletePlan(planId: number): Promise<void> {
    await this.api.delete(`/api/v1/subscription-plans/admin/${planId}`);
  }

  /**
   * Deactivate a plan (soft delete)
   */
  async deactivatePlan(planId: number): Promise<SubscriptionPlanDetail> {
    const response = await this.api.post<SubscriptionPlanDetail>(
      `/api/v1/subscription-plans/admin/${planId}/deactivate`
    );
    return response.data;
  }

  /**
   * Activate a previously deactivated plan
   */
  async activatePlan(planId: number): Promise<SubscriptionPlanDetail> {
    const response = await this.api.post<SubscriptionPlanDetail>(
      `/api/v1/subscription-plans/admin/${planId}/activate`
    );
    return response.data;
  }

  /**
   * Reorder plans (update sort_order for multiple plans)
   */
  async reorderPlans(planOrders: PlanReorderRequest): Promise<SubscriptionPlanDetail[]> {
    const response = await this.api.post<SubscriptionPlanDetail[]>(
      '/api/v1/subscription-plans/admin/reorder',
      planOrders
    );
    return response.data;
  }
}

// Export singleton instance
export const planApi = new PlanApiService();

// Also export the class for testing
export default PlanApiService;
