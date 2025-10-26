// src/components/Profile.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import Layout from './Layout';
import './Profile.css';

interface UserProfile {
  username: string;
  email: string;
  name?: string;
  tenant_id?: string;
  groups?: string[];
  created_at?: string;
  last_login_at?: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Try to get user info from API, fallback to context user
      try {
        const userInfo = await apiService.getCurrentUser();
        setProfile(userInfo);
        setFormData({
          name: userInfo.name || userInfo.username || '',
          email: userInfo.email || ''
        });
      } catch (err) {
        // If API fails, use context user
        if (user) {
          setProfile({
            username: user.username,
            email: user.sub,
            groups: user.groups || []
          });
          setFormData({
            name: user.username,
            email: user.sub
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      // TODO: Implement update profile API call
      // await apiService.updateProfile(formData);
      alert('Profile updated successfully (mock)');
      setEditing(false);
      loadProfile();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        name: profile.name || profile.username || '',
        email: profile.email || ''
      });
    }
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <Layout title="Profile">
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={loadProfile}>Retry</button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profile">
      <div className="profile-container">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              <span>{((profile?.username || user?.email || 'U').charAt(0) || 'U').toUpperCase()}</span>
            </div>
            <div>
              <h2>{profile?.name || profile?.username || user?.email || 'User'}</h2>
              <p className="profile-email">{profile?.email || user?.email || 'No email'}</p>
            </div>
          </div>

          {error && (
            <div className="error-banner">
              <p>{error}</p>
            </div>
          )}

          <div className="profile-content">
            <div className="profile-section">
              <h3>Account Information</h3>
              {editing ? (
                <div className="profile-form">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-actions">
                    <button className="btn-primary" onClick={handleSave}>
                      Save Changes
                    </button>
                    <button className="btn-secondary" onClick={handleCancel}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="info-row">
                    <span className="info-label">Username</span>
                    <span className="info-value">{profile?.username || user?.username || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{profile?.email || user?.email || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Name</span>
                    <span className="info-value">{profile?.name || 'Not set'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">User ID</span>
                    <span className="info-value">{user?.sub || profile?.username || 'N/A'}</span>
                  </div>
                  <div className="profile-actions">
                    <button className="btn-primary" onClick={() => setEditing(true)}>
                      Edit Profile
                    </button>
                  </div>
                </>
              )}
            </div>

            {profile?.groups && profile.groups.length > 0 && (
              <div className="profile-section">
                <h3>Roles & Permissions</h3>
                <div className="groups">
                  {profile.groups.map((group, index) => (
                    <span key={index} className="group-badge">
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {profile?.tenant_id && (
              <div className="profile-section">
                <h3>Organization</h3>
                <div className="info-row">
                  <span className="info-label">Tenant ID</span>
                  <span className="info-value">{profile.tenant_id}</span>
                </div>
              </div>
            )}

            <div className="profile-section">
              <h3>Security Settings</h3>
              <div className="info-row">
                <span className="info-label">Two-Factor Authentication</span>
                <span className="info-value">Not enabled</span>
              </div>
              <div className="info-row">
                <span className="info-label">Account Status</span>
                <span className="info-value status-active">Active</span>
              </div>
              <div className="profile-actions">
                <button className="btn-secondary">Change Password</button>
              </div>
            </div>

            <div className="profile-section">
              <h3>Preferences</h3>
              <div className="info-row">
                <span className="info-label">Language</span>
                <span className="info-value">English (US)</span>
              </div>
              <div className="info-row">
                <span className="info-label">Timezone</span>
                <span className="info-value">UTC</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
