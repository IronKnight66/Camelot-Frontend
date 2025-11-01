/**
 * UI Button Tests for APIKeysSettings Component
 * Test IDs: UI-APIKEY-001 through UI-APIKEY-015
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import APIKeysSettings from '../APIKeysSettings';
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
    id: 'user-123',
    email: 'user@acme.com',
    groups: ['admin'],
    username: 'user',
  },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signUp: jest.fn(),
};

const mockAPIKeys = [
  {
    id: 'key-1',
    provider: 'openai',
    key_name: 'OpenAI Production',
    masked_key: 'sk-...xyz',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    last_used: '2025-01-10T12:00:00Z',
  },
  {
    id: 'key-2',
    provider: 'anthropic',
    key_name: 'Anthropic Development',
    masked_key: 'sk-...abc',
    is_active: false,
    created_at: '2025-01-02T00:00:00Z',
    last_used: null,
  },
];

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <APIKeysSettings />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('APIKeysSettings - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.get as jest.Mock).mockResolvedValue({ data: { api_keys: mockAPIKeys } });
  });

  /**
   * Test Case UI-APIKEY-001: Click "+ Add API Key" Button
   */
  test('UI-APIKEY-001: Opens add API key modal when Add API Key clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/api keys/i)).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add api key/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/add new api key/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
  });

  /**
   * Test Case UI-APIKEY-002: Click "Add Key" in Modal
   */
  test('UI-APIKEY-002: Adds API key when Add Key clicked', async () => {
    const newKey = {
      id: 'key-3',
      provider: 'bedrock',
      key_name: 'AWS Bedrock',
      masked_key: 'arn:...def',
      is_active: true,
    };
    
    (ApiService.post as jest.Mock).mockResolvedValueOnce({ data: newKey });

    renderComponent();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add api key/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/provider/i), {
      target: { value: 'bedrock' },
    });
    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'AWS Bedrock' },
    });
    fireEvent.change(screen.getByLabelText(/api key/i), {
      target: { value: 'arn:aws:bedrock:us-east-1:123:key' },
    });

    const addButton = screen.getByRole('button', { name: /^add key$/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        '/api/v1/tenant/api-keys',
        expect.objectContaining({
          provider: 'bedrock',
          key_name: 'AWS Bedrock',
        })
      );
    });
  });

  /**
   * Test Case UI-APIKEY-003: Click "Cancel" in Add Modal
   */
  test('UI-APIKEY-003: Closes modal without adding when Cancel clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add api key/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/provider/i)).not.toBeInTheDocument();
    });

    expect(ApiService.post).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-APIKEY-005: Click "Test Connection" Button
   */
  test('UI-APIKEY-005: Tests API key connection when Test Connection clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: 'Connection successful' },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI Production')).toBeInTheDocument();
    });

    const testButtons = screen.getAllByRole('button', { name: /test connection/i });
    fireEvent.click(testButtons[0]);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        `/api/v1/tenant/api-keys/${mockAPIKeys[0].id}/test`,
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/connection successful/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-APIKEY-006: Click "Edit" Button
   */
  test('UI-APIKEY-006: Opens edit modal when Edit clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI Production')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/edit api key/i)).toBeInTheDocument();
    });

    const keyNameInput = screen.getByLabelText(/key name/i) as HTMLInputElement;
    expect(keyNameInput.value).toBe('OpenAI Production');
  });

  /**
   * Test Case UI-APIKEY-007: Click "Save Changes" in Edit Modal
   */
  test('UI-APIKEY-007: Updates API key when Save Changes clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockAPIKeys[0], key_name: 'OpenAI Staging' },
    });

    renderComponent();
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/key name/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/key name/i), {
      target: { value: 'OpenAI Staging' },
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/tenant/api-keys/${mockAPIKeys[0].id}`,
        expect.objectContaining({ key_name: 'OpenAI Staging' })
      );
    });
  });

  /**
   * Test Case UI-APIKEY-009: Click "Delete" Button
   */
  test('UI-APIKEY-009: Opens delete confirmation when Delete clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI Production')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/delete api key/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-APIKEY-010: Click "Confirm" in Delete Confirmation
   */
  test('UI-APIKEY-010: Deletes API key when confirmed', async () => {
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
      expect(ApiService.delete).toHaveBeenCalledWith(
        `/api/v1/tenant/api-keys/${mockAPIKeys[0].id}`
      );
    });
  });

  /**
   * Test Case UI-APIKEY-012: Click "Enable" Toggle
   */
  test('UI-APIKEY-012: Enables API key when Enable toggle clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockAPIKeys[1], is_active: true },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Anthropic Development')).toBeInTheDocument();
    });

    const enableToggles = screen.getAllByRole('switch');
    fireEvent.click(enableToggles[1]);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/tenant/api-keys/${mockAPIKeys[1].id}`,
        expect.objectContaining({ is_active: true })
      );
    });
  });

  /**
   * Test Case UI-APIKEY-013: Click "Disable" Toggle
   */
  test('UI-APIKEY-013: Disables API key when Disable toggle clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockAPIKeys[0], is_active: false },
    });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI Production')).toBeInTheDocument();
    });

    const enableToggles = screen.getAllByRole('switch');
    fireEvent.click(enableToggles[0]);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/tenant/api-keys/${mockAPIKeys[0].id}`,
        expect.objectContaining({ is_active: false })
      );
    });
  });

  /**
   * Test Case UI-APIKEY-014: Click "Show/Hide" Key Toggle
   */
  test('UI-APIKEY-014: Toggles key visibility when Show/Hide clicked', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('sk-...xyz')).toBeInTheDocument();
    });

    const showButtons = screen.getAllByRole('button', { name: /show|hide/i });
    if (showButtons.length > 0) {
      fireEvent.click(showButtons[0]);

      // Verify visibility toggle (implementation dependent)
      await waitFor(() => {
        expect(screen.getByText(/hidden|visible/i)).toBeInTheDocument();
      });
    }
  });

  /**
   * Test Case UI-APIKEY-015: Click "Copy" Key Button
   */
  test('UI-APIKEY-015: Copies API key to clipboard when Copy clicked', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('OpenAI Production')).toBeInTheDocument();
    });

    const copyButtons = screen.getAllByRole('button', { name: /copy/i });
    if (copyButtons.length > 0) {
      fireEvent.click(copyButtons[0]);

      expect(mockClipboard.writeText).toHaveBeenCalled();
    }
  });
});

