import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './components/Login';
import Home from './components/Home';
import Profile from './components/Profile';
import AdminScannerTools from './components/scanner/AdminScannerTools';
import TenantScannerTools from './components/scanner/TenantScannerTools';
import MyScanners from './components/scanner/MyScanners';
import UserManagement from './components/admin/UserManagement';
import ScannerHub from './components/ScannerHub';
import TenantSettingsHub from './components/TenantSettingsHub';
import APIKeys from './components/settings/APIKeys';
import TenantScanners from './components/settings/TenantScanners';
import './aws-config';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />

            {/* Scanner Hub */}
            <Route 
              path="/scanners" 
              element={
                <ProtectedRoute>
                  <ScannerHub />
                </ProtectedRoute>
              } 
            />

            {/* Tenant Settings Hub */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <TenantSettingsHub />
                </ProtectedRoute>
              } 
            />

            {/* API Keys - Admin Only */}
            <Route 
              path="/settings/api-keys" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <APIKeys />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Tenant Scanners - Super Admin Only */}
            <Route 
              path="/settings/tenant-scanners" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <TenantScanners />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Old Admin Scanner Tools Route - Redirect to new location */}
            <Route 
              path="/admin/scanner-tools" 
              element={<Navigate to="/settings/admin/scanner-tools" replace />} 
            />

            {/* Super-Admin Scanner Tools Management - Moved to Settings */}
            <Route 
              path="/settings/admin/scanner-tools" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <AdminScannerTools />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Tenant Admin Scanner Tools Management */}
            <Route 
              path="/tenant-tools" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="tenant-admin">
                    <TenantScannerTools />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Regular Users - My Scanners */}
            <Route 
              path="/my-scanners" 
              element={
                <ProtectedRoute>
                  <MyScanners />
                </ProtectedRoute>
              } 
            />

            {/* User Profile */}
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* User Management - Admin Only */}
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <UserManagement />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
