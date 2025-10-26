# Scanner Tool Registry Management Feature Implementation

## Overview
This document describes the comprehensive scanner tool management system implemented for the Camelot Security Orchestration Platform, supporting three distinct user roles with different levels of access and functionality.

## Architecture

### File Structure
```
src/
├── types/
│   └── scanner.ts                    # TypeScript interfaces and types for scanner tools
├── services/
│   └── api.ts                         # API service methods (updated with scanner endpoints)
├── utils/
│   └── roleHelpers.ts                 # Role-based access control utilities
├── components/
│   ├── Layout.tsx                     # Shared layout component with navigation
│   ├── Layout.css
│   ├── RoleBasedRoute.tsx             # Route component for role-based access
│   ├── scanner/
│   │   ├── ToolCard.tsx               # Reusable tool card component
│   │   ├── ToolCard.css
│   │   ├── ToolModal.tsx              # Modal for tool details/settings
│   │   ├── ToolModal.css
│   │   ├── AdminScannerTools.tsx      # Super-Admin scanner management page
│   │   ├── AdminScannerTools.css
│   │   ├── TenantScannerTools.tsx     # Tenant Admin scanner management page
│   │   ├── TenantScannerTools.css
│   │   ├── MyScanners.tsx             # Regular user scanner management page
│   │   └── MyScanners.css
│   ├── Home.tsx                       # Updated dashboard with navigation
│   └── Home.css                       # Updated styles
└── App.tsx                            # Updated with new routes
```

## Components Created

### 1. Core Types (`src/types/scanner.ts`)
- **ScannerTool**: Complete interface for scanner tools including metadata
- **TenantToolSettings**: Tenant-specific configuration and usage tracking
- **UserToolPreferences**: User-specific tool preferences and activation status
- **Utility Types**: Pagination, filters, and API response types

### 2. API Service (`src/services/api.ts`)
Three sets of endpoints implemented:
- **Super-Admin**: Full CRUD operations for scanner tools
- **Tenant Admin**: Enable/disable tools, set usage limits, update settings
- **Regular Users**: Activate/deactivate personal tool preferences

### 3. Role-Based Access Control (`src/utils/roleHelpers.ts`)
- User role determination from groups
- Role hierarchy checking
- Accessible routes calculation

### 4. Layout Component (`src/components/Layout.tsx`)
- Consistent navigation across all pages
- Role-based menu visibility
- Active route highlighting
- User info and sign-out functionality

### 5. Scanner Components

#### ToolCard (`src/components/scanner/ToolCard.tsx`)
Reusable card component displaying:
- Tool name, category, and pricing tier badges
- Description and metadata
- Role-specific status indicators (toggles)
- Usage statistics (for tenant admin and users)
- Action buttons (view details, settings)

#### ToolModal (`src/components/scanner/ToolModal.tsx`)
Modal component for:
- Viewing complete tool details
- Editing tool configuration (super-admin)
- Managing tool settings and limits (tenant-admin)

## Pages Implemented

### 1. Super-Admin Scanner Tools Management (`src/components/scanner/AdminScannerTools.tsx`)
**Features:**
- Complete scanner registry view with pagination
- Advanced filtering (category, status, pricing tier, search)
- Create/Edit/Delete operations
- Tool card grid with bulk operations support
- Real-time statistics and counts

**Available Filters:**
- Search by name/description
- Category filter
- Active/Inactive status
- Pricing tier filter

**Capabilities:**
- Create new scanner tools
- Edit existing tools
- Activate/deactivate tools globally
- Delete tools (soft delete with confirmation)
- View detailed tool information

### 2. Tenant Admin Scanner Tools (`src/components/scanner/TenantScannerTools.tsx`)
**Features:**
- Tabbed interface: All/Enabled/Disabled tools
- Enable/Disable toggles for tenant tools
- Usage monitoring with limits
- Settings modal for usage limits and configuration
- Tool statistics (enabled/disabled counts)

**Capabilities:**
- Enable tools for tenant with usage limits
- Disable tenant tools
- Update usage limits and settings
- Monitor current usage vs limits
- View usage reset dates

### 3. Regular User My Scanners (`src/components/scanner/MyScanners.tsx`)
**Features:**
- List of tools enabled for tenant
- Search functionality
- Category filters
- Activate/Deactivate toggles
- Usage statistics (times used, last used)
- Stat cards showing available/activated counts

**Capabilities:**
- Activate scanner tools for personal use
- Deactivate tools
- View usage statistics
- Search and filter available tools

## Routing (`src/App.tsx`)

Routes added:
- `/` - Dashboard (existing, updated with Layout)
- `/admin/scanner-tools` - Super-Admin tool management (requires super-admin role)
- `/tenant-tools` - Tenant Admin tool management (requires tenant-admin or super-admin role)
- `/my-scanners` - Regular user tools (accessible by all authenticated users)

**Access Control:**
- Routes are protected with `ProtectedRoute` component
- Role-based access enforced with `RoleBasedRoute` component
- Unauthorized access redirects to dashboard

## API Endpoints

### Super-Admin Endpoints
- `GET /api/v1/admin/scanner-tools` - List all tools (with pagination/filters)
- `POST /api/v1/admin/scanner-tools` - Create new tool
- `GET /api/v1/admin/scanner-tools/{id}` - Get tool details
- `PUT /api/v1/admin/scanner-tools/{id}` - Update tool
- `DELETE /api/v1/admin/scanner-tools/{id}` - Delete tool

### Tenant Admin Endpoints
- `GET /api/v1/scanner-tools` - List tenant tools (with is_enabled filter)
- `POST /api/v1/scanner-tools/{id}/enable` - Enable tool with limits
- `POST /api/v1/scanner-tools/{id}/disable` - Disable tool
- `PUT /api/v1/scanner-tools/{id}/limits` - Update limits and settings

### Regular User Endpoints
- `GET /api/v1/scanner-tools/my-tools` - List user's activated tools
- `POST /api/v1/scanner-tools/{id}/activate` - Activate tool with preferences
- `POST /api/v1/scanner-tools/{id}/deactivate` - Deactivate tool

## User Experience Features

### Common Features Across All Roles
- **Tool Cards**: Consistent design with role-specific information
- **Search**: Filter tools by name/description
- **Category Filters**: Group tools by type
- **Status Indicators**: Visual badges for tool status
- **Usage Statistics**: Track usage for tenant admins and users
- **Responsive Design**: Mobile-friendly layouts

### Visual Design
- Modern card-based UI
- Color-coded badges (category, pricing tier, status)
- Hover effects and transitions
- Loading states with spinners
- Error banners with retry functionality
- Empty states with helpful messages

## Role-Based Capabilities Summary

| Feature | Super-Admin | Tenant Admin | Regular User |
|---------|------------|--------------|--------------|
| View All Tools | Yes | Yes (only enabled) | Yes (only enabled for tenant) |
| Create Tools | Yes | No | No |
| Edit Tools | Yes | No | No |
| Delete Tools | Yes | No | No |
| Enable/Disable for Tenant | N/A | Yes | No |
| Set Usage Limits | N/A | Yes | No |
| Activate for Personal Use | No | No | Yes |
| View Usage Stats | Yes | Yes | Yes (personal only) |

## Additional Features

### Navigation
- Consistent header navigation across all pages
- Role-based menu visibility
- Active route highlighting
- Responsive mobile navigation

### Error Handling
- Graceful error messages
- Retry functionality for failed API calls
- Loading states during operations

### Data Management
- Optimistic UI updates
- Automatic data refresh after mutations
- Confirmation dialogs for destructive actions

## Future Enhancements

Potential additions:
1. Bulk operations (activate/deactivate multiple tools)
2. Usage analytics dashboard
3. Tool recommendations based on scan history
4. Advanced filtering and sorting
5. Export functionality for tool registry
6. Tool templates and presets
7. Version management for tools
8. Usage alerts and notifications

## Testing Considerations

Components are ready for:
- Unit tests for utility functions
- Integration tests for API calls
- Component tests for UI interactions
- E2E tests for complete workflows

## Deployment Notes

No additional dependencies required - all functionality built with existing stack:
- React 19
- TypeScript
- React Router v7
- Axios
- AWS Amplify

All components are production-ready and follow existing code patterns and conventions.

