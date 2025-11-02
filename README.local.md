# Local Development Guide

This guide explains how to run the Camelot frontend locally with AWS Cognito authentication.

## Prerequisites

- Node.js 18+
- npm
- AWS Account access (for Cognito authentication)

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - The app will use AWS Cognito for authentication
   - API calls will go to the dev AWS API Gateway by default

## Configuration

The `.env.local` file contains configuration for local development:

### Current Configuration

```
REACT_APP_AWS_REGION=us-east-1
REACT_APP_COGNITO_USER_POOL_ID=us-east-1_wEfMZVfy3
REACT_APP_COGNITO_CLIENT_ID=ud8656v59gbt7avd6slhf76qk
REACT_APP_API_URL=https://z88575vggf.execute-api.us-east-1.amazonaws.com/dev
REACT_APP_REDIRECT_SIGN_IN=http://localhost:3000/
REACT_APP_REDIRECT_SIGN_OUT=http://localhost:3000/
```

### API Backend Options

#### Option 1: Use AWS Dev API Gateway (Default - Recommended)
The default configuration connects to the AWS dev environment API Gateway.

**Pros:**
- Test with real AWS services (Cognito, DynamoDB, etc.)
- No local backend setup required
- Matches production environment

**Cons:**
- Requires internet connection
- May incur AWS costs

#### Option 2: Use Local Backend
To run against a local backend, edit `.env.local` and change:

```bash
# Comment out AWS API Gateway
# REACT_APP_API_URL=https://z88575vggf.execute-api.us-east-1.amazonaws.com/dev

# Uncomment local backend
REACT_APP_API_URL=http://localhost:8000
```

## AWS Cognito Authentication

The local development environment uses the **AWS Cognito Dev User Pool** for authentication.

### Cognito Configuration
- **User Pool ID**: `us-east-1_wEfMZVfy3`
- **Client ID**: `ud8656v59gbt7avd6slhf76qk`
- **Callback URLs**: Configured to accept `http://localhost:3000/`

### Creating Test Users

To create test users in the Cognito User Pool:

```bash
# Create a new user
aws cognito-idp admin-create-user \
  --user-pool-id us-east-1_wEfMZVfy3 \
  --username testuser@example.com \
  --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true \
  --temporary-password TempPassword123! \
  --region us-east-1

# Set permanent password (optional)
aws cognito-idp admin-set-user-password \
  --user-pool-id us-east-1_wEfMZVfy3 \
  --username testuser@example.com \
  --password YourPassword123! \
  --permanent \
  --region us-east-1
```

## Troubleshooting

### Cognito Redirect Issues

If you experience redirect issues after login:
1. Verify `http://localhost:3000/` is in the Cognito App Client's Callback URLs
2. Check the browser console for errors
3. Ensure `.env.local` has the correct redirect URLs

### API Connection Issues

If API calls fail:
1. Check that the API Gateway URL is correct
2. Verify your Cognito token is valid (check browser dev tools)
3. Ensure CORS is properly configured on API Gateway

### Clear Browser Cache

If you experience auth issues:
```bash
# Clear localStorage and cookies
# In browser console:
localStorage.clear()
# Then refresh the page
```

## Available Scripts

- `npm start` - Run development server on http://localhost:3000
- `npm run build` - Build for production
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run e2e tests with Playwright UI
- `npm run test:e2e:headed` - Run e2e tests in headed mode

## Development Workflow

1. **Make code changes** in `src/`
2. **Test locally** at http://localhost:3000
3. **Run tests** with `npm test`
4. **Commit and push** to trigger CI/CD pipeline
5. **Tag for deployment** (e.g., `git tag dev-v1.1.x`)

## Environment Files

- `.env` - Default environment variables (committed to git)
- `.env.local` - Local overrides (gitignored, for local dev)
- `.env.playwright` - Playwright test configuration

## Notes

- Cognito authentication is shared with the dev environment
- Local changes do not affect deployed environments
- API calls require valid Cognito authentication tokens
- The app automatically redirects to Cognito's hosted UI for login
