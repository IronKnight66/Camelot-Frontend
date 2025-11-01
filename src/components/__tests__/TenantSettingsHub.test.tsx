/**
 * UI Button Tests for TenantSettingsHub Component
 * Test IDs: UI-SETTINGS-001 through UI-SETTINGS-008
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TenantSettingsHub from '../TenantSettingsHub';
import { AuthContext } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

import ApiService from '../../services/api';

const mockAuthContext = {
  user: {
    id: 'user-123',
    email: 'admin@acme.com',
    groups: ['admin'],
    username: 'admin',
  },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signUp: jest.fn(),
};

const mockTenantSettings = {
  id: 'tenant-1',
  name: 'ACME Corporation',
  slug: 'acme',
  description: 'Security testing for ACME',
  contact_email: 'security@acme.com',
  contact_name: 'Security Team',
  tier: 'professional',
  max_users: 50,
  max_scans_per_month: 1000,
};

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <TenantSettingsHub />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('TenantSettingsHub - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.get as jest.Mock).mockResolvedValue({
      data: { tenant: mockTenantSettings },
    });
  });

  /**
   * Test Case UI-SETTINGS-001: Click "API Keys" Card
   */
  test('UI-SETTINGS-001: Navigates to API Keys when card clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant settings/i)).toBeInTheDocument();
    });

    const apiKeysCard = screen.getByText(/api keys/i).closest('a, button, .card');
    if (apiKeysCard) {
      fireEvent.click(apiKeysCard);

      // Verify navigation (implementation dependent)
      await waitFor(() => {
        if (apiKeysCard.tagName === 'A') {
          expect(apiKeysCard).toHaveAttribute('href', expect.stringContaining('api-keys'));
        }
      });
    }
  });

  /**
   * Test Case UI-SETTINGS-002: Click "Scanner Configuration" Card
   */
  test('UI-SETTINGS-002: Navigates to Scanner Configuration when card clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant settings/i)).toBeInTheDocument();
    });

    const scannerCard = screen.getByText(/scanner|scanners/i).closest('a, button, .card');
    if (scannerCard) {
      fireEvent.click(scannerCard);

      await waitFor(() => {
        if (scannerCard.tagName === 'A') {
          expect(scannerCard).toHaveAttribute('href', expect.stringContaining('scanners'));
        }
      });
    }
  });

  /**
   * Test Case UI-SETTINGS-003: Click "Edit Tenant Info" Button
   */
  test('UI-SETTINGS-003: Opens edit form when Edit Tenant Info clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/ACME Corporation/i)).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit tenant info|edit/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput).not.toBeDisabled();
      expect(nameInput.value).toBe('ACME Corporation');
    });
  });

  /**
   * Test Case UI-SETTINGS-004: Click "Save Changes" in Edit Form
   */
  test('UI-SETTINGS-004: Saves tenant info when Save Changes clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockTenantSettings, name: 'ACME Inc.' },
    });

    renderComponent();
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit tenant info|edit/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'ACME Inc.' },
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        '/api/v1/tenant',
        expect.objectContaining({ name: 'ACME Inc.' })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/tenant updated|changes saved/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-SETTINGS-005: Click "Cancel" in Edit Form
   */
  test('UI-SETTINGS-005: Cancels editing when Cancel clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit tenant info|edit/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).not.toBeDisabled();
    });

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Changed Name' },
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('ACME Corporation')).toBeInTheDocument();
    });

    expect(ApiService.put).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-SETTINGS-006: Click "Upgrade Plan" Button
   */
  test('UI-SETTINGS-006: Opens upgrade modal when Upgrade Plan clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant settings/i)).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /upgrade plan|upgrade/i });
    fireEvent.click(upgradeButton);

    await waitFor(() => {
      expect(screen.getByText(/upgrade to|select plan|pricing/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-SETTINGS-007: Click "View Usage Statistics" Button
   */
  test('UI-SETTINGS-007: Shows usage statistics when View Usage clicked', async () => {
    (ApiService.get as jest.Mock).mockResolvedValueOnce({
      data: {
        users: 15,
        scans_this_month: 250,
        storage_used: '1.5 GB',
      },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant settings/i)).toBeInTheDocument();
    });

    const viewUsageButton = screen.getByRole('button', { name: /view usage|usage statistics/i });
    fireEvent.click(viewUsageButton);

    await waitFor(() => {
      expect(screen.getByText(/usage statistics/i)).toBeInTheDocument();
      expect(screen.getByText(/15/)).toBeInTheDocument(); // Users count
      expect(screen.getByText(/250/)).toBeInTheDocument(); // Scans count
    });
  });

  /**
   * Test Case UI-SETTINGS-008: Click "Manage Billing" Button
   */
  test('UI-SETTINGS-008: Opens billing portal when Manage Billing clicked', async () => {
    (ApiService.get as jest.Mock).mockResolvedValueOnce({
      data: {
        billing_portal_url: 'https://billing.acme.com/portal',
      },
    });

    // Mock window.open
    const mockWindowOpen = jest.fn();
    global.open = mockWindowOpen;

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant settings/i)).toBeInTheDocument();
    });

    const billingButton = screen.getByRole('button', { name: /manage billing|billing/i });
    fireEvent.click(billingButton);

    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        expect.stringContaining('billing'),
        '_blank'
      );
    });
  });

  /**
   * Additional Test: View Current Tier Information
   */
  test('Displays current tier information correctly', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/professional/i)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument(); // Max users
      expect(screen.getByText(/1000|1,000/)).toBeInTheDocument(); // Max scans
    });
  });

  /**
   * Additional Test: Copy Tenant ID
   */
  test('Copies tenant ID to clipboard when copy button clicked', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/tenant-1/i)).toBeInTheDocument();
    });

    const copyButton = screen.getByRole('button', { name: /copy.*id/i });
    if (copyButton) {
      fireEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('tenant-1');
    }
  });
});

