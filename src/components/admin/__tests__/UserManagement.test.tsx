/**
 * UI Button Tests for UserManagement Component
 * Test IDs: UI-USER-001 through UI-USER-016
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../UserManagement';
import { AuthContext } from '../../../contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock API service
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
    groups: ['admin'],
    username: 'admin',
  },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signUp: jest.fn(),
};

const mockUsers = [
  {
    id: 'user-1',
    email: 'user1@acme.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    groups: ['user'],
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'user2@acme.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    groups: ['admin'],
    created_at: '2025-01-02T00:00:00Z',
  },
];

const renderUserManagement = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <UserManagement />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('UserManagement - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.get as jest.Mock).mockResolvedValue({ data: { users: mockUsers } });
  });

  /**
   * Test Case UI-USER-001: Click "+ Add User" Button
   */
  test('UI-USER-001: Opens create user modal when Add User button clicked', async () => {
    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add user/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByText(/create user/i)).toBeInTheDocument();
    });

    // Verify form fields
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  /**
   * Test Case UI-USER-002: Click "Create User" in Modal
   */
  test('UI-USER-002: Creates user when Create User button clicked', async () => {
    const mockCreateResponse = {
      data: {
        user: {
          id: 'new-user',
          email: 'newuser@acme.com',
          first_name: 'New',
          last_name: 'User',
        },
        temporary_password: 'TempPass123!',
      },
    };
    
    (ApiService.post as jest.Mock).mockResolvedValueOnce(mockCreateResponse);

    renderUserManagement();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Fill in form
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'newuser@acme.com' },
    });
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'New' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'User' },
    });

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith('/api/v1/users', expect.any(Object));
    });

    // Verify temporary password displayed
    await waitFor(() => {
      expect(screen.getByText(/temporary password/i)).toBeInTheDocument();
      expect(screen.getByText('TempPass123!')).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-USER-003: Click "Done" After User Creation
   */
  test('UI-USER-003: Closes modal and refreshes list when Done clicked', async () => {
    const mockCreateResponse = {
      data: {
        user: { id: 'new-user', email: 'newuser@acme.com' },
        temporary_password: 'TempPass123!',
      },
    };
    
    (ApiService.post as jest.Mock).mockResolvedValueOnce(mockCreateResponse);
    (ApiService.get as jest.Mock)
      .mockResolvedValueOnce({ data: { users: mockUsers } })
      .mockResolvedValueOnce({ data: { users: [...mockUsers, mockCreateResponse.data.user] } });

    renderUserManagement();
    
    // Open modal and create user
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@acme.com' },
      });
    });

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/temporary password/i)).toBeInTheDocument();
    });

    // Click Done
    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);

    await waitFor(() => {
      expect(screen.queryByText(/temporary password/i)).not.toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-USER-004: Click "Cancel" in Create Modal
   */
  test('UI-USER-004: Closes modal without creating when Cancel clicked', async () => {
    renderUserManagement();
    
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    // Enter some data
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@acme.com' },
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    // Verify no API call made
    expect(ApiService.post).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-USER-006: Click "Edit" Button in User Row
   */
  test('UI-USER-006: Opens edit modal when Edit button clicked', async () => {
    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Find and click edit button for first user
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    // Verify form pre-filled
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    expect(emailInput.value).toBe('user1@acme.com');
  });

  /**
   * Test Case UI-USER-007: Click "Save Changes" in Edit Modal
   */
  test('UI-USER-007: Updates user when Save Changes clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockUsers[0], first_name: 'Johnny' },
    });

    renderUserManagement();
    
    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      fireEvent.click(editButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    // Change first name
    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

    // Click Save
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/users/${mockUsers[0].id}`,
        expect.objectContaining({ first_name: 'Johnny' })
      );
    });
  });

  /**
   * Test Case UI-USER-009: Click "Delete" Button
   */
  test('UI-USER-009: Opens delete confirmation when Delete clicked', async () => {
    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Find and click delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
      expect(screen.getByText(/delete user/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-USER-010: Click "Confirm Delete" in Confirmation
   */
  test('UI-USER-010: Deletes user when confirmed', async () => {
    (ApiService.delete as jest.Mock).mockResolvedValueOnce({ data: { success: true } });

    renderUserManagement();
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Confirm delete
    const confirmButton = screen.getByRole('button', { name: /confirm|yes|delete/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ApiService.delete).toHaveBeenCalledWith(`/api/v1/users/${mockUsers[0].id}`);
    });
  });

  /**
   * Test Case UI-USER-011: Click "Cancel" in Delete Confirmation
   */
  test('UI-USER-011: Closes confirmation without deleting when Cancel clicked', async () => {
    renderUserManagement();
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /cancel|no/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument();
    });

    expect(ApiService.delete).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-USER-013: Click "Reset Password" Button
   */
  test('UI-USER-013: Sends password reset when Reset Password clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: { temporary_password: 'NewTemp456!' },
    });

    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Find and click reset password button
    const resetButtons = screen.getAllByRole('button', { name: /reset password/i });
    fireEvent.click(resetButtons[0]);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        `/api/v1/users/${mockUsers[0].id}/reset-password`,
        expect.any(Object)
      );
    });

    // Verify temporary password displayed
    await waitFor(() => {
      expect(screen.getByText(/new temporary password/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-USER-014: Click "Enable" Button
   */
  test('UI-USER-014: Enables user when Enable button clicked', async () => {
    const inactiveUser = { ...mockUsers[0], is_active: false };
    (ApiService.get as jest.Mock).mockResolvedValueOnce({
      data: { users: [inactiveUser, mockUsers[1]] },
    });
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...inactiveUser, is_active: true },
    });

    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Find and click enable button
    const enableButton = screen.getByRole('button', { name: /enable/i });
    fireEvent.click(enableButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/users/${inactiveUser.id}`,
        expect.objectContaining({ is_active: true })
      );
    });
  });

  /**
   * Test Case UI-USER-015: Click "Disable" Button
   */
  test('UI-USER-015: Disables user when Disable button clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockUsers[0], is_active: false },
    });

    renderUserManagement();
    
    await waitFor(() => {
      expect(screen.getByText('John')).toBeInTheDocument();
    });

    // Find and click disable button
    const disableButton = screen.getByRole('button', { name: /disable/i });
    fireEvent.click(disableButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        `/api/v1/users/${mockUsers[0].id}`,
        expect.objectContaining({ is_active: false })
      );
    });
  });

  /**
   * Test Case UI-USER-016: Click "Copy" Button for Temporary Password
   */
  test('UI-USER-016: Copies temporary password to clipboard when Copy clicked', async () => {
    const mockClipboard = {
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    Object.assign(navigator, { clipboard: mockClipboard });

    const mockCreateResponse = {
      data: {
        user: { id: 'new-user', email: 'newuser@acme.com' },
        temporary_password: 'TempPass123!',
      },
    };
    
    (ApiService.post as jest.Mock).mockResolvedValueOnce(mockCreateResponse);

    renderUserManagement();
    
    // Create user to get temp password
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add user/i });
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'newuser@acme.com' },
      });
    });

    const createButton = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('TempPass123!')).toBeInTheDocument();
    });

    // Click copy button
    const copyButton = screen.getByRole('button', { name: /copy/i });
    fireEvent.click(copyButton);

    expect(mockClipboard.writeText).toHaveBeenCalledWith('TempPass123!');
  });
});

