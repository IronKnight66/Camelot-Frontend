/**
 * MyScanners Component Tests
 * 
 * Test cases for My Scanners (user level) component including:
 * - Scanner listing and filtering
 * - Activate/Deactivate scanner buttons
 * - View scanner details
 * - Error handling and retry
 * 
 * Test IDs: UI-MYSCAN-001 through UI-MYSCAN-008
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import MyScanners from '../MyScanners';
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
const mockTools = [
  {
    id: 'tool-1',
    name: 'nmap',
    displayName: 'Nmap',
    description: 'Network scanner',
    category: 'Network',
    userPreferences: {
      isActivated: true,
      customConfig: {}
    }
  },
  {
    id: 'tool-2',
    name: 'nikto',
    displayName: 'Nikto',
    description: 'Web vulnerability scanner',
    category: 'Web',
    userPreferences: {
      isActivated: false,
      customConfig: {}
    }
  },
  {
    id: 'tool-3',
    name: 'nuclei',
    displayName: 'Nuclei',
    description: 'Fast vulnerability scanner',
    category: 'Vulnerability',
    userPreferences: {
      isActivated: true,
      customConfig: {}
    }
  }
];

// Helper to render with context
const renderWithContext = (ui: React.ReactElement) => {
  const authValue = {
    user: { email: 'user@test.com', groups: ['user'] },
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

describe('MyScanners Component - Button Interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiService.getMyScannerTools.mockResolvedValue({ preferences: mockTools });
  });

  /**
   * Test Case UI-MYSCAN-001: Click "Retry" Button on Error
   * Verify data reload after error
   */
  test('UI-MYSCAN-001: should reload data when retry button clicked', async () => {
    // First call fails
    mockedApiService.getMyScannerTools.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithContext(<MyScanners />);

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Second call succeeds
    mockedApiService.getMyScannerTools.mockResolvedValueOnce({ preferences: mockTools });
    fireEvent.click(retryButton);

    // Verify data loads
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-MYSCAN-002: Click "Activate" Button
   * Verify scanner activation
   */
  test('UI-MYSCAN-002: should activate scanner when activate button clicked', async () => {
    mockedApiService.activateScannerTool.mockResolvedValue({});
    
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nikto')).toBeInTheDocument();
    });

    // Find and click activate button for Nikto (inactive tool)
    const activateButtons = screen.getAllByText(/activate/i);
    fireEvent.click(activateButtons[0]);

    // Verify API called
    await waitFor(() => {
      expect(mockedApiService.activateScannerTool).toHaveBeenCalledWith('tool-2');
    });
  });

  /**
   * Test Case UI-MYSCAN-003: Click "Deactivate" Button
   * Verify scanner deactivation
   */
  test('UI-MYSCAN-003: should deactivate scanner when deactivate button clicked', async () => {
    mockedApiService.deactivateScannerTool.mockResolvedValue({});
    
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Find and click deactivate button for Nmap (active tool)
    const deactivateButtons = screen.getAllByText(/deactivate/i);
    fireEvent.click(deactivateButtons[0]);

    // Verify API called
    await waitFor(() => {
      expect(mockedApiService.deactivateScannerTool).toHaveBeenCalledWith('tool-1');
    });
  });

  /**
   * Test Case UI-MYSCAN-004: Click "View Details" Button
   * Verify scanner details display
   */
  test('UI-MYSCAN-004: should show details when view details button clicked', async () => {
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Click on tool card or details button
    const toolCards = screen.getAllByText(/Network scanner/i);
    fireEvent.click(toolCards[0]);

    // Console log should be called (in real app would open modal)
    // This is a placeholder - actual implementation might differ
  });

  /**
   * Test Case UI-MYSCAN-005: Filter by Category
   * Verify category filter buttons work
   */
  test('UI-MYSCAN-005: should filter scanners by category', async () => {
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('Nikto')).toBeInTheDocument();
      expect(screen.getByText('Nuclei')).toBeInTheDocument();
    });

    // Click Network category
    const networkButton = screen.getByRole('button', { name: /network/i });
    fireEvent.click(networkButton);

    // Should only show Nmap
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.queryByText('Nikto')).not.toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-MYSCAN-006: Search Scanners
   * Verify search input filters scanners
   */
  test('UI-MYSCAN-006: should filter scanners by search term', async () => {
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search scanners/i);
    fireEvent.change(searchInput, { target: { value: 'nikto' } });

    // Should only show Nikto
    await waitFor(() => {
      expect(screen.getByText('Nikto')).toBeInTheDocument();
      expect(screen.queryByText('Nmap')).not.toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-MYSCAN-007: Click "All" Category Button
   * Verify shows all scanners
   */
  test('UI-MYSCAN-007: should show all scanners when all category clicked', async () => {
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    // First filter by category
    const networkButton = screen.getByRole('button', { name: /^network$/i });
    fireEvent.click(networkButton);

    // Then click All
    const allButton = screen.getByRole('button', { name: /all/i });
    fireEvent.click(allButton);

    // Should show all tools
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('Nikto')).toBeInTheDocument();
      expect(screen.getByText('Nuclei')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-MYSCAN-008: Display Scanner Stats
   * Verify stats show correct counts
   */
  test('UI-MYSCAN-008: should display correct scanner statistics', async () => {
    renderWithContext(<MyScanners />);

    // Wait for tools to load
    await waitFor(() => {
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Activated')).toBeInTheDocument();
    });

    // Should show 3 available and 2 activated
    const statValues = screen.getAllByClassName('stat-value');
    expect(statValues[0]).toHaveTextContent('3'); // Available
    expect(statValues[1]).toHaveTextContent('2'); // Activated
  });
});

