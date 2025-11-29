import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserRole } from '../../utils/roleHelpers';
import ApiService from '../../services/api';
import './ProfileModal.css';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadProfile();
    }
  }, [isOpen]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await ApiService.getCurrentUser();
      setUserProfile(profile);
      setEmail(profile.email || user?.email || '');
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setDisplayName(profile.display_name || profile.name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user?.username || '');
      setUsername(profile.username || profile.id || user?.username || '');
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await ApiService.updateProfile({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
      });
      onClose();
      // Optionally reload profile or show success message
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const userInitials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : username
    ? username.charAt(0).toUpperCase()
    : 'U';

  return (
    <div className="profile-modal-overlay">
      <div className="profile-modal" ref={modalRef}>
        <div className="profile-modal-header">
          <h2 className="profile-modal-title">Edit profile</h2>
        </div>

        <form className="profile-modal-body" onSubmit={handleSave}>
          {error && <div className="profile-error-message">{error}</div>}

          <div className="profile-avatar-section">
            <div className="profile-avatar-container">
              <div className="profile-avatar-circle">
                {userInitials}
              </div>
              <button
                type="button"
                className="profile-avatar-edit"
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement profile picture upload
                  alert('Profile picture upload coming soon');
                }}
                aria-label="Change profile picture"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </button>
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="profile-display-name">Display name</label>
            <input
              id="profile-display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Display name"
              className="profile-input"
            />
          </div>

          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="profile-first-name">First name</label>
              <input
                id="profile-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                className="profile-input"
              />
            </div>

            <div className="profile-form-group">
              <label htmlFor="profile-last-name">Last name</label>
              <input
                id="profile-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                className="profile-input"
              />
            </div>
          </div>

          <div className="profile-form-group">
            <label htmlFor="profile-email">
              Email
              <span className="profile-warning-icon" title="Email cannot be changed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </span>
            </label>
            <input
              id="profile-email"
              type="email"
              value={email}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>

          <div className="profile-form-group">
            <label htmlFor="profile-username">
              Username
              <span className="profile-warning-icon" title="Username cannot be changed">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </span>
            </label>
            <input
              id="profile-username"
              type="text"
              value={username}
              disabled
              className="profile-input profile-input-disabled"
            />
          </div>

          {userProfile && (
            <>
              <div className="profile-form-group">
                <label htmlFor="profile-user-id">User ID</label>
                <input
                  id="profile-user-id"
                  type="text"
                  value={userProfile.id || ''}
                  disabled
                  className="profile-input profile-input-disabled"
                />
              </div>

              {userProfile.groups && userProfile.groups.length > 0 && (
                <div className="profile-form-group">
                  <label>Groups</label>
                  <div className="profile-groups-display">
                    {userProfile.groups.map((group: string, index: number) => (
                      <span key={index} className="profile-group-badge">{group}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="profile-form-group">
                <label>Status</label>
                <div className="profile-status-display">
                  <span className={`profile-status-badge ${userProfile.is_active ? 'active' : 'inactive'}`}>
                    {userProfile.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {userProfile.created_at && (
                <div className="profile-form-group">
                  <label>Member since</label>
                  <div className="profile-date-display">
                    {new Date(userProfile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              )}

              {userProfile.updated_at && (
                <div className="profile-form-group">
                  <label>Last updated</label>
                  <div className="profile-date-display">
                    {new Date(userProfile.updated_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          <p className="profile-description">
            Your profile helps people recognize you. Your name and username are also used in the Sora app.
          </p>

          <div className="profile-modal-actions">
            <button
              type="button"
              className="profile-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="profile-btn-save"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;

