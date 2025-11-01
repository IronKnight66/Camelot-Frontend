/**
 * Scanner Hub Component Tests
 * 
 * Test cases for Scanner Hub component including:
 * - Tool discovery
 * - Tool activation
 * - Tool configuration
 * - Search and filter
 * 
 * Test IDs: UI-SCANNER-001 through UI-SCANNER-008
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ScannerHub from '../ScannerHub';
import { AuthContext } from '../../contexts/AuthContext';
import * as apiService from '../../services/api';

// Mock API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

const renderWithAuth = (user: any = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    role: 'user',
    ...user,
  };

  const authValue = {
    user: defaultUser,
    signOut: jest.fn(),
    loading: false,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <ScannerHub />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Scanner Hub Component', () => {
  const mockScannerTools = [
    {
      id: 1,
      name: 'nmap',
      display_name: 'Nmap Network Scanner',
      category: 'Network',
      pricing_tier: 'Free',
      is_enabled: true,
      is_activated: false,
    },
    {
      id: 2,
      name: 'owasp-zap',
      display_name: 'OWASP ZAP',
      category: 'Web Application',
      pricing_tier: 'Free',
      is_enabled: true,
      is_activated: true,
    },
    {
      id: 3,
      name: 'burp-suite',
      display_name: 'Burp Suite Professional',
      category: 'Web Application',
      pricing_tier: 'Professional',
      is_enabled: false,
      is_activated: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockApiService.getScannerTools = jest.fn().mockResolvedValue(mockScannerTools);
  });

  // ==================== Display Tests ====================

  test('UI-SCANNER-001: Display available scanner tools', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/Nmap Network Scanner/i)).toBeInTheDocument();
      expect(screen.getByText(/OWASP ZAP/i)).toBeInTheDocument();
    });
  });

  test('UI-SCANNER-002: Display tool categories', async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/Network/i)).toBeInTheDocument();
      expect(screen.getByText(/Web Application/i)).toBeInTheDocument();
    });
  });

  // ==================== Tool Activation Tests ====================

  test('UI-SCANNER-003: Click Activate button for tool', async () => {
    mockApiService.activateScannerTool = jest.fn().mockResolvedValue({ success: true });
    
    renderWithAuth();

    await waitFor(() => {
      const activateButton = screen.getAllByRole('button', { name: /activate/i })[0];
      fireEvent.click(activateButton);
    });

    await waitFor(() => {
      expect(mockApiService.activateScannerTool).toHaveBeenCalledWith(1);
    });
  });

  test('UI-SCANNER-004: Click Deactivate button for activated tool', async () => {
    mockApiService.deactivateScannerTool = jest.fn().mockResolvedValue({ success: true });
    
    renderWithAuth();

    await waitFor(() => {
      const deactivateButton = screen.getByRole('button', { name: /deactivate|remove/i });
      fireEvent.click(deactivateButton);
    });

    await waitFor(() => {
      expect(mockApiService.deactivateScannerTool).toHaveBeenCalled();
    });
  });

  // ==================== Search and Filter Tests ====================

  test('UI-SCANNER-005: Search for scanner tool by name', async () => {
    renderWithAuth();

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'nmap' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Nmap Network Scanner/i)).toBeInTheDocument();
      expect(screen.queryByText(/OWASP ZAP/i)).not.toBeInTheDocument();
    });
  });

  test('UI-SCANNER-006: Filter tools by category', async () => {
    renderWithAuth();

    await waitFor(() => {
      const categoryFilter = screen.getByRole('combobox', { name: /category/i }) ||
                            screen.getByLabelText(/category/i);
      
      fireEvent.change(categoryFilter, { target: { value: 'Network' } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Nmap/i)).toBeInTheDocument();
    });
  });

  test('UI-SCANNER-007: Filter tools by pricing tier', async () => {
    renderWithAuth();

    await waitFor(() => {
      const pricingFilter = screen.getByRole('combobox', { name: /pricing/i }) ||
                           screen.getByLabelText(/pricing/i);
      
      fireEvent.change(pricingFilter, { target: { value: 'Free' } });
    });

    await waitFor(() => {
      expect(screen.queryByText(/Burp Suite Professional/i)).not.toBeInTheDocument();
    });
  });

  // ==================== Tool Details Tests ====================

  test('UI-SCANNER-008: Click on tool to view details', async () => {
    renderWithAuth();

    await waitFor(() => {
      const toolCard = screen.getByText(/Nmap Network Scanner/i).closest('div');
      if (toolCard) {
        fireEvent.click(toolCard);
      }
    });

    // Should show tool details modal or expand
    await waitFor(() => {
      expect(screen.getByText(/description|details/i)).toBeInTheDocument();
    });
  });

  // ==================== Configuration Tests ====================

  test('UI-SCANNER-009: Click Configure button opens configuration dialog', async () => {
    renderWithAuth();

    await waitFor(() => {
      const configureButton = screen.getByRole('button', { name: /configure/i });
      fireEvent.click(configureButton);
    });

    // Should show configuration modal
    expect(screen.getByText(/configuration|settings/i)).toBeInTheDocument();
  });

  // ==================== Loading and Error States ====================

  test('UI-SCANNER-010: Display loading state', () => {
    mockApiService.getScannerTools = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve(mockScannerTools), 100))
    );

    renderWithAuth();

    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('UI-SCANNER-011: Display error message on API failure', async () => {
    mockApiService.getScannerTools = jest.fn().mockRejectedValue(new Error('Failed to load'));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });

  // ==================== Role-Based Tests ====================

  test('UI-SCANNER-012: Admin sees all tools including professional', async () => {
    renderWithAuth({ role: 'admin' });

    await waitFor(() => {
      expect(screen.getByText(/Burp Suite Professional/i)).toBeInTheDocument();
    });
  });

  test('UI-SCANNER-013: User only sees activated tools in My Scanners', async () => {
    renderWithAuth({ role: 'user' });

    const myScannersTab = screen.getByRole('tab', { name: /my scanners/i });
    fireEvent.click(myScannersTab);

    await waitFor(() => {
      expect(screen.getByText(/OWASP ZAP/i)).toBeInTheDocument(); // Activated
      expect(screen.queryByText(/Nmap/i)).not.toBeInTheDocument(); // Not activated
    });
  });

  // ==================== Empty State Tests ====================

  test('UI-SCANNER-014: Display empty state when no tools available', async () => {
    mockApiService.getScannerTools = jest.fn().mockResolvedValue([]);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/no scanner tools|no tools available/i)).toBeInTheDocument();
    });
  });
});

