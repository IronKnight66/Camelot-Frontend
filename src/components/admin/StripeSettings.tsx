import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import Layout from '../Layout';
import './StripeSettings.css';

interface StripeConfig {
  secret_key?: string;
  publishable_key?: string;
  webhook_secret?: string;
  is_configured: boolean;
}

const StripeSettings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [config, setConfig] = useState<StripeConfig | null>(null);

  const [formData, setFormData] = useState({
    secret_key: '',
    publishable_key: '',
    webhook_secret: '',
  });

  useEffect(() => {
    loadStripeConfig();
  }, []);

  const loadStripeConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getStripeConfig();
      setConfig(data);

      // Pre-fill non-sensitive fields
      setFormData({
        secret_key: '',
        publishable_key: data.publishable_key || '',
        webhook_secret: '',
      });
    } catch (err: any) {
      console.error('Failed to load Stripe config:', err);
      setError(err.response?.data?.detail || 'Failed to load Stripe configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Only send fields that have values
      const updateData: any = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          updateData[key] = value;
        }
      });

      await apiService.updateStripeConfig(updateData);
      setSuccess('Stripe configuration updated successfully!');

      // Reload config to get masked values
      await loadStripeConfig();

      // Clear sensitive input fields
      setFormData((prev) => ({
        ...prev,
        secret_key: '',
        webhook_secret: '',
      }));
    } catch (err: any) {
      console.error('Failed to update Stripe config:', err);
      setError(err.response?.data?.detail || 'Failed to update Stripe configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await apiService.testStripeConnection();
      if (result.success) {
        setSuccess(
          `✅ Connection successful!\nAccount ID: ${result.account_id}\nEmail: ${result.email}\nCountry: ${result.country}`
        );
      } else {
        setError(`❌ Connection failed: ${result.error}`);
      }
    } catch (err: any) {
      console.error('Failed to test Stripe connection:', err);
      setError(err.response?.data?.detail || 'Failed to test Stripe connection');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="stripe-settings-container">
          <div className="loading">Loading Stripe configuration...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="stripe-settings-container">
        <div className="page-header">
          <h2>Stripe Configuration</h2>
          <p className="subtitle">Configure Stripe for billing and subscription management</p>
        </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message" style={{ whiteSpace: 'pre-line' }}>
          {success}
        </div>
      )}

      {config && (
        <div className="config-status">
          <p>
            <strong>Status:</strong>{' '}
            <span className={config.is_configured ? 'status-configured' : 'status-not-configured'}>
              {config.is_configured ? '✅ Configured' : '⚠️ Not Configured'}
            </span>
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="stripe-config-form">
        <h3>API Keys</h3>

        <div className="form-group">
          <label htmlFor="secret_key">
            Secret Key
            {config?.secret_key && <span className="current-value"> (Current: {config.secret_key})</span>}
          </label>
          <input
            type="password"
            id="secret_key"
            name="secret_key"
            value={formData.secret_key}
            onChange={handleInputChange}
            placeholder="sk_live_... or sk_test_..."
            className="form-input"
          />
          <small className="form-help">Your Stripe secret key (will be encrypted)</small>
        </div>

        <div className="form-group">
          <label htmlFor="publishable_key">Publishable Key</label>
          <input
            type="text"
            id="publishable_key"
            name="publishable_key"
            value={formData.publishable_key}
            onChange={handleInputChange}
            placeholder="pk_live_... or pk_test_..."
            className="form-input"
          />
          <small className="form-help">Your Stripe publishable key (safe to expose)</small>
        </div>

        <div className="form-group">
          <label htmlFor="webhook_secret">
            Webhook Secret
            {config?.webhook_secret && <span className="current-value"> (Current: {config.webhook_secret})</span>}
          </label>
          <input
            type="password"
            id="webhook_secret"
            name="webhook_secret"
            value={formData.webhook_secret}
            onChange={handleInputChange}
            placeholder="whsec_..."
            className="form-input"
          />
          <small className="form-help">Stripe webhook signing secret (will be encrypted)</small>
        </div>

        <div className="info-box">
          <h4>💡 About Subscription Plans</h4>
          <p>
            Subscription plan details (including Stripe price IDs) are now managed through the
            <strong> Subscription Plans</strong> admin interface. Each plan stores its own Stripe price ID,
            features, limits, and display information.
          </p>
          <p>
            This Stripe configuration page only manages the core API keys and webhook secret
            that are shared across all plans.
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            type="button"
            onClick={handleTestConnection}
            className="btn-secondary"
            disabled={testing || !config?.is_configured}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
        </div>
      </form>

      <div className="help-section">
        <h3>Setup Instructions</h3>
        <ol>
          <li>Create a Stripe account at <a href="https://stripe.com" target="_blank" rel="noopener noreferrer">stripe.com</a></li>
          <li>Get your API keys from the Stripe Dashboard → Developers → API keys</li>
          <li>Enter the API keys above and save the configuration</li>
          <li>Set up a webhook endpoint pointing to: <code>{window.location.origin}/api/v1/billing/webhook</code></li>
          <li>Configure webhook to listen for: customer.subscription.*, invoice.payment_*</li>
          <li>Copy the webhook signing secret and enter it above</li>
          <li>Create subscription products and prices in Stripe Dashboard → Products</li>
          <li>Configure your subscription plans through the <strong>Subscription Plans</strong> admin interface, including Stripe price IDs</li>
        </ol>
      </div>
    </div>
    </Layout>
  );
};

export default StripeSettings;
