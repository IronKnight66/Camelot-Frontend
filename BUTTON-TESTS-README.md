# UI Button Tests - Quick Start Guide

This guide provides quick commands to run and verify all UI button interaction tests for the Camelot frontend.

## 📋 Test Files Overview

| Component | Test File | Location |
|-----------|-----------|----------|
| Login | `Login.test.tsx` | `src/components/__tests__/` |
| Home | `Home.test.tsx` | `src/components/__tests__/` |
| User Management | `UserManagement.test.tsx` | `src/components/admin/__tests__/` |
| Scanner Hub | `ScannerHub.test.tsx` | `src/components/__tests__/` |
| Admin Scanner Tools | `AdminScannerTools.test.tsx` | `src/components/scanner/__tests__/` |
| Tenant Scanner Tools | `TenantScannerTools.test.tsx` | `src/components/scanner/__tests__/` |
| My Scanners | `MyScanners.test.tsx` | `src/components/scanner/__tests__/` |
| API Keys | `APIKeysSettings.test.tsx` | `src/components/settings/__tests__/` |
| Tenant Settings | `TenantSettingsHub.test.tsx` | `src/components/__tests__/` |
| Profile | `Profile.test.tsx` | `src/components/__tests__/` |
| Layout | `Layout.test.tsx` | `src/components/__tests__/` |

## 🚀 Quick Start

### Install Dependencies
```bash
cd camelot-frontend
npm install
```

### Run All UI Tests
```bash
npm test
```

### Run All Tests with Coverage
```bash
npm test -- --coverage
```

## 🎯 Run Specific Test Suites

### Authentication & Login Tests
```bash
npm test Login.test.tsx
```
**Tests**: 12 test cases covering sign in, sign up, forgot password, confirmation flows

### Dashboard Tests
```bash
npm test Home.test.tsx
```
**Tests**: 3 test cases covering retry, navigation, data loading

### User Management Tests
```bash
npm test UserManagement.test.tsx
```
**Tests**: 12 test cases covering user CRUD, role management, enable/disable

### Scanner Hub Tests
```bash
npm test ScannerHub.test.tsx
```
**Tests**: 6 test cases covering navigation, role-based access

### Admin Scanner Tools Tests
```bash
npm test AdminScannerTools.test.tsx
```
**Tests**: 10 test cases covering tool CRUD, search, filtering

### Tenant Scanner Tools Tests (NEW)
```bash
npm test TenantScannerTools.test.tsx
```
**Tests**: 12 test cases covering enable/disable, settings, usage limits

### My Scanners Tests (NEW)
```bash
npm test MyScanners.test.tsx
```
**Tests**: 8 test cases covering activate/deactivate, filtering, search

### API Keys Tests
```bash
npm test APIKeysSettings.test.tsx
```
**Tests**: 10 test cases covering key management, testing, deletion

### Settings Hub Tests
```bash
npm test TenantSettingsHub.test.tsx
```
**Tests**: 4 test cases covering navigation, access control

### Profile Tests
```bash
npm test Profile.test.tsx
```
**Tests**: 8 test cases covering profile editing, password change

### Layout/Navigation Tests
```bash
npm test Layout.test.tsx
```
**Tests**: 5 test cases covering navigation, logout

## 🔍 Run Tests by Pattern

### All Scanner-Related Tests
```bash
npm test -- --testPathPattern="scanner"
```

### All Admin Tests
```bash
npm test -- --testPathPattern="admin"
```

### All Settings Tests
```bash
npm test -- --testPathPattern="settings"
```

## 📊 Test with Detailed Output

### Verbose Output
```bash
npm test -- --verbose
```

### Show Test Names Only
```bash
npm test -- --listTests
```

### Run Tests and Generate Report
```bash
npm test -- --coverage --coverageReporters=html
# Open coverage/index.html in browser
```

## 🐛 Debug Mode

### Run Single Test in Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand Login.test.tsx
```

### Watch Mode (Re-run on Changes)
```bash
npm test -- --watch
```

### Watch Mode for Specific File
```bash
npm test -- --watch Login.test.tsx
```

## ✅ Verify New Tests

### Run Only New Test Files
```bash
# Test My Scanners
npm test MyScanners.test.tsx

# Test Tenant Scanner Tools
npm test TenantScannerTools.test.tsx

# Run both new tests
npm test -- --testPathPattern="MyScanners|TenantScannerTools"
```

### Expected Output
```
PASS src/components/scanner/__tests__/MyScanners.test.tsx
  MyScanners Component - Button Interactions
    ✓ UI-MYSCAN-001: should reload data when retry button clicked
    ✓ UI-MYSCAN-002: should activate scanner when activate button clicked
    ✓ UI-MYSCAN-003: should deactivate scanner when deactivate button clicked
    ✓ UI-MYSCAN-004: should show details when view details button clicked
    ✓ UI-MYSCAN-005: should filter scanners by category
    ✓ UI-MYSCAN-006: should filter scanners by search term
    ✓ UI-MYSCAN-007: should show all scanners when all category clicked
    ✓ UI-MYSCAN-008: should display correct scanner statistics

PASS src/components/scanner/__tests__/TenantScannerTools.test.tsx
  TenantScannerTools Component - Button Interactions
    ✓ UI-TENANTSCAN-001: should show all tools when All tab clicked
    ✓ UI-TENANTSCAN-002: should show only enabled tools when Enabled tab clicked
    ✓ UI-TENANTSCAN-003: should show only disabled tools when Disabled tab clicked
    ✓ UI-TENANTSCAN-004: should enable tool when enable button clicked
    ✓ UI-TENANTSCAN-005: should disable tool when disable button clicked
    ✓ UI-TENANTSCAN-006: should open settings modal when settings button clicked
    ✓ UI-TENANTSCAN-007: should save settings when save button clicked in modal
    ✓ UI-TENANTSCAN-008: should close modal when cancel button clicked
    ✓ UI-TENANTSCAN-009: should retry loading when retry button clicked
    ✓ UI-TENANTSCAN-010: should display usage statistics for enabled tool
    ✓ UI-TENANTSCAN-011: should redirect when user lacks tenant-admin role
    ✓ UI-TENANTSCAN-012: should filter tools by search term

Test Suites: 2 passed, 2 total
Tests:       20 passed, 20 total
```

## 🏆 Run Complete Test Suite

### Full Test Run with Coverage
```bash
npm test -- --coverage --watchAll=false
```

### CI/CD Command
```bash
CI=true npm test -- --coverage --maxWorkers=2
```

## 📝 Test Organization

### By Priority
```bash
# Critical tests (auth, user management)
npm test -- --testPathPattern="Login|UserManagement"

# High priority (scanner operations)
npm test -- --testPathPattern="scanner"

# Medium priority (settings, profile)
npm test -- --testPathPattern="settings|Profile"
```

## 🔧 Troubleshooting

### Clear Jest Cache
```bash
npm test -- --clearCache
```

### Update Snapshots (if any)
```bash
npm test -- --updateSnapshot
```

### Run with No Cache
```bash
npm test -- --no-cache
```

### Check Test Configuration
```bash
cat package.json | grep -A 10 "jest"
```

## 📈 Coverage Reports

### Generate HTML Coverage Report
```bash
npm test -- --coverage --coverageDirectory=coverage
open coverage/index.html
```

### Coverage Thresholds
```javascript
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

## 🎓 Test Examples

### Example: Running Login Tests
```bash
$ npm test Login.test.tsx

PASS src/components/__tests__/Login.test.tsx
  Login Component
    ✓ UI-LOGIN-001: renders login form correctly (45ms)
    ✓ UI-LOGIN-001: should submit login form with loading state (89ms)
    ✓ UI-LOGIN-002: should toggle to sign up mode (32ms)
    ✓ UI-LOGIN-003: should toggle back to sign in mode (28ms)
    ✓ UI-LOGIN-004: should handle sign up submission (76ms)
    ...

Tests:       12 passed, 12 total
Time:        2.341 s
```

### Example: Running with Coverage
```bash
$ npm test -- --coverage

PASS src/components/__tests__/Login.test.tsx
PASS src/components/admin/__tests__/UserManagement.test.tsx
PASS src/components/scanner/__tests__/MyScanners.test.tsx
PASS src/components/scanner/__tests__/TenantScannerTools.test.tsx
...

-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
-------------------|---------|----------|---------|---------|-------------------
All files          |   85.23 |    78.45 |   82.67 |   86.12 |                   
 Login.tsx         |   92.31 |    87.50 |   90.00 |   93.75 | 45,67,89          
 UserManagement.tsx|   88.46 |    82.35 |   85.71 |   89.13 | 123,145           
 MyScanners.tsx    |   90.12 |    85.23 |   88.88 |   91.45 | 78,102            
 ...
```

## 📚 Additional Resources

- **Test Documentation**: `Camelot-test-cases/02-ui-button-tests.md`
- **Implementation Summary**: `Camelot-test-cases/UI-BUTTON-TESTS-IMPLEMENTATION.md`
- **React Testing Library**: https://testing-library.com/react
- **Jest Documentation**: https://jestjs.io/docs/getting-started

## 🎯 Success Criteria

✅ All 90+ test cases pass  
✅ No console errors or warnings  
✅ Coverage > 80% for button interactions  
✅ All async operations properly handled  
✅ All accessibility queries used correctly  

---

**Quick Command Summary**:
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific component
npm test ComponentName.test.tsx

# Run new tests only
npm test -- --testPathPattern="MyScanners|TenantScannerTools"

# Watch mode
npm test -- --watch
```

---

**Need Help?** Check the test files for detailed examples and patterns.

