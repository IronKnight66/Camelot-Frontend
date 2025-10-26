# Fixed 403 Forbidden Error on /api/v1/scanner-tools/my-tools

## Issues Found and Fixed

### 1. **User Groups Not Being Fetched**
- **Problem**: The `AuthContext` was always setting `groups: []` for all users
- **Impact**: Without group information, users couldn't be properly authenticated or authorized by the backend
- **Solution**: Modified `src/contexts/AuthContext.tsx` to fetch groups from the Cognito ID token payload

### 2. **Development Proxy Configuration**
- **Problem**: API requests were attempting to go to `:8000` directly instead of being proxied
- **Impact**: Requests were failing in development due to CORS or connectivity issues
- **Solution**: 
  - Created `src/setupProxy.js` to proxy API requests to the backend API Gateway
  - Modified `src/services/api.ts` to use relative paths in development (which uses the proxy) and absolute URLs in production

### 3. **Cognito Configuration**
- **Added**: OAuth flows and scopes to ensure groups are included in tokens
- **File**: `src/aws-config.ts`

## Changes Made

### Files Modified
1. **src/contexts/AuthContext.tsx**
   - Added `fetchAuthSession` import
   - Updated `checkUser()` and `handleSignIn()` to extract groups from ID token payload
   - Groups are now fetched from `payload['cognito:groups']` in the JWT token

2. **src/services/api.ts**
   - Modified baseURL to use relative paths in development (`/`)
   - In production, uses `REACT_APP_API_URL` from environment

3. **src/aws-config.ts**
   - Added `allowedOAuthFlows` and `allowedOAuthScopes` configuration

4. **src/setupProxy.js** (NEW FILE)
   - Creates proxy middleware for development
   - Proxies `/api/*` requests to the API Gateway
   - Forwards Authorization headers correctly

## How It Works Now

### Development Mode
1. User authenticates with Cognito
2. Groups are extracted from ID token: `user.groups = ['super-admin']` or similar
3. API requests go to `/api/v1/scanner-tools/my-tools` (relative path)
4. `setupProxy.js` intercepts and proxies to the API Gateway
5. Authorization header is forwarded to the backend

### Production Mode
1. Same authentication and group extraction
2. API requests go directly to the API Gateway URL
3. No proxy needed (nginx handles it in Docker)

## Verification Steps

### 1. Check User Groups
After signing in, the user should have groups populated:
```javascript
// In browser console
// Check: user.groups should not be an empty array
console.log('User groups:', authContext.user.groups);
```

### 2. Check API Requests
In development, you should see proxy logs:
```
Proxying request: GET /api/v1/scanner-tools/my-tools
Proxy response: 200 /api/v1/scanner-tools/my-tools
```

### 3. Check Token
The Authorization header should be sent with each request:
```
Authorization: Bearer <jwt-token>
```

## Backend Requirements

For the `/api/v1/scanner-tools/my-tools` endpoint to work, ensure:

1. **User Must Be in a Cognito Group**: User needs to be assigned to a Cognito group (or have groups in their token)
2. **Cognito App Client Configuration**: The App Client must be configured to include groups in the ID token
   - Go to Cognito → User Pools → App Clients → Edit
   - Ensure "Generate client secret" is unchecked (for public clients)
   - The API must authorize based on Cognito groups

3. **API Gateway Authorization**: The backend API must be configured to:
   - Use Cognito User Pool authorizer
   - Have the necessary Lambda permissions

## Testing

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Sign in** and navigate to `/my-scanners`

3. **Check the browser console** for:
   - Proxy logs showing requests being proxied
   - Any 403 errors (should be gone now)
   - User groups being logged

4. **Check Network tab**:
   - Request to `/api/v1/scanner-tools/my-tools` should return 200
   - Authorization header should be present

## If Still Getting 403

1. **Check Cognito Groups**: Ensure the user is assigned to the correct Cognito group
2. **Check Backend**: The backend endpoint might require different permissions
3. **Check Token**: Verify the JWT token contains the groups claim
4. **Check CORS**: If still going direct to API Gateway, check CORS configuration
5. **Check Backend Logs**: Look at CloudWatch logs for the Lambda function handling this endpoint

## Environment Variables

No changes needed to `.env` - the existing configuration should work.

