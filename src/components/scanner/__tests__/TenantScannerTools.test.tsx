/**
 * TenantScannerTools Component Tests
 * 
 * Test cases for Tenant Scanner Tools (tenant admin) component including:
 * - Enable/Disable scanner tools for tenant
 * - Configure tool settings
 * - Set usage limits
 * - View tool details
 * - Tab navigation
 * 
 * Test IDs: UI-TENANTSCAN-001 through UI-TENANTSCAN-012
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TenantScannerTools from '../TenantScannerTools';
import { AuthContext } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';

// Mock API service
jest.mock('../../../services/api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock data
const mockTenantTools = [
  {
    id: '1',
    scannerToolId: 'tool-1',
    scanner_tool: {
      id: 'tool-1',
      name: 'nmap',
      displayName: 'Nmap',
      description: 'Network scanner',
      category: 'Network'
    },
    is_enabled: true,
    current_usage_count: 5,
    max_scans_per_month: 100,
    tool_settings: {}
  },
  {
    id: '2',
    scannerToolId: 'tool-2',
    scanner_tool: {
      id: 'tool-2',
      name: 'nikto',
      displayName: 'Nikto',
      description: 'Web vulnerability scanner',
      category: 'Web'
    },
    is_enabled: false,
    current_usage_count: 0,
    max_scans_per_month: 50,
    tool_settings: {}
  }
];

// Helper to render with context
const renderWithContext = (ui: React.ReactElement, role: string = 'tenant-admin') => {
  const authValue = {
    user: { 
      email: 'admin@tenant.com',
      groups: [role]
    },
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    loading: false,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('TenantScannerTools Component - Button Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getTenantScannerTools.mockResolvedValue({ tools: mockTenantTools });
    mockedApiService.updateTenantToolSettings = jest.fn().mockResolvedValue({});
    mockedApiService.enableTenantTool = jest.fn().mockResolvedValue({});
    mockedApiService.disableTenantTool = jest.fn().mockResolvedValue({});
  });

  /**
   * Test Case UI-TENANTSCAN-001: Click "All" Tab
   * Verify shows all scanner tools
   */
  test('UI-TENANTSCAN-001: should show all tools when All tab clicked', async () => {
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });

    // Click All tab
    const allTab = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allTab);

    await waitFor(() => {
      expect(mockedApiService.getTenantScannerTools).toHaveBeenCalledWith(undefined);
    });
  });

  /**
   * Test Case UI-TENANTSCAN-002: Click "Enabled" Tab
   * Verify shows only enabled tools
   */
  test('UI-TENANTSCAN-002: should show only enabled tools when Enabled tab clicked', async () => {
    mockedApiService.getTenantScannerTools.mockResolvedValue({ 
      tools: [mockTenantTools[0]] 
    });
    
    renderWithContext(<TenantScannerTools />);

    // Click Enabled tab
    const enabledTab = screen.getByRole('button', { name: /enabled/i });
    fireEvent.click(enabledTab);

    await waitFor(() => {
      expect(mockedApiService.getTenantScannerTools).toHaveBeenCalledWith(true);
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-003: Click "Disabled" Tab
   * Verify shows only disabled tools
   */
  test('UI-TENANTSCAN-003: should show only disabled tools when Disabled tab clicked', async () => {
    mockedApiService.getTenantScannerTools.mockResolvedValue({ 
      tools: [mockTenantTools[1]] 
    });
    
    renderWithContext(<TenantScannerTools />);

    // Click Disabled tab
    const disabledTab = screen.getByRole('button', { name: /disabled/i });
    fireEvent.click(disabledTab);

    await waitFor(() => {
      expect(mockedApiService.getTenantScannerTools).toHaveBeenCalledWith(false);
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-004: Click "Enable" Button
   * Verify enables tool for tenant
   */
  test('UI-TENANTSCAN-004: should enable tool when enable button clicked', async () => {
    mockedApiService.enableTenantTool.mockResolvedValue({});
    
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });

    // Find and click enable button
    const enableButtons = screen.getAllByText(/enable/i);
    fireEvent.click(enableButtons[0]);

    await waitFor(() => {
      expect(mockedApiService.enableTenantTool).toHaveBeenCalled();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-005: Click "Disable" Button
   * Verify disables tool for tenant
   */
  test('UI-TENANTSCAN-005: should disable tool when disable button clicked', async () => {
    mockedApiService.disableTenantTool.mockResolvedValue({});
    
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Find and click disable button
    const disableButtons = screen.getAllByText(/disable/i);
    fireEvent.click(disableButtons[0]);

    await waitFor(() => {
      expect(mockedApiService.disableTenantTool).toHaveBeenCalledWith('1');
    });
  });

  /**
   * Test Case UI-TENANTSCAN-006: Click "Settings" Button
   * Verify opens settings modal
   */
  test('UI-TENANTSCAN-006: should open settings modal when settings button clicked', async () => {
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Find and click settings button
    const settingsButtons = screen.getAllByText(/settings/i);
    fireEvent.click(settingsButtons[0]);

    // Modal should open
    await waitFor(() => {
      expect(screen.getByText(/configure/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-007: Click "Save" in Settings Modal
   * Verify saves tool configuration
   */
  test('UI-TENANTSCAN-007: should save settings when save button clicked in modal', async () => {
    mockedApiService.updateTenantToolSettings.mockResolvedValue({});
    
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Open settings modal
    const settingsButtons = screen.getAllByText(/settings/i);
    fireEvent.click(settingsButtons[0]);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText(/configure/i)).toBeInTheDocument();
    });

    // Change usage limit
    const limitInput = screen.getByLabelText(/usage limit/i);
    fireEvent.change(limitInput, { target: { value: '200' } });

    // Click save
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockedApiService.updateTenantToolSettings).toHaveBeenCalled();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-008: Click "Cancel" in Settings Modal
   * Verify closes modal without saving
   */
  test('UI-TENANTSCAN-008: should close modal when cancel button clicked', async () => {
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Open settings modal
    const settingsButtons = screen.getAllByText(/settings/i);
    fireEvent.click(settingsButtons[0]);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByText(/configure/i)).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText(/configure/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-009: Click "Retry" on Error
   * Verify retries loading tools
   */
  test('UI-TENANTSCAN-009: should retry loading when retry button clicked', async () => {
    // First call fails
    mockedApiService.getTenantScannerTools.mockRejectedValueOnce(
      new Error('Network error')
    );
    
    renderWithContext(<TenantScannerTools />);

    // Wait for error
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i });
    
    // Second call succeeds
    mockedApiService.getTenantScannerTools.mockResolvedValueOnce({ tools: mockTenantTools });
    fireEvent.click(retryButton);

    // Verify data loads
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-TENANTSCAN-010: View Usage Statistics
   * Verify usage stats display correctly
   */
  test('UI-TENANTSCAN-010: should display usage statistics for enabled tool', async () => {
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Should show usage count
    expect(screen.getByText(/5.*100/)).toBeInTheDocument(); // 5 of 100 usage
  });

  /**
   * Test Case UI-TENANTSCAN-011: Access Denied for Non-Admin
   * Verify redirects non-admin users
   */
  test('UI-TENANTSCAN-011: should redirect when user lacks tenant-admin role', async () => {
    renderWithContext(<TenantScannerTools />, 'user');

    // Should show access denied or redirect
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  /**
   * Test Case UI-TENANTSCAN-012: Search Scanner Tools
   * Verify search filters tools
   */
  test('UI-TENANTSCAN-012: should filter tools by search term', async () => {
    renderWithContext(<TenantScannerTools />);

    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });

    // Type in search
    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'nikto' } });

    // Should only show Nikto
    await waitFor(() => {
      expect(screen.getByText('Nikto')).toBeInTheDocument();
      expect(screen.queryByText('Nmap')).not.toBeInTheDocument();
    });
  });
});

