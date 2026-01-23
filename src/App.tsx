import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatbotProvider } from './contexts/ChatbotContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import Login from './components/Login';
import Home from './components/Home';
import Profile from './components/Profile';
import AdminScannerTools from './components/scanner/AdminScannerTools';
import TenantScannerTools from './components/scanner/TenantScannerTools';
import MyScanners from './components/scanner/MyScanners';
import UserManagement from './components/admin/UserManagement';
import TenantManagement from './components/admin/TenantManagement';
import SystemPrompts from './components/admin/SystemPrompts';
import ScanTypes from './components/admin/ScanTypes';
import ScannerHub from './components/ScannerHub';
import TenantModelSettings from './components/settings/TenantModelSettings';
import TenantAdminSettings from './components/TenantAdminSettings';
import SuperAdminSettings from './components/SuperAdminSettings';
import TenantScanners from './components/settings/TenantScanners';
import Billing from './components/settings/Billing';
import FindingsConfiguration from './components/settings/FindingsConfiguration';
import StripeSettings from './components/admin/StripeSettings';
import SubscriptionPlans from './components/admin/SubscriptionPlans';
import ChatInterface from './components/chatbot/ChatInterface';
import Assessment from './components/Assessment';
import Reports from './components/Reports';
import Findings from './components/Findings';
import Scans from './components/Scans';
import Assets from './components/Assets';
import CampaignDetails from './components/CampaignDetails';
import LLMLogs from './components/LLMLogs';
import './aws-config';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <ChatbotProvider>
        <Router>
          <div className="App camelot-cyber-app">
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

            {/* Tenant Settings Hub - Legacy route, redirects to tenant admin settings */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <TenantAdminSettings />
                </ProtectedRoute>
              } 
            />

            {/* Tenant Admin Settings */}
            <Route 
              path="/settings/tenant" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <TenantAdminSettings />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Super Admin Settings */}
            <Route 
              path="/settings/admin" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <SuperAdminSettings />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Tenant Management - Super Admin Only */}
            <Route 
              path="/settings/admin/tenants" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <TenantManagement />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* System Prompts - Super Admin Only */}
            <Route
              path="/settings/admin/system-prompts"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <SystemPrompts />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />

            {/* Scan Types - Super Admin Only */}
            <Route
              path="/settings/admin/scan-types"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <ScanTypes />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />

            {/* Findings Configuration - Admin Only */}
            <Route 
              path="/settings/findings-config" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <FindingsConfiguration />
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

            {/* Tenant Admin Scanner Tools Management - Moved to Settings */}
            <Route 
              path="/settings/tenant-tools" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="tenant-admin">
                    <TenantScannerTools />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            {/* Old Tenant Tools Route - Redirect to new location */}
            <Route 
              path="/tenant-tools" 
              element={<Navigate to="/settings/tenant-tools" replace />} 
            />

            {/* Tenant Model Configuration - Admin */}
            <Route 
              path="/settings/tenant-models" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <TenantModelSettings />
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

            {/* Billing - Admin Only */}
            <Route
              path="/settings/billing"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <Billing />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />

            {/* Stripe Configuration - Super Admin Only */}
            <Route
              path="/settings/stripe"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <StripeSettings />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />

            {/* Subscription Plans Management - Super Admin Only */}
            <Route
              path="/settings/subscription-plans"
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="super-admin">
                    <SubscriptionPlans />
                  </RoleBasedRoute>
                </ProtectedRoute>
              }
            />

            {/* Chat Interface */}
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <ChatInterface />
                </ProtectedRoute>
              } 
            />

            {/* Assessment Page */}
            <Route 
              path="/assessment" 
              element={
                <ProtectedRoute>
                  <Assessment />
                </ProtectedRoute>
              } 
            />

            {/* Reports Page */}
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              } 
            />

            {/* Findings Page */}
            <Route 
              path="/findings" 
              element={
                <ProtectedRoute>
                  <Findings />
                </ProtectedRoute>
              } 
            />

            {/* Scans Page */}
            <Route 
              path="/scans" 
              element={
                <ProtectedRoute>
                  <Scans />
                </ProtectedRoute>
              } 
            />

            {/* Campaign Details Page */}
            <Route 
              path="/campaigns/:id" 
              element={
                <ProtectedRoute>
                  <CampaignDetails />
                </ProtectedRoute>
              } 
            />

            {/* Assets Page */}
            <Route 
              path="/assets" 
              element={
                <ProtectedRoute>
                  <Assets />
                </ProtectedRoute>
              } 
            />

            {/* LLM Logs Page - Admin Only */}
            <Route 
              path="/llm-logs" 
              element={
                <ProtectedRoute>
                  <RoleBasedRoute requiredRole="admin">
                    <LLMLogs />
                  </RoleBasedRoute>
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      </ChatbotProvider>
    </AuthProvider>
  );
}

export default App;
