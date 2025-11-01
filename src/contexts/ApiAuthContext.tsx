// src/contexts/ApiAuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import axios from 'axios';

interface User {
  username: string;
  email: string;
  sub: string;
  groups?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (username: string, password: string, email: string) => Promise<void>;
  confirmSignUp: (username: string, code: string) => Promise<void>;
  resendConfirmationCode: (username: string) => Promise<void>;
  forgotPassword: (username: string) => Promise<void>;
  confirmForgotPassword: (username: string, code: string, newPassword: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const ApiAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to decode JWT token
  const decodeToken = (token: string): any => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Check if user is already authenticated on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Decode token to get user info
      const decoded = decodeToken(accessToken);
      if (!decoded) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setLoading(false);
        return;
      }

      // Check if token is expired
      const now = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < now) {
        // Token expired, try to refresh
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            await refreshAccessToken(refreshToken);
            return; // checkUser will be called again after refresh
          } catch (error) {
            console.error('Token refresh failed:', error);
          }
        }

        // Clear expired tokens
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setLoading(false);
        return;
      }

      // Extract user info from token
      const userData: User = {
        username: decoded.username || decoded.sub || '',
        email: decoded.email || '',
        sub: decoded.sub || '',
        groups: decoded.groups || decoded['cognito:groups'] || []
      };

      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Error checking user:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken
      });

      const { access_token, id_token } = response.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('id_token', id_token);

      await checkUser();
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/v1/auth/login`, {
        email: username,
        password: password
      });

      const { access_token, id_token, refresh_token, user: userInfo } = response.data;

      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('id_token', id_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      // Set user from response
      if (userInfo) {
        const userData: User = {
          username: userInfo.username || userInfo.email || username,
          email: userInfo.email || username,
          sub: userInfo.id || userInfo.sub || username,
          groups: userInfo.groups || []
        };
        setUser(userData);
      } else {
        // Decode token to get user info
        const decoded = decodeToken(access_token);
        if (decoded) {
          const userData: User = {
            username: decoded.username || decoded.sub || username,
            email: decoded.email || username,
            sub: decoded.sub || username,
            groups: decoded.groups || decoded['cognito:groups'] || []
          };
          setUser(userData);
        }
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(error.message || 'Sign in failed');
    }
  };

  const handleSignOut = async () => {
    try {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        try {
          await axios.post(`${API_URL}/api/v1/auth/logout`, {
            access_token: accessToken
          });
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        }
      }
    } finally {
      // Clear tokens and user state
      localStorage.removeItem('access_token');
      localStorage.removeItem('id_token');
      localStorage.removeItem('refresh_token');
      setUser(null);
    }
  };

  const handleSignUp = async (username: string, password: string, email: string) => {
    throw new Error('Sign up is not supported in local development mode. Please contact your administrator.');
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    throw new Error('Sign up confirmation is not supported in local development mode.');
  };

  const handleResendConfirmationCode = async (username: string) => {
    throw new Error('Resend confirmation is not supported in local development mode.');
  };

  const handleForgotPassword = async (username: string) => {
    throw new Error('Forgot password is not supported in local development mode. Please contact your administrator.');
  };

  const handleConfirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    throw new Error('Password reset is not supported in local development mode.');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signOut: handleSignOut,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        resendConfirmationCode: handleResendConfirmationCode,
        forgotPassword: handleForgotPassword,
        confirmForgotPassword: handleConfirmForgotPassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
