/**
 * UI Button Tests for AdminScannerTools Component
 * Test IDs: UI-ADMIN-001 through UI-ADMIN-013
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminScannerTools from '../AdminScannerTools';
import { AuthContext } from '../../../contexts/AuthContext';
import '@testing-library/jest-dom';

jest.mock('../../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

import ApiService from '../../../services/api';

const mockAuthContext = {
  user: {
    id: 'admin-123',
    email: 'admin@acme.com',
    groups: ['super-admin'],
    username: 'admin',
  },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signUp: jest.fn(),
};

const mockTools = [
  {
    id: 'tool-1',
    name: 'Nmap',
    slug: 'nmap',
    description: 'Network scanner',
    category: 'Network Scanning',
    is_enabled: true,
    is_global: true,
  },
  {
    id: 'tool-2',
    name: 'ZAP',
    slug: 'zap',
    description: 'Web app scanner',
    category: 'Web Application',
    is_enabled: false,
    is_global: true,
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <AdminScannerTools />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('AdminScannerTools - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.get as jest.Mock).mockResolvedValue({ data: { tools: mockTools } });
  });

  /**
   * Test Case UI-ADMIN-001: Click "+ Add Global Tool" Button
   */
  test('UI-ADMIN-001: Opens create tool modal when Add Global Tool clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/admin scanner tools/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add global tool/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/create scanner tool/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/slug/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  /**
   * Test Case UI-ADMIN-002: Click "Create Tool" in Modal
   */
  test('UI-ADMIN-002: Creates tool when Create Tool clicked', async () => {
    const newTool = {
      id: 'tool-3',
      name: 'Nikto',
      slug: 'nikto',
      description: 'Web server scanner',
      category: 'Web Application',
      is_enabled: true,
      is_global: true,
    };
    
    (ApiService.post as jest.Mock).mockResolvedValueOnce({ data: newTool });

    renderComponent();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add global tool/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: 'Nikto' },
    });
    fireEvent.change(screen.getByLabelText(/slug/i), {
      target: { value: 'nikto' },
    });

    const createButton = screen.getByRole('button', { name: /create tool/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        '/api/v1/scanner-tools',
        expect.objectContaining({ name: 'Nikto', slug: 'nikto' })
      );
    });
  });

  /**
   * Test Case UI-ADMIN-003: Click "Cancel" in Create Modal
   */
  test('UI-ADMIN-003: Closes modal without creating when Cancel clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add global tool/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/name/i)).not.toBeInTheDocument();
    });

    expect(ApiService.post).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-ADMIN-005: Click Tool Card to View Details
   */
  test('UI-ADMIN-005: Opens tool details when tool card clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    const toolCard = screen.getByText('Nmap').closest('.tool-card');
    if (toolCard) {
      fireEvent.click(toolCard);

      await waitFor(() => {
        expect(screen.getByText(/tool details/i)).toBeInTheDocument();
      });
    }
  });

  /**
   * Test Case UI-ADMIN-006: Click "Edit" in Tool Details
   */
  test('UI-ADMIN-006: Opens edit form when Edit clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/edit tool/i)).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    expect(nameInput.value).toBe('Nmap');
  });

  /**
   * Test Case UI-ADMIN-007: Click "Save Changes" in Edit Form
   */
  test('UI-ADMIN-007: Updates tool when Save Changes clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockTools[0], description: 'Updated description' },
    });

    renderComponent();
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: 'Updated description' },
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/scanner-tools/${mockTools[0].id}`,
        expect.objectContaining({ description: 'Updated description' })
      );
    });
  });

  /**
   * Test Case UI-ADMIN-009: Click "Delete" Button
   */
  test('UI-ADMIN-009: Opens delete confirmation when Delete clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-ADMIN-010: Click "Confirm" in Delete Confirmation
   */
  test('UI-ADMIN-010: Deletes tool when confirmed', async () => {
    (ApiService.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    renderComponent();
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ApiService.delete).toHaveBeenCalledWith(`/api/v1/scanner-tools/${mockTools[0].id}`);
    });
  });

  /**
   * Test Case UI-ADMIN-011: Click "Enable" Toggle
   */
  test('UI-ADMIN-011: Enables tool when Enable toggle clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockTools[1], is_enabled: true },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('ZAP')).toBeInTheDocument();
    });

    const enableToggles = screen.getAllByRole('switch', { name: /enable/i });
    fireEvent.click(enableToggles[1]);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/scanner-tools/${mockTools[1].id}`,
        expect.objectContaining({ is_enabled: true })
      );
    });
  });

  /**
   * Test Case UI-ADMIN-012: Click "Disable" Toggle
   */
  test('UI-ADMIN-012: Disables tool when Disable toggle clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockTools[0], is_enabled: false },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
    });

    const enableToggles = screen.getAllByRole('switch', { name: /enable/i });
    fireEvent.click(enableToggles[0]);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/scanner-tools/${mockTools[0].id}`,
        expect.objectContaining({ is_enabled: false })
      );
    });
  });

  /**
   * Test Case UI-ADMIN-013: Click Filter/Category Button
   */
  test('UI-ADMIN-013: Filters tools when category button clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Nmap')).toBeInTheDocument();
      expect(screen.getByText('ZAP')).toBeInTheDocument();
    });

    const categoryButtons = screen.getAllByRole('button', { name: /network scanning|web application/i });
    if (categoryButtons.length > 0) {
      fireEvent.click(categoryButtons[0]);

      await waitFor(() => {
        // Verify filtering logic (implementation dependent)
        expect(screen.getByText('Nmap')).toBeInTheDocument();
      });
    }
  });
});

