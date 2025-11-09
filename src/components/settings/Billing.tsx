import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';
import { planApi } from '../../services/planApi';
import { SubscriptionPlan } from '../../types/subscriptionPlan';
import Layout from '../Layout';
import './Billing.css';

interface Subscription {
  id?: string;
  status: string;
  plan?: string;
  amount?: number;
  currency?: string;
  interval?: string;
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

interface PaymentMethod {
  id: string;
  type: string;
  card: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

interface Invoice {
  id: string;
  number?: string;
  amount_due: number;
  amount_paid: number;
  currency: string;
  status: string;
  created: number;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
}

const Billing: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [subData, pmData, invData, plans] = await Promise.all([
        apiService.getBillingSubscription(),
        apiService.getBillingPaymentMethods(),
        apiService.getBillingInvoices(10),
        planApi.getPublicPlans()
      ]);

      setSubscription(subData);
      setPaymentMethods(pmData.payment_methods || []);
      setInvoices(invData.invoices || []);
      setAvailablePlans(plans);

    } catch (err: any) {
      console.error('Failed to load billing data:', err);
      setError(err.response?.data?.detail || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeToPlan = async (plan: string) => {
    try {
      setError(null);
      const checkoutData = await apiService.createCheckoutSession(plan);
      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      setError(err.response?.data?.detail || 'Failed to initiate checkout');
    }
  };

  const handleManageBilling = async () => {
    try {
      setError(null);
      const portalData = await apiService.createPortalSession();
      // Redirect to Stripe Customer Portal
      window.location.href = portalData.url;
    } catch (err: any) {
      console.error('Failed to create portal session:', err);
      setError(err.response?.data?.detail || 'Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? It will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      setError(null);
      await apiService.cancelSubscription(true);
      alert('Subscription will be canceled at the end of the billing period');
      loadBillingData(); // Reload data
    } catch (err: any) {
      console.error('Failed to cancel subscription:', err);
      setError(err.response?.data?.detail || 'Failed to cancel subscription');
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Stripe amounts are in cents
  };

  const formatDate = (timestamp: number | string) => {
    const date = typeof timestamp === 'number' ? new Date(timestamp * 1000) : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-badge-success';
      case 'trialing':
        return 'status-badge-info';
      case 'past_due':
      case 'unpaid':
        return 'status-badge-warning';
      case 'canceled':
        return 'status-badge-danger';
      default:
        return 'status-badge-neutral';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="billing-container">
          <div className="loading">Loading billing information...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="billing-container">
      <h2>Billing & Subscriptions</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Current Subscription */}
      <section className="billing-section">
        <h3>Current Subscription</h3>
        {subscription ? (
          <div className="subscription-card">
            <div className="subscription-header">
              <div>
                <h4 className="plan-name">
                  {subscription.plan ? subscription.plan.toUpperCase() : 'FREE'} Plan
                </h4>
                <span className={`status-badge ${getStatusBadgeClass(subscription.status)}`}>
                  {subscription.status.toUpperCase()}
                </span>
              </div>
              {subscription.amount && (
                <div className="subscription-price">
                  <span className="amount">{formatCurrency(subscription.amount, subscription.currency)}</span>
                  <span className="interval">/{subscription.interval}</span>
                </div>
              )}
            </div>

            {subscription.current_period_end && (
              <p className="subscription-info">
                {subscription.cancel_at_period_end
                  ? `⚠️ Subscription will end on ${formatDate(subscription.current_period_end)}`
                  : `Next billing date: ${formatDate(subscription.current_period_end)}`}
              </p>
            )}

            <div className="subscription-actions">
              {subscription.id ? (
                <>
                  <button onClick={handleManageBilling} className="btn-primary">
                    Manage Subscription
                  </button>
                  {!subscription.cancel_at_period_end && (
                    <button onClick={handleCancelSubscription} className="btn-danger">
                      Cancel Subscription
                    </button>
                  )}
                </>
              ) : (
                <div className="plan-selection">
                  <p>Upgrade to a paid plan to unlock more features</p>
                  {availablePlans.length > 0 ? (
                    <div className="plan-cards-grid">
                      {availablePlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`plan-card ${plan.highlight ? 'plan-card-highlighted' : ''}`}
                          style={{ borderColor: plan.color || undefined }}
                        >
                          <div className="plan-card-header">
                            {plan.icon && <span className="plan-icon">{plan.icon}</span>}
                            <h4 className="plan-card-name">{plan.display_name}</h4>
                            {plan.highlight && <span className="plan-badge">Most Popular</span>}
                          </div>

                          {plan.description && (
                            <p className="plan-card-description">{plan.description}</p>
                          )}

                          <div className="plan-card-pricing">
                            {plan.price_amount !== null ? (
                              <>
                                <span className="plan-price">
                                  ${Number(plan.price_amount).toFixed(2)}
                                </span>
                                <span className="plan-interval">/{plan.price_interval}</span>
                              </>
                            ) : (
                              <span className="plan-price">Custom</span>
                            )}
                          </div>

                          {plan.features && Object.keys(plan.features).length > 0 && (
                            <ul className="plan-features">
                              {plan.features.max_scans_per_month && (
                                <li>
                                  ✓ {plan.features.max_scans_per_month === -1
                                    ? 'Unlimited'
                                    : plan.features.max_scans_per_month} scans per month
                                </li>
                              )}
                              {plan.features.max_storage_gb && (
                                <li>
                                  ✓ {plan.features.max_storage_gb === -1
                                    ? 'Unlimited'
                                    : plan.features.max_storage_gb + ' GB'} storage
                                </li>
                              )}
                              {plan.features.support_level && (
                                <li>✓ {plan.features.support_level.replace('_', ' ')} support</li>
                              )}
                              {plan.features.api_access && <li>✓ API access</li>}
                              {plan.features.custom_reports && <li>✓ Custom reports</li>}
                              {plan.features.custom_integrations && <li>✓ Custom integrations</li>}
                              {plan.features.advanced_analytics && <li>✓ Advanced analytics</li>}
                              {plan.features.white_label && <li>✓ White label</li>}
                              {plan.features.sla && <li>✓ SLA guarantee</li>}
                            </ul>
                          )}

                          <button
                            onClick={() => handleSubscribeToPlan(plan.name)}
                            className={plan.highlight ? 'btn-primary' : 'btn-secondary'}
                            style={plan.highlight ? { backgroundColor: plan.color || undefined } : undefined}
                          >
                            Subscribe to {plan.display_name}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No subscription plans available at this time.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <p>No subscription information available</p>
        )}
      </section>

      {/* Payment Methods */}
      {paymentMethods.length > 0 && (
        <section className="billing-section">
          <h3>Payment Methods</h3>
          <div className="payment-methods-list">
            {paymentMethods.map((pm) => (
              <div key={pm.id} className="payment-method-card">
                <div className="card-icon">💳</div>
                <div className="card-details">
                  <p className="card-brand">{pm.card.brand.toUpperCase()}</p>
                  <p className="card-number">•••• {pm.card.last4}</p>
                  <p className="card-expiry">
                    Expires {pm.card.exp_month}/{pm.card.exp_year}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={handleManageBilling} className="btn-secondary">
            Update Payment Method
          </button>
        </section>
      )}

      {/* Invoices */}
      {invoices.length > 0 && (
        <section className="billing-section">
          <h3>Invoice History</h3>
          <div className="invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Number</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>{formatDate(invoice.created)}</td>
                    <td>{invoice.number || 'N/A'}</td>
                    <td>{formatCurrency(invoice.amount_paid, invoice.currency)}</td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(invoice.status)}`}>
                        {invoice.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {invoice.hosted_invoice_url && (
                        <a
                          href={invoice.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="invoice-link"
                        >
                          View
                        </a>
                      )}
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="invoice-link"
                        >
                          Download PDF
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
    </Layout>
  );
};

export default Billing;
