/**
 * Subscription Plan TypeScript interfaces
 * Matches backend Pydantic schemas
 */

/**
 * Base subscription plan interface matching SubscriptionPlanPublic from backend
 */
export interface SubscriptionPlan {
  id: number;
  name: string;
  slug: string;
  display_name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  highlight: boolean;
  features: Record<string, any>;
  limits: Record<string, any>;
  price_amount: number | null;
  price_currency: string;
  price_interval: string;
  sort_order: number;
}

/**
 * Full plan details (admin view) matching SubscriptionPlanResponse from backend
 */
export interface SubscriptionPlanDetail extends SubscriptionPlan {
  stripe_price_id: string | null;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

/**
 * API response for list of public plans
 */
export interface SubscriptionPlanListResponse {
  plans: SubscriptionPlan[];
}

/**
 * API response for list of plans (admin view)
 */
export interface SubscriptionPlanAdminListResponse {
  plans: SubscriptionPlanDetail[];
  total: number;
}

/**
 * Request payload for creating a new plan
 */
export interface SubscriptionPlanCreate {
  name: string;
  slug: string;
  display_name: string;
  description?: string | null;
  stripe_price_id?: string | null;
  icon?: string | null;
  color?: string | null;
  highlight?: boolean;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  price_amount?: number | null;
  price_currency?: string;
  price_interval?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Request payload for updating an existing plan
 */
export interface SubscriptionPlanUpdate {
  name?: string;
  slug?: string;
  display_name?: string;
  description?: string | null;
  stripe_price_id?: string | null;
  icon?: string | null;
  color?: string | null;
  highlight?: boolean;
  features?: Record<string, any>;
  limits?: Record<string, any>;
  price_amount?: number | null;
  price_currency?: string;
  price_interval?: string;
  is_active?: boolean;
  sort_order?: number;
}

/**
 * Request payload for reordering plans
 */
export interface PlanReorderRequest {
  [planId: number]: number;  // Maps plan ID to new sort_order
}

/**
 * Validation response for plan name
 */
export interface PlanValidationResponse {
  exists: boolean;
  is_active: boolean;
}

/**
 * Form data for plan management UI
 */
export interface PlanFormData {
  name: string;
  slug: string;
  display_name: string;
  description: string;
  stripe_price_id: string;
  icon: string;
  color: string;
  highlight: boolean;
  price_amount: string;  // String for form input
  price_currency: string;
  price_interval: string;
  is_active: boolean;
  sort_order: number;

  // Features
  max_scans_per_month: number | string;
  max_storage_gb: number | string;
  support_level: string;
  custom_integrations: boolean;
  api_access: boolean;
  custom_reports: boolean;
  advanced_analytics: boolean;
  white_label: boolean;
  sla: boolean;

  // Limits
  api_calls_per_day: number | string;
  max_users: number | string;
  max_projects: number | string;
  concurrent_scans: number | string;
}

/**
 * Default form values for creating a new plan
 */
export const DEFAULT_PLAN_FORM_DATA: PlanFormData = {
  name: '',
  slug: '',
  display_name: '',
  description: '',
  stripe_price_id: '',
  icon: 'rocket',
  color: '#3B82F6',
  highlight: false,
  price_amount: '0.00',
  price_currency: 'USD',
  price_interval: 'month',
  is_active: true,
  sort_order: 0,

  // Features
  max_scans_per_month: 100,
  max_storage_gb: 10,
  support_level: 'email',
  custom_integrations: false,
  api_access: true,
  custom_reports: false,
  advanced_analytics: false,
  white_label: false,
  sla: false,

  // Limits
  api_calls_per_day: 1000,
  max_users: 3,
  max_projects: 5,
  concurrent_scans: 1
};

/**
 * Helper function to convert form data to API payload
 */
export function formDataToPlanPayload(formData: PlanFormData): SubscriptionPlanCreate {
  const features = {
    max_scans_per_month: Number(formData.max_scans_per_month),
    max_storage_gb: Number(formData.max_storage_gb),
    support_level: formData.support_level,
    custom_integrations: formData.custom_integrations,
    api_access: formData.api_access,
    custom_reports: formData.custom_reports,
    advanced_analytics: formData.advanced_analytics,
    white_label: formData.white_label,
    sla: formData.sla
  };

  const limits = {
    api_calls_per_day: Number(formData.api_calls_per_day),
    max_users: Number(formData.max_users),
    max_projects: Number(formData.max_projects),
    concurrent_scans: Number(formData.concurrent_scans)
  };

  return {
    name: formData.name,
    slug: formData.slug,
    display_name: formData.display_name,
    description: formData.description || null,
    stripe_price_id: formData.stripe_price_id || null,
    icon: formData.icon || null,
    color: formData.color || null,
    highlight: formData.highlight,
    features,
    limits,
    price_amount: formData.price_amount ? parseFloat(formData.price_amount) : null,
    price_currency: formData.price_currency,
    price_interval: formData.price_interval,
    is_active: formData.is_active,
    sort_order: formData.sort_order
  };
}

/**
 * Helper function to convert API plan to form data
 */
export function planToFormData(plan: SubscriptionPlanDetail): PlanFormData {
  const features = plan.features || {};
  const limits = plan.limits || {};

  return {
    name: plan.name,
    slug: plan.slug,
    display_name: plan.display_name,
    description: plan.description || '',
    stripe_price_id: plan.stripe_price_id || '',
    icon: plan.icon || 'rocket',
    color: plan.color || '#3B82F6',
    highlight: plan.highlight,
    price_amount: plan.price_amount ? plan.price_amount.toString() : '0.00',
    price_currency: plan.price_currency,
    price_interval: plan.price_interval,
    is_active: plan.is_active,
    sort_order: plan.sort_order,

    // Features
    max_scans_per_month: features.max_scans_per_month || 100,
    max_storage_gb: features.max_storage_gb || 10,
    support_level: features.support_level || 'email',
    custom_integrations: features.custom_integrations || false,
    api_access: features.api_access !== undefined ? features.api_access : true,
    custom_reports: features.custom_reports || false,
    advanced_analytics: features.advanced_analytics || false,
    white_label: features.white_label || false,
    sla: features.sla || false,

    // Limits
    api_calls_per_day: limits.api_calls_per_day || 1000,
    max_users: limits.max_users || 3,
    max_projects: limits.max_projects || 5,
    concurrent_scans: limits.concurrent_scans || 1
  };
}
