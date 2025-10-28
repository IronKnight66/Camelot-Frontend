import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Layout from '../Layout';
import './UserManagement.css';

interface User {
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  is_active: boolean;
  groups?: string[];
  created_at?: string;
  last_login?: string;
}

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserCreated: () => void;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onUserCreated }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user' | 'viewer'>('user');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await api.createUser({
        email,
        role,
        first_name: firstName || undefined,
        last_name: lastName || undefined,
      });

      if (result.temp_password) {
        setTempPassword(result.temp_password);
        setSuccess('User created successfully! Please save the temporary password before closing this dialog.');
      } else {
        setSuccess('User created successfully!');
        setTimeout(() => {
          onUserCreated();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (tempPassword) {
      // If we have a temp password, just clear it to show the form again
      setTempPassword(null);
    } else {
      setEmail('');
      setFirstName('');
      setLastName('');
      setRole('user');
      setError(null);
      setSuccess(null);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New User</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>
        
        {tempPassword ? (
          <div className="modal-body">
            <div className="temp-password-box">
              <h3>User Created Successfully!</h3>
              <p>Please save this temporary password and provide it to the user securely:</p>
              <div className="temp-password">{tempPassword}</div>
              <p className="temp-password-warning">
                The user will be required to change this password on first login.
              </p>
            </div>
            <div className="modal-actions">
              <button type="button" onClick={() => {
                onUserCreated();
                onClose();
              }}>Done</button>
            </div>
          </div>
        ) : (
          <form className="modal-body" onSubmit={handleSubmit}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'user' | 'viewer')}
                required
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div className="modal-actions">
              <button type="button" onClick={handleClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers();
      setUsers(response.users || []);
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: 'admin' | 'user' | 'viewer') => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    try {
      await api.updateUserRole(userId, newRole);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to update role');
    }
  };

  const handleUpdateStatus = async (userId: string, isActive: boolean) => {
    try {
      await api.updateUserStatus(userId, isActive);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to update status');
    }
  };

  const handleForcePasswordReset = async (userId: string) => {
    if (!window.confirm('Are you sure you want to force a password reset? The user will be logged out and must change their password on next login.')) {
      return;
    }

    try {
      await api.forcePasswordReset(userId);
      alert('Password reset initiated. The user must change their password on next login.');
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to reset password');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove ${email}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || err.message || 'Failed to remove user');
    }
  };

  if (loading) {
    return <Layout><div className="user-management-container"><div className="loading">Loading users...</div></div></Layout>;
  }

  if (error) {
    return <Layout><div className="user-management-container"><div className="error-message">{error}</div></div></Layout>;
  }

  return (
    <Layout>
      <div className="user-management-container">
        <div className="user-management-header">
          <h1>User Management</h1>
          <button className="btn btn-primary" onClick={() => setCreateModalOpen(true)}>
            + Add User
          </button>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            <p>No users found. Create your first user to get started.</p>
          </div>
        ) : (
          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td>{user.email}</td>
                    <td>
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.username, e.target.value as 'admin' | 'user' | 'viewer')}
                        className="role-select"
                      >
                        <option value="admin">Admin</option>
                        <option value="user">User</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm"
                          onClick={() => handleUpdateStatus(user.username, !user.is_active)}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => handleForcePasswordReset(user.username)}
                        >
                          Reset Password
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteUser(user.username, user.email)}
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onUserCreated={loadUsers}
        />
      </div>
    </Layout>
  );
};

export default UserManagement;
