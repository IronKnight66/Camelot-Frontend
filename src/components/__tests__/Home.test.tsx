/**
 * Home Dashboard Component Tests
 * 
 * Test cases for Home/Dashboard component including:
 * - Dashboard statistics display
 * - Navigation to different sections
 * - Stat cards interaction
 * - Quick actions
 * 
 * Test IDs: UI-HOME-001 through UI-HOME-008
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from '../Home';
import { AuthContext } from '../../contexts/AuthContext';
import * as apiService from '../../services/api';

// Mock API service
jest.mock('../../services/api');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithAuth = (user: any = {}) => {
  const defaultUser = {
    email: 'test@example.com',
    role: 'admin',
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
        <Home />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Home Dashboard Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock API responses
    mockApiService.getScans = jest.fn().mockResolvedValue([]);
    mockApiService.getFindings = jest.fn().mockResolvedValue([]);
    mockApiService.getDashboardStats = jest.fn().mockResolvedValue({
      total_scans: 25,
      total_findings: 150,
      critical_findings: 12,
      high_findings: 45,
    });
  });

  // ==================== Dashboard Display Tests ====================

  test('UI-HOME-001: Display dashboard statistics', async () => {
    renderWithAuth();

    // Wait for stats to load
    await waitFor(() => {
      expect(screen.getByText(/25|total scans/i)).toBeInTheDocument();
      expect(screen.getByText(/150|total findings/i)).toBeInTheDocument();
    });
  });

  test('UI-HOME-002: Display welcome message with user name', () => {
    renderWithAuth({ email: 'john@example.com' });

    expect(screen.getByText(/welcome|hello|dashboard/i)).toBeInTheDocument();
  });

  // ==================== Navigation Tests ====================

  test('UI-HOME-003: Click "View All Scans" navigates to scans page', () => {
    renderWithAuth();

    const viewScansButton = screen.getByRole('button', { name: /view.*scans/i }) ||
                           screen.getByText(/view.*scans/i);
    
    fireEvent.click(viewScansButton);

    expect(mockNavigate).toHaveBeenCalledWith('/scans');
  });

  test('UI-HOME-004: Click "View All Findings" navigates to findings page', () => {
    renderWithAuth();

    const viewFindingsButton = screen.getByRole('button', { name: /view.*findings/i }) ||
                              screen.getByText(/view.*findings/i);
    
    fireEvent.click(viewFindingsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/findings');
  });

  test('UI-HOME-005: Click "Scanner Hub" navigates to scanner hub', () => {
    renderWithAuth();

    const scannerHubButton = screen.getByRole('button', { name: /scanner hub/i }) ||
                            screen.getByText(/scanner hub/i);
    
    fireEvent.click(scannerHubButton);

    expect(mockNavigate).toHaveBeenCalledWith('/scanner-hub');
  });

  // ==================== Stat Card Tests ====================

  test('UI-HOME-006: Click on Total Scans stat card', () => {
    renderWithAuth();

    const scanCard = screen.getByText(/total scans/i).closest('div');
    
    if (scanCard) {
      fireEvent.click(scanCard);
      expect(mockNavigate).toHaveBeenCalledWith('/scans');
    }
  });

  test('UI-HOME-007: Click on Critical Findings stat card', async () => {
    renderWithAuth();

    await waitFor(() => {
      const criticalCard = screen.getByText(/critical/i).closest('div');
      
      if (criticalCard) {
        fireEvent.click(criticalCard);
        expect(mockNavigate).toHaveBeenCalledWith('/findings?severity=critical');
      }
    });
  });

  // ==================== Quick Actions Tests ====================

  test('UI-HOME-008: Click "New Scan" button opens scan creation', () => {
    renderWithAuth();

    const newScanButton = screen.getByRole('button', { name: /new scan|create scan/i });
    fireEvent.click(newScanButton);

    // Verify modal opens or navigates
    expect(mockNavigate).toHaveBeenCalledWith('/scans/new') ||
    expect(screen.getByText(/create.*scan/i)).toBeInTheDocument();
  });

  // ==================== Loading State Tests ====================

  test('UI-HOME-009: Display loading state while fetching stats', () => {
    mockApiService.getDashboardStats = jest.fn(() => 
      new Promise(resolve => setTimeout(() => resolve({ total_scans: 25 }), 100))
    );

    renderWithAuth();

    // Should show loading indicator
    expect(screen.getByText(/loading/i) || screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ==================== Error Handling Tests ====================

  test('UI-HOME-010: Display error message on API failure', async () => {
    mockApiService.getDashboardStats = jest.fn().mockRejectedValue(new Error('API Error'));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/error|failed to load/i)).toBeInTheDocument();
    });
  });

  // ==================== Role-Based Display Tests ====================

  test('UI-HOME-011: Admin sees admin-specific actions', () => {
    renderWithAuth({ role: 'admin' });

    // Admin should see user management link
    expect(screen.getByText(/user management|manage users/i)).toBeInTheDocument();
  });

  test('UI-HOME-012: Viewer does not see admin actions', () => {
    renderWithAuth({ role: 'viewer' });

    // Viewer should not see user management
    expect(screen.queryByText(/user management|manage users/i)).not.toBeInTheDocument();
  });

  // ==================== Recent Activity Tests ====================

  test('UI-HOME-013: Display recent scans', async () => {
    mockApiService.getScans = jest.fn().mockResolvedValue([
      { id: 1, name: 'Recent Scan 1', status: 'completed' },
      { id: 2, name: 'Recent Scan 2', status: 'running' },
    ]);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/Recent Scan 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Recent Scan 2/i)).toBeInTheDocument();
    });
  });

  test('UI-HOME-014: Display recent findings', async () => {
    mockApiService.getFindings = jest.fn().mockResolvedValue([
      { id: 1, title: 'SQL Injection', severity: 'critical' },
      { id: 2, title: 'XSS Vulnerability', severity: 'high' },
    ]);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByText(/SQL Injection/i)).toBeInTheDocument();
      expect(screen.getByText(/XSS Vulnerability/i)).toBeInTheDocument();
    });
  });
});

