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

            {/* Super-Admin Scanner Tools Management */}
            <Route 
              path="/admin/scanner-tools" 
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

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
