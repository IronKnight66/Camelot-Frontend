// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already signed in
    checkUser();

    // Listen for auth events
    const hubListener = Hub.listen('auth', ({ payload }) => {
      switch (payload.event) {
        case 'signedIn':
          checkUser();
          break;
        case 'signedOut':
          setUser(null);
          break;
        case 'signInWithRedirect':
          checkUser();
          break;
        case 'signInWithRedirect_failure':
          console.error('Sign in failed:', payload.data);
          break;
        default:
          break;
      }
    });

    return () => hubListener();
  }, []);

  const checkUser = async () => {
    try {
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const userData: User = {
        username: user.username,
        email: attributes.email || '',
        sub: attributes.sub || '',
        groups: []
      };
      
      setUser(userData);
    } catch (error) {
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      await signIn({ username, password });
      const user = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      
      const userData: User = {
        username: user.username,
        email: attributes.email || '',
        sub: attributes.sub || '',
        groups: []
      };
      
      setUser(userData);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const handleSignUp = async (username: string, password: string, email: string) => {
    try {
      await signUp({
        username,
        password,
        options: {
          userAttributes: {
            email
          }
        }
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const handleConfirmSignUp = async (username: string, code: string) => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  };

  const handleResendConfirmationCode = async (username: string) => {
    try {
      // For now, just throw an error - this can be implemented later
      throw new Error('Resend confirmation code not implemented yet');
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      throw error;
    }
  };

  const handleForgotPassword = async (username: string) => {
    try {
      // For now, just throw an error - this can be implemented later
      throw new Error('Forgot password not implemented yet');
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const handleConfirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      // For now, just throw an error - this can be implemented later
      throw new Error('Confirm forgot password not implemented yet');
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn: handleSignIn,
    signOut: handleSignOut,
    signUp: handleSignUp,
    confirmSignUp: handleConfirmSignUp,
    resendConfirmationCode: handleResendConfirmationCode,
    forgotPassword: handleForgotPassword,
    confirmForgotPassword: handleConfirmForgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};