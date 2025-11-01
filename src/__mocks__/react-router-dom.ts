/**
 * Manual mock for react-router-dom to work with Jest
 * This file is automatically used by Jest when react-router-dom is mocked
 */

import React from 'react';

export const mockNavigate = jest.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
};

export const mockParams = {};

export const useNavigate = () => mockNavigate;

export const useLocation = () => mockLocation;

export const useParams = () => mockParams;

export const BrowserRouter = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export const Routes = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, children);
};

export const Route = ({ element }: { element: React.ReactNode }) => {
  return React.createElement(React.Fragment, null, element);
};

export const Navigate = ({ to }: { to: string }) => {
  mockNavigate(to);
  return null;
};

export const Link = ({ to, children, ...props }: any) => {
  return React.createElement('a', { href: to, ...props }, children);
};

export const NavLink = ({ to, children, ...props }: any) => {
  return React.createElement('a', { href: to, ...props }, children);
};

export const Outlet = () => {
  return null;
};

export const useSearchParams = () => {
  return [new URLSearchParams(), jest.fn()];
};

export const useHref = () => {
  return '/';
};

export const useMatch = () => {
  return null;
};

export const useResolvedPath = () => {
  return mockLocation;
};

// Re-export everything from react-router-dom for compatibility
export * from 'react-router-dom';

