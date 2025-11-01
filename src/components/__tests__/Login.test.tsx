/**
 * Login Component Tests
 * 
 * Test cases for Login component including:
 * - Sign in functionality
 * - Sign up functionality
 * - Forgot password flow
 * - Form validation
 * - Error handling
 * 
 * Test IDs: UI-LOGIN-001 through UI-LOGIN-012
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthContext } from '../../contexts/AuthContext';

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Helper to render with context
const renderWithContext = (ui: React.ReactElement, authValue: any = {}) => {
  const defaultAuthValue = {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
    user: null,
    loading: false,
    ...authValue,
  };

  return render(
    <BrowserRouter>
      <AuthContext.Provider value={defaultAuthValue}>
        {ui}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==================== Sign In Tests ====================

  test('UI-LOGIN-001: Click Sign In button with valid credentials', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ success: true });
    
    renderWithContext(<Login />, { signIn: mockSignIn });

    // Enter credentials
    const usernameInput = screen.getByLabelText(/username|email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Click sign in
    fireEvent.click(signInButton);

    // Verify
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('UI-LOGIN-002: Toggle to sign up mode', () => {
    renderWithContext(<Login />);

    // Find and click sign up link
    const signUpLink = screen.getByText(/don't have an account/i);
    fireEvent.click(signUpLink);

    // Verify sign up form is displayed
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  test('UI-LOGIN-003: Toggle back to sign in mode from sign up', () => {
    renderWithContext(<Login />);

    // Toggle to sign up
    const signUpLink = screen.getByText(/don't have an account/i);
    fireEvent.click(signUpLink);

    // Toggle back to sign in
    const signInLink = screen.getByText(/already have an account/i);
    fireEvent.click(signInLink);

    // Verify sign in form is displayed
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('UI-LOGIN-004: Click Sign Up button creates account', async () => {
    const mockSignUp = jest.fn().mockResolvedValue({ success: true });
    
    renderWithContext(<Login />, { signUp: mockSignUp });

    // Toggle to sign up mode
    const signUpLink = screen.getByText(/don't have an account/i);
    fireEvent.click(signUpLink);

    // Enter sign up details
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signUpButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(usernameInput, { target: { value: 'newuser' } });
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Password123!' } });

    // Click sign up
    fireEvent.click(signUpButton);

    // Verify
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalled();
    });
  });

  test('UI-LOGIN-005: Click Forgot Password link', () => {
    renderWithContext(<Login />);

    // Click forgot password
    const forgotPasswordLink = screen.getByText(/forgot password/i);
    fireEvent.click(forgotPasswordLink);

    // Verify forgot password form is displayed
    expect(screen.getByText(/reset password/i)).toBeInTheDocument();
  });

  // ==================== Form Validation Tests ====================

  test('UI-LOGIN-006: Display error for empty username', async () => {
    renderWithContext(<Login />);

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/username.*required/i) || screen.getByText(/email.*required/i)).toBeInTheDocument();
    });
  });

  test('UI-LOGIN-007: Display error for empty password', async () => {
    renderWithContext(<Login />);

    const usernameInput = screen.getByLabelText(/username|email/i);
    fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });

    const signInButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(signInButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/password.*required/i)).toBeInTheDocument();
    });
  });

  test('UI-LOGIN-008: Display error for invalid email format', async () => {
    renderWithContext(<Login />);

    // Toggle to sign up
    const signUpLink = screen.getByText(/don't have an account/i);
    fireEvent.click(signUpLink);

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const signUpButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(signUpButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  // ==================== Loading State Tests ====================

  test('UI-LOGIN-009: Display loading state during sign in', async () => {
    const mockSignIn = jest.fn(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));
    
    renderWithContext(<Login />, { signIn: mockSignIn });

    const usernameInput = screen.getByLabelText(/username|email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    // Verify loading state
    expect(screen.getByText(/signing in/i) || signInButton).toBeDisabled();
  });

  // ==================== Error Handling Tests ====================

  test('UI-LOGIN-010: Display error message on sign in failure', async () => {
    const mockSignIn = jest.fn().mockRejectedValue(new Error('Invalid credentials'));
    
    renderWithContext(<Login />, { signIn: mockSignIn });

    const usernameInput = screen.getByLabelText(/username|email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(signInButton);

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials|login failed/i)).toBeInTheDocument();
    });
  });

  // ==================== Password Visibility Tests ====================

  test('UI-LOGIN-011: Toggle password visibility', () => {
    renderWithContext(<Login />);

    const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
    const toggleButton = screen.getByRole('button', { name: /show|hide password/i });

    // Initially password should be hidden
    expect(passwordInput.type).toBe('password');

    // Toggle to show
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    // Toggle to hide
    fireEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  // ==================== Keyboard Navigation Tests ====================

  test('UI-LOGIN-012: Submit form with Enter key', async () => {
    const mockSignIn = jest.fn().mockResolvedValue({ success: true });
    
    renderWithContext(<Login />, { signIn: mockSignIn });

    const usernameInput = screen.getByLabelText(/username|email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(usernameInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Press Enter on password field
    fireEvent.keyPress(passwordInput, { key: 'Enter', code: 13, charCode: 13 });

    // Verify
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalled();
    });
  });
});

