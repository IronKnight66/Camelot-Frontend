import React, { useState, useEffect } from 'react';
import { planApi } from '../../services/planApi';
import {
  SubscriptionPlanDetail,
  PlanFormData,
  DEFAULT_PLAN_FORM_DATA,
  formDataToPlanPayload,
  planToFormData
} from '../../types/subscriptionPlan';
import Layout from '../Layout';
import './SubscriptionPlans.css';

const SubscriptionPlans: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanDetail[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(DEFAULT_PLAN_FORM_DATA);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await planApi.getAllPlans(false, 0, 100);
      setPlans(response.plans);
    } catch (err: any) {
      console.error('Failed to load plans:', err);
      setError(err.response?.data?.detail || 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: value === '' ? '' : Number(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateNew = () => {
    setEditingPlan(null);
    setFormData(DEFAULT_PLAN_FORM_DATA);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (plan: SubscriptionPlanDetail) => {
    setEditingPlan(plan);
    setFormData(planToFormData(plan));
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData(DEFAULT_PLAN_FORM_DATA);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = formDataToPlanPayload(formData);

      if (editingPlan) {
        // Update existing plan
        await planApi.updatePlan(editingPlan.id, payload);
        setSuccess(`Plan "${formData.display_name}" updated successfully!`);
      } else {
        // Create new plan
        await planApi.createPlan(payload);
        setSuccess(`Plan "${formData.display_name}" created successfully!`);
      }

      // Reload plans and close form
      await loadPlans();
      setShowForm(false);
      setEditingPlan(null);
      setFormData(DEFAULT_PLAN_FORM_DATA);
    } catch (err: any) {
      console.error('Failed to save plan:', err);
      setError(err.response?.data?.detail || 'Failed to save subscription plan');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlanDetail) => {
    try {
      setError(null);
      setSuccess(null);

      if (plan.is_active) {
        await planApi.deactivatePlan(plan.id);
        setSuccess(`Plan "${plan.display_name}" deactivated`);
      } else {
        await planApi.activatePlan(plan.id);
        setSuccess(`Plan "${plan.display_name}" activated`);
      }

      await loadPlans();
    } catch (err: any) {
      console.error('Failed to toggle plan status:', err);
      setError(err.response?.data?.detail || 'Failed to update plan status');
    }
  };

  const handleDelete = async (plan: SubscriptionPlanDetail) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${plan.display_name}"? This cannot be undone. Consider deactivating instead.`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await planApi.deletePlan(plan.id);
      setSuccess(`Plan "${plan.display_name}" deleted`);
      await loadPlans();
    } catch (err: any) {
      console.error('Failed to delete plan:', err);
      setError(err.response?.data?.detail || 'Failed to delete plan');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="subscription-plans-container">
          <div className="loading">Loading subscription plans...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="subscription-plans-container">
        <div className="page-header">
          <h2>Subscription Plans Management</h2>
          <p className="subtitle">Create and manage subscription plans with Stripe integration</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {!showForm && (
          <>
            <div className="actions-bar">
              <button onClick={handleCreateNew} className="btn-primary">
                + Create New Plan
              </button>
            </div>

            <div className="plans-table-container">
              <table className="plans-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Name</th>
                    <th>Display Name</th>
                    <th>Price</th>
                    <th>Stripe Price ID</th>
                    <th>Sort Order</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plans.map((plan) => (
                    <tr key={plan.id} className={!plan.is_active ? 'inactive-row' : ''}>
                      <td>
                        <span className={`status-badge ${plan.is_active ? 'status-active' : 'status-inactive'}`}>
                          {plan.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {plan.highlight && <span className="highlight-badge">★ Highlighted</span>}
                      </td>
                      <td>
                        {plan.icon && <span className="plan-icon-small">{plan.icon}</span>}
                        <code>{plan.name}</code>
                      </td>
                      <td>
                        <strong>{plan.display_name}</strong>
                        {plan.description && (
                          <div className="plan-description-small">{plan.description}</div>
                        )}
                      </td>
                      <td>
                        {plan.price_amount !== null ? (
                          <span className="price-display">
                            ${Number(plan.price_amount).toFixed(2)}/{plan.price_interval}
                          </span>
                        ) : (
                          <span className="price-custom">Custom</span>
                        )}
                      </td>
                      <td>
                        {plan.stripe_price_id ? (
                          <code className="stripe-price-id">{plan.stripe_price_id}</code>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td className="text-center">{plan.sort_order}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            onClick={() => handleEdit(plan)}
                            className="btn-small btn-edit"
                            title="Edit plan"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleToggleActive(plan)}
                            className={`btn-small ${plan.is_active ? 'btn-deactivate' : 'btn-activate'}`}
                            title={plan.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {plan.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDelete(plan)}
                            className="btn-small btn-delete"
                            title="Delete plan"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {plans.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center text-muted">
                        No subscription plans found. Create your first plan to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {showForm && (
          <div className="plan-form-container">
            <h3>{editingPlan ? `Edit Plan: ${editingPlan.display_name}` : 'Create New Plan'}</h3>

            <form onSubmit={handleSubmit} className="plan-form">
              {/* Basic Information */}
              <fieldset className="form-section">
                <legend>Basic Information</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">
                      Internal Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="basic, intermediate, premium"
                      className="form-input"
                      required
                    />
                    <small className="form-help">Lowercase, no spaces (used in API calls)</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="slug">
                      URL Slug <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="basic-plan"
                      className="form-input"
                      required
                    />
                    <small className="form-help">URL-friendly identifier</small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="display_name">
                    Display Name <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="display_name"
                    name="display_name"
                    value={formData.display_name}
                    onChange={handleInputChange}
                    placeholder="Basic Plan"
                    className="form-input"
                    required
                  />
                  <small className="form-help">User-facing name shown on billing page</small>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Perfect for individuals and small projects"
                    className="form-textarea"
                    rows={2}
                  />
                </div>
              </fieldset>

              {/* Stripe & Pricing */}
              <fieldset className="form-section">
                <legend>Stripe & Pricing</legend>

                <div className="form-group">
                  <label htmlFor="stripe_price_id">Stripe Price ID</label>
                  <input
                    type="text"
                    id="stripe_price_id"
                    name="stripe_price_id"
                    value={formData.stripe_price_id}
                    onChange={handleInputChange}
                    placeholder="price_1234567890abcdef"
                    className="form-input"
                  />
                  <small className="form-help">From Stripe Dashboard → Products → Prices</small>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="price_amount">Price Amount</label>
                    <input
                      type="text"
                      id="price_amount"
                      name="price_amount"
                      value={formData.price_amount}
                      onChange={handleInputChange}
                      placeholder="29.99"
                      className="form-input"
                    />
                    <small className="form-help">Leave empty for custom pricing</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="price_currency">Currency</label>
                    <input
                      type="text"
                      id="price_currency"
                      name="price_currency"
                      value={formData.price_currency}
                      onChange={handleInputChange}
                      placeholder="USD"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="price_interval">Billing Interval</label>
                    <select
                      id="price_interval"
                      name="price_interval"
                      value={formData.price_interval}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="month">Monthly</option>
                      <option value="year">Yearly</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              {/* Display Settings */}
              <fieldset className="form-section">
                <legend>Display Settings</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="icon">Icon (Emoji)</label>
                    <input
                      type="text"
                      id="icon"
                      name="icon"
                      value={formData.icon}
                      onChange={handleInputChange}
                      placeholder="🚀"
                      className="form-input"
                      maxLength={10}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="color">Color (Hex)</label>
                    <input
                      type="text"
                      id="color"
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="#3B82F6"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sort_order">Sort Order</label>
                    <input
                      type="number"
                      id="sort_order"
                      name="sort_order"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                      className="form-input"
                      min="0"
                    />
                    <small className="form-help">Lower = appears first</small>
                  </div>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="highlight"
                      checked={formData.highlight}
                      onChange={handleInputChange}
                    />
                    <span>Highlight this plan (shows "Most Popular" badge)</span>
                  </label>
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    <span>Active (visible to users)</span>
                  </label>
                </div>
              </fieldset>

              {/* Features */}
              <fieldset className="form-section">
                <legend>Features</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="max_scans_per_month">Max Scans/Month</label>
                    <input
                      type="number"
                      id="max_scans_per_month"
                      name="max_scans_per_month"
                      value={formData.max_scans_per_month}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                    <small className="form-help">-1 for unlimited</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_storage_gb">Max Storage (GB)</label>
                    <input
                      type="number"
                      id="max_storage_gb"
                      name="max_storage_gb"
                      value={formData.max_storage_gb}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                    <small className="form-help">-1 for unlimited</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="support_level">Support Level</label>
                    <select
                      id="support_level"
                      name="support_level"
                      value={formData.support_level}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="community">Community</option>
                      <option value="email">Email</option>
                      <option value="priority">Priority</option>
                      <option value="dedicated">Dedicated</option>
                    </select>
                  </div>
                </div>

                <div className="features-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="api_access"
                      checked={formData.api_access}
                      onChange={handleInputChange}
                    />
                    <span>API Access</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="custom_reports"
                      checked={formData.custom_reports}
                      onChange={handleInputChange}
                    />
                    <span>Custom Reports</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="custom_integrations"
                      checked={formData.custom_integrations}
                      onChange={handleInputChange}
                    />
                    <span>Custom Integrations</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="advanced_analytics"
                      checked={formData.advanced_analytics}
                      onChange={handleInputChange}
                    />
                    <span>Advanced Analytics</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="white_label"
                      checked={formData.white_label}
                      onChange={handleInputChange}
                    />
                    <span>White Label</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="sla"
                      checked={formData.sla}
                      onChange={handleInputChange}
                    />
                    <span>SLA Guarantee</span>
                  </label>
                </div>
              </fieldset>

              {/* Limits */}
              <fieldset className="form-section">
                <legend>Usage Limits</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="api_calls_per_day">API Calls/Day</label>
                    <input
                      type="number"
                      id="api_calls_per_day"
                      name="api_calls_per_day"
                      value={formData.api_calls_per_day}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_users">Max Users</label>
                    <input
                      type="number"
                      id="max_users"
                      name="max_users"
                      value={formData.max_users}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="max_projects">Max Projects</label>
                    <input
                      type="number"
                      id="max_projects"
                      name="max_projects"
                      value={formData.max_projects}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="concurrent_scans">Concurrent Scans</label>
                    <input
                      type="number"
                      id="concurrent_scans"
                      name="concurrent_scans"
                      value={formData.concurrent_scans}
                      onChange={handleInputChange}
                      className="form-input"
                      min="-1"
                    />
                  </div>
                </div>
              </fieldset>

              {/* Form Actions */}
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
                <button type="button" onClick={handleCancel} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SubscriptionPlans;
