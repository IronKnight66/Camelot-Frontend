// src/components/Login.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotPasswordCode, setForgotPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isConfirmingForgotPassword, setIsConfirmingForgotPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, confirmSignUp, resendConfirmationCode, forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signUp(username, password, email);
        setIsConfirming(true);
      } else {
        await signIn(username, password);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmSignUp(username, confirmationCode);
      setIsConfirming(false);
      setIsSignUp(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);

    try {
      await resendConfirmationCode(username);
      setError('Confirmation code resent to your email');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await forgotPassword(username);
      setIsConfirmingForgotPassword(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await confirmForgotPassword(username, forgotPasswordCode, newPassword);
      setIsConfirmingForgotPassword(false);
      setIsForgotPassword(false);
      setError('');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (isConfirmingForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Reset Password</h2>
          <p>Enter the confirmation code sent to your email and your new password.</p>
          <form onSubmit={handleConfirmForgotPassword}>
            <div className="form-group">
              <label htmlFor="forgotPasswordCode">Confirmation Code</label>
              <input
                type="text"
                id="forgotPasswordCode"
                value={forgotPasswordCode}
                onChange={(e) => setForgotPasswordCode(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <button 
            type="button" 
            className="link-button" 
            onClick={() => setIsConfirmingForgotPassword(false)}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (isConfirming) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Confirm Sign Up</h2>
          <p>Enter the confirmation code sent to your email.</p>
          <form onSubmit={handleConfirmSignUp}>
            <div className="form-group">
              <label htmlFor="confirmationCode">Confirmation Code</label>
              <input
                type="text"
                id="confirmationCode"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Confirming...' : 'Confirm Sign Up'}
            </button>
          </form>
          <button 
            type="button" 
            className="link-button" 
            onClick={handleResendCode}
            disabled={loading}
          >
            Resend Code
          </button>
          <button 
            type="button" 
            className="link-button" 
            onClick={() => setIsConfirming(false)}
          >
            Back to Sign Up
          </button>
        </div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Forgot Password</h2>
          <p>Enter your username to receive a password reset code.</p>
          <form onSubmit={handleForgotPassword}>
            <div className="form-group">
              <label htmlFor="forgotUsername">Username</label>
              <input
                type="text"
                id="forgotUsername"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {error && <div className="error">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
          <button 
            type="button" 
            className="link-button" 
            onClick={() => setIsForgotPassword(false)}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {isSignUp && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" disabled={loading}>
            {loading ? (isSignUp ? 'Signing Up...' : 'Signing In...') : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        <div className="form-links">
          <button 
            type="button" 
            className="link-button" 
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
          {!isSignUp && (
            <button 
              type="button" 
              className="link-button" 
              onClick={() => setIsForgotPassword(true)}
            >
              Forgot Password?
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
