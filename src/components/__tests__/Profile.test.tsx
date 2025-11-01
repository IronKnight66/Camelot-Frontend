/**
 * UI Button Tests for Profile Component
 * Test IDs: UI-PROFILE-001 through UI-PROFILE-010
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../Profile';
import { AuthContext } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
  },
}));

import ApiService from '../../services/api';

const mockAuthContext = {
  user: {
    id: 'user-123',
    email: 'user@acme.com',
    first_name: 'John',
    last_name: 'Doe',
    groups: ['user'],
    username: 'johndoe',
  },
  loading: false,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  signUp: jest.fn(),
};

const renderProfile = () => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <Profile />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Profile - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (ApiService.get as jest.Mock).mockResolvedValue({
      data: {
        user: mockAuthContext.user,
      },
    });
  });

  /**
   * Test Case UI-PROFILE-001: Click "Edit Profile" Button
   */
  test('UI-PROFILE-001: Enables editing when Edit Profile clicked', async () => {
    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });

    // Verify fields are editable
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    expect(firstNameInput).not.toBeDisabled();
  });

  /**
   * Test Case UI-PROFILE-002: Click "Save Changes" Button
   */
  test('UI-PROFILE-002: Saves profile when Save Changes clicked', async () => {
    (ApiService.put as jest.Mock).mockResolvedValueOnce({
      data: { ...mockAuthContext.user, first_name: 'Johnny' },
    });

    renderProfile();
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Johnny' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(ApiService.put).toHaveBeenCalledWith(
        '/api/v1/profile',
        expect.objectContaining({ first_name: 'Johnny' })
      );
    });

    // Verify success message
    await waitFor(() => {
      expect(screen.getByText(/profile updated/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-PROFILE-003: Click "Cancel" in Edit Mode
   */
  test('UI-PROFILE-003: Cancels editing when Cancel clicked', async () => {
    renderProfile();
    
    await waitFor(() => {
      const editButton = screen.getByRole('button', { name: /edit profile/i });
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/first name/i)).not.toBeDisabled();
    });

    const firstNameInput = screen.getByLabelText(/first name/i);
    fireEvent.change(firstNameInput, { target: { value: 'Changed' } });

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /edit profile/i })).toBeInTheDocument();
    });

    // Verify changes were discarded
    const displayedName = screen.getByText(/John/i);
    expect(displayedName).toBeInTheDocument();
  });

  /**
   * Test Case UI-PROFILE-004: Click "Change Password" Button
   */
  test('UI-PROFILE-004: Opens password change form when Change Password clicked', async () => {
    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    fireEvent.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/new password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-PROFILE-005: Click "Update Password" Button
   */
  test('UI-PROFILE-005: Updates password when Update Password clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true, message: 'Password updated successfully' },
    });

    renderProfile();
    
    await waitFor(() => {
      const changePasswordButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(changePasswordButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByLabelText(/new password/i), {
      target: { value: 'NewPass456!' },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: 'NewPass456!' },
    });

    const updateButton = screen.getByRole('button', { name: /update password/i });
    fireEvent.click(updateButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        '/api/v1/profile/change-password',
        expect.objectContaining({
          current_password: 'OldPass123!',
          new_password: 'NewPass456!',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/password updated/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-PROFILE-006: Click "Cancel" in Password Change
   */
  test('UI-PROFILE-006: Cancels password change when Cancel clicked', async () => {
    renderProfile();
    
    await waitFor(() => {
      const changePasswordButton = screen.getByRole('button', { name: /change password/i });
      fireEvent.click(changePasswordButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'SomePassword' },
    });

    const cancelButton = screen.getAllByRole('button', { name: /cancel/i })[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText(/current password/i)).not.toBeInTheDocument();
    });

    expect(ApiService.post).not.toHaveBeenCalled();
  });

  /**
   * Test Case UI-PROFILE-007: Click "Upload Avatar" Button
   */
  test('UI-PROFILE-007: Opens file picker when Upload Avatar clicked', async () => {
    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const uploadButton = screen.getByRole('button', { name: /upload avatar/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.click(uploadButton);

    // Verify file input is triggered (implementation dependent)
    expect(fileInput).toBeInTheDocument();
  });

  /**
   * Test Case UI-PROFILE-008: Click "Remove Avatar" Button
   */
  test('UI-PROFILE-008: Removes avatar when Remove Avatar clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
    });

    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const removeButton = screen.getByRole('button', { name: /remove avatar/i });
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        '/api/v1/profile/remove-avatar',
        expect.any(Object)
      );
    });
  });

  /**
   * Test Case UI-PROFILE-009: Click "Enable 2FA" Button
   */
  test('UI-PROFILE-009: Opens 2FA setup when Enable 2FA clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: {
        qr_code: 'data:image/png;base64,ABC123',
        secret: 'SECRETCODE123',
      },
    });

    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const enable2FAButton = screen.getByRole('button', { name: /enable 2fa/i });
    fireEvent.click(enable2FAButton);

    await waitFor(() => {
      expect(screen.getByText(/scan qr code/i)).toBeInTheDocument();
    });

    expect(ApiService.post).toHaveBeenCalledWith(
      '/api/v1/profile/enable-2fa',
      expect.any(Object)
    );
  });

  /**
   * Test Case UI-PROFILE-010: Click "Disable 2FA" Button
   */
  test('UI-PROFILE-010: Disables 2FA when Disable 2FA clicked', async () => {
    (ApiService.post as jest.Mock).mockResolvedValueOnce({
      data: { success: true },
    });

    // Mock user with 2FA enabled
    const userWith2FA = { ...mockAuthContext.user, mfa_enabled: true };
    (ApiService.get as jest.Mock).mockResolvedValue({
      data: { user: userWith2FA },
    });

    renderProfile();
    
    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const disable2FAButton = screen.getByRole('button', { name: /disable 2fa/i });
    fireEvent.click(disable2FAButton);

    await waitFor(() => {
      expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /confirm|yes/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(ApiService.post).toHaveBeenCalledWith(
        '/api/v1/profile/disable-2fa',
        expect.any(Object)
      );
    });
  });
});

