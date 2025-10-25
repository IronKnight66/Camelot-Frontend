// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Auth, Hub } from 'aws-amplify';
import { CognitoUser } from 'amazon-cognito-identity-js';

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
    const hubListener = Hub.listen('auth', ({ payload: { event, data } }) => {
      switch (event) {
        case 'signIn':
          setUser(data);
          break;
        case 'signOut':
          setUser(null);
          break;
        case 'signUp':
          console.log('User signed up:', data);
          break;
        case 'signIn_failure':
          console.error('Sign in failed:', data);
          break;
        default:
          break;
      }
    });

    return () => hubListener();
  }, []);

  const checkUser = async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      const userAttributes = await Auth.userAttributes(user);
      
      const userData: User = {
        username: user.username,
        email: userAttributes.find(attr => attr.Name === 'email')?.Value || '',
        sub: userAttributes.find(attr => attr.Name === 'sub')?.Value || '',
        groups: user.signInUserSession?.accessToken?.payload?.['cognito:groups'] || []
      };
      
      setUser(userData);
    } catch (error) {
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string) => {
    try {
      const user = await Auth.signIn(username, password);
      const userAttributes = await Auth.userAttributes(user);
      
      const userData: User = {
        username: user.username,
        email: userAttributes.find(attr => attr.Name === 'email')?.Value || '',
        sub: userAttributes.find(attr => attr.Name === 'sub')?.Value || '',
        groups: user.signInUserSession?.accessToken?.payload?.['cognito:groups'] || []
      };
      
      setUser(userData);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const signUp = async (username: string, password: string, email: string) => {
    try {
      await Auth.signUp({
        username,
        password,
        attributes: {
          email
        }
      });
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const confirmSignUp = async (username: string, code: string) => {
    try {
      await Auth.confirmSignUp(username, code);
    } catch (error) {
      console.error('Confirm sign up error:', error);
      throw error;
    }
  };

  const resendConfirmationCode = async (username: string) => {
    try {
      await Auth.resendSignUp(username);
    } catch (error) {
      console.error('Resend confirmation code error:', error);
      throw error;
    }
  };

  const forgotPassword = async (username: string) => {
    try {
      await Auth.forgotPassword(username);
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  };

  const confirmForgotPassword = async (username: string, code: string, newPassword: string) => {
    try {
      await Auth.forgotPasswordSubmit(username, code, newPassword);
    } catch (error) {
      console.error('Confirm forgot password error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    forgotPassword,
    confirmForgotPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
