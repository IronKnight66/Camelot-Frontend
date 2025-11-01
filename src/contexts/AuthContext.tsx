// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signIn, signOut, signUp, confirmSignUp, getCurrentUser, fetchUserAttributes, fetchAuthSession } from 'aws-amplify/auth';
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const checkingUserRef = React.useRef(false);

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
    // Prevent multiple concurrent calls
    if (checkingUserRef.current) {
      console.log('checkUser already in progress, skipping...');
      return;
    }
    
    checkingUserRef.current = true;
    
    try {
      const user = await getCurrentUser();
      
      // Get the session first to check if it's valid
      let attributes: any = {};
      try {
        const session = await fetchAuthSession();
        if (!session.tokens || !session.tokens.accessToken) {
          throw new Error('No valid session');
        }
        
        // Only fetch attributes if we have a valid session
        attributes = await fetchUserAttributes();
      } catch (sessionError: any) {
        console.log('Could not fetch user attributes, continuing with minimal user info:', sessionError);
        // Don't set user to null - just continue with empty attributes
      }
      
      // Fetch groups from the ID token
      const groups: string[] = [];
      try {
        const session = await fetchAuthSession();
        // Try to decode the ID token to get groups
        const idToken = session.tokens?.idToken;
        if (idToken) {
          // Get groups from token payload
          const payload = idToken.payload as any;
          if (payload['cognito:groups']) {
            const groupsData = payload['cognito:groups'];
            if (typeof groupsData === 'string') {
              groups.push(groupsData);
            } else if (Array.isArray(groupsData)) {
              groups.push(...groupsData);
            }
          }
        }
      } catch (tokenError) {
        console.log('Could not fetch groups from token:', tokenError);
      }
      
      const userData: User = {
        username: user.username,
        email: attributes.email || '',
        sub: attributes.sub || user.username,
        groups
      };
      
      setUser(userData);
    } catch (error) {
      console.log('No authenticated user');
      setUser(null);
    } finally {
      setLoading(false);
      checkingUserRef.current = false;
    }
  };

  const handleSignIn = async (username: string, password: string) => {
    try {
      // Check if already signed in and refresh user data if so
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // User already signed in, just refresh the user data
          checkUser();
          return;
        }
      } catch {
        // Not signed in, proceed with sign in
      }

      await signIn({ username, password });
      
      // Get user data after sign in
      const user = await getCurrentUser();
      
      // Get attributes with proper session validation
      let attributes: any = {};
      try {
        const session = await fetchAuthSession();
        if (session.tokens && session.tokens.accessToken) {
          attributes = await fetchUserAttributes();
        }
      } catch (sessionError: any) {
        console.log('Could not fetch user attributes after sign in:', sessionError);
      }
      
      // Fetch groups from the ID token
      const groups: string[] = [];
      try {
        const session = await fetchAuthSession();
        // Get groups from token payload
        const idToken = session.tokens?.idToken;
        if (idToken) {
          const payload = idToken.payload as any;
          if (payload['cognito:groups']) {
            const groupsData = payload['cognito:groups'];
            if (typeof groupsData === 'string') {
              groups.push(groupsData);
            } else if (Array.isArray(groupsData)) {
              groups.push(...groupsData);
            }
          }
        }
      } catch (tokenError) {
        console.log('Could not fetch groups from token:', tokenError);
      }
      
      const userData: User = {
        username: user.username,
        email: attributes.email || '',
        sub: attributes.sub || '',
        groups
      };
      
      setUser(userData);
    } catch (error: any) {
      console.error('Sign in error:', error);
      // If already authenticated, just refresh user data
      if (error.name === 'UserAlreadyAuthenticatedException' || error.message?.includes('already a signed in')) {
        checkUser();
      } else {
        throw error;
      }
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