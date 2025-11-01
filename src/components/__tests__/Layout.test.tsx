/**
 * UI Button Tests for Layout/Navigation Component
 * Test IDs: UI-NAV-001 through UI-NAV-012
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Layout from '../Layout';
import { AuthContext } from '../../contexts/AuthContext';
import '@testing-library/jest-dom';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

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

const renderLayout = (children: React.ReactNode = <div>Content</div>) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContext}>
        <Layout>{children}</Layout>
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Layout/Navigation - UI Button Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Test Case UI-NAV-001: Click "Home" Navigation Link
   */
  test('UI-NAV-001: Navigates to home when Home link clicked', async () => {
    renderLayout();
    
    const homeLink = screen.getByRole('link', { name: /home|dashboard/i });
    fireEvent.click(homeLink);

    await waitFor(() => {
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  /**
   * Test Case UI-NAV-002: Click "Scans" Navigation Link
   */
  test('UI-NAV-002: Navigates to scans when Scans link clicked', async () => {
    renderLayout();
    
    const scansLink = screen.getByRole('link', { name: /scans/i });
    fireEvent.click(scansLink);

    await waitFor(() => {
      expect(scansLink).toHaveAttribute('href', '/scans');
    });
  });

  /**
   * Test Case UI-NAV-003: Click "Findings" Navigation Link
   */
  test('UI-NAV-003: Navigates to findings when Findings link clicked', async () => {
    renderLayout();
    
    const findingsLink = screen.getByRole('link', { name: /findings/i });
    fireEvent.click(findingsLink);

    await waitFor(() => {
      expect(findingsLink).toHaveAttribute('href', '/findings');
    });
  });

  /**
   * Test Case UI-NAV-004: Click "Scanner Hub" Navigation Link
   */
  test('UI-NAV-004: Navigates to scanner hub when Scanner Hub link clicked', async () => {
    renderLayout();
    
    const scannerHubLink = screen.getByRole('link', { name: /scanner hub|scanners/i });
    fireEvent.click(scannerHubLink);

    await waitFor(() => {
      expect(scannerHubLink).toHaveAttribute('href', '/scanner-hub');
    });
  });

  /**
   * Test Case UI-NAV-005: Click "User Management" Navigation Link (Admin)
   */
  test('UI-NAV-005: Navigates to user management when link clicked (admin)', async () => {
    const adminContext = {
      ...mockAuthContext,
      user: { ...mockAuthContext.user, groups: ['admin'] },
    };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={adminContext}>
          <Layout>Content</Layout>
        </AuthContext.Provider>
      </BrowserRouter>
    );
    
    const userMgmtLink = screen.getByRole('link', { name: /user management|users/i });
    fireEvent.click(userMgmtLink);

    await waitFor(() => {
      expect(userMgmtLink).toHaveAttribute('href', '/admin/users');
    });
  });

  /**
   * Test Case UI-NAV-006: Click "Settings" Navigation Link
   */
  test('UI-NAV-006: Navigates to settings when Settings link clicked', async () => {
    renderLayout();
    
    const settingsLink = screen.getByRole('link', { name: /settings/i });
    fireEvent.click(settingsLink);

    await waitFor(() => {
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  /**
   * Test Case UI-NAV-007: Click User Avatar/Name Dropdown
   */
  test('UI-NAV-007: Opens dropdown when user avatar clicked', async () => {
    renderLayout();
    
    const userAvatar = screen.getByText(/john|johndoe/i);
    fireEvent.click(userAvatar);

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });
  });

  /**
   * Test Case UI-NAV-008: Click "Profile" in User Dropdown
   */
  test('UI-NAV-008: Navigates to profile when Profile clicked in dropdown', async () => {
    renderLayout();
    
    const userAvatar = screen.getByText(/john|johndoe/i);
    fireEvent.click(userAvatar);

    await waitFor(() => {
      expect(screen.getByText(/profile/i)).toBeInTheDocument();
    });

    const profileLink = screen.getByRole('link', { name: /profile/i });
    fireEvent.click(profileLink);

    await waitFor(() => {
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  /**
   * Test Case UI-NAV-009: Click "Logout" in User Dropdown
   */
  test('UI-NAV-009: Logs out when Logout clicked in dropdown', async () => {
    renderLayout();
    
    const userAvatar = screen.getByText(/john|johndoe/i);
    fireEvent.click(userAvatar);

    await waitFor(() => {
      expect(screen.getByText(/logout/i)).toBeInTheDocument();
    });

    const logoutButton = screen.getByRole('button', { name: /logout/i });
    fireEvent.click(logoutButton);

    await waitFor(() => {
      expect(mockAuthContext.logout).toHaveBeenCalled();
    });
  });

  /**
   * Test Case UI-NAV-010: Click Mobile Menu Toggle (Hamburger)
   */
  test('UI-NAV-010: Opens mobile menu when hamburger clicked', async () => {
    // Mock mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    renderLayout();
    
    const hamburgerButton = screen.getByRole('button', { name: /menu|navigation/i });
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile');
      expect(mobileMenu).toHaveClass(/open|visible|active/i);
    });
  });

  /**
   * Test Case UI-NAV-011: Click "×" to Close Mobile Menu
   */
  test('UI-NAV-011: Closes mobile menu when X clicked', async () => {
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    renderLayout();
    
    const hamburgerButton = screen.getByRole('button', { name: /menu|navigation/i });
    fireEvent.click(hamburgerButton);

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close|×/i });
      expect(closeButton).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close|×/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      const mobileMenu = document.querySelector('.mobile-menu, .nav-mobile');
      expect(mobileMenu).not.toHaveClass(/open|visible|active/i);
    });
  });

  /**
   * Test Case UI-NAV-012: Click Notification Bell Icon
   */
  test('UI-NAV-012: Opens notifications when bell icon clicked', async () => {
    renderLayout();
    
    const notificationBell = screen.getByRole('button', { name: /notifications/i });
    fireEvent.click(notificationBell);

    await waitFor(() => {
      expect(screen.getByText(/notifications|no new notifications/i)).toBeInTheDocument();
    });
  });

  /**
   * Additional Test: Click Logo to Navigate Home
   */
  test('Navigates to home when logo clicked', async () => {
    renderLayout();
    
    const logo = screen.getByAltText(/logo|camelot/i);
    const logoLink = logo.closest('a');
    
    if (logoLink) {
      fireEvent.click(logoLink);

      await waitFor(() => {
        expect(logoLink).toHaveAttribute('href', '/');
      });
    }
  });

  /**
   * Additional Test: Active Link Highlighting
   */
  test('Highlights active navigation link', async () => {
    renderLayout();
    
    const homeLink = screen.getByRole('link', { name: /home|dashboard/i });
    
    // Check for active class (implementation dependent)
    expect(homeLink).toHaveClass(/active|current/i);
  });

  /**
   * Additional Test: Keyboard Navigation
   */
  test('Supports keyboard navigation (Tab key)', async () => {
    renderLayout();
    
    const homeLink = screen.getByRole('link', { name: /home|dashboard/i });
    homeLink.focus();

    expect(document.activeElement).toBe(homeLink);

    // Press Tab to move to next link
    fireEvent.keyDown(document.activeElement!, { key: 'Tab', code: 'Tab' });

    // Next focusable element should be focused
    const scansLink = screen.getByRole('link', { name: /scans/i });
    expect(document.activeElement).toBe(scansLink);
  });
});

