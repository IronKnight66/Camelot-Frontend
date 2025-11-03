# How to Configure Cognito to Include Groups in ID Token

## Problem
The ID token doesn't include `cognito:groups`, which means users can't be properly authorized by role in the application.

## Solution

### Step 1: Add User to Cognito Groups

1. Go to AWS Console → Cognito → User Pools
2. Select your User Pool: `us-east-1_dKkd0TIko`
3. Go to "Users" tab
4. Find your user: `admin@acme.com` (username: 94f824d8-b091-70e8-2716-56ae2b1842fc)
5. Click on the user → "Groups" tab → "Add to group"
6. Add user to one of:
   - `super-admin` - Full access
   - `tenant-admin` - Tenant management
   - Regular user (no group needed for basic access)

### Step 2: Configure App Client to Include Groups

The App Client needs to be configured to read group information.

#### Option A: Via AWS Console (Web UI)

1. Go to your User Pool
2. Click on "App integration" tab
3. Find App client: `5jvbdg433l8t5efvp9v0c07qon`
4. Click "Edit"
5. Under "Attribute read and write permissions", ensure:
   - Users can read and write own attributes
   - OR at minimum, enable read access for group information
6. Click "Save changes"

#### Option B: Via AWS CLI

```bash
# Update the App Client to read group information
aws cognito-idp update-user-pool-client \
  --user-pool-id us-east-1_dKkd0TIko \
  --client-id 5jvbdg433l8t5efvp9v0c07qon \
  --read-attributes email openid profile \
  --write-attributes email
```

### Step 3: Verify Group is in Token

After signing in again, you should see in the browser console:
```
"cognito:groups": ["super-admin"]
```

### Step 4: Test the Application

1. Sign out and sign back in to get a new token
2. Check browser console for: "User groups: ['super-admin']"
3. The `/api/v1/scanner-tools/my-tools` endpoint should now work
4. The user role should be calculated correctly: "super-admin", "tenant-admin", or "user"

## Creating Cognito Groups

If groups don't exist yet:

```bash
# Create super-admin group
aws cognito-idp create-group \
  --user-pool-id us-east-1_dKkd0TIko \
  --group-name super-admin \
  --description "Super administrators with full access"

# Create tenant-admin group
aws cognito-idp create-group \
  --user-pool-id us-east-1_dKkd0TIko \
  --group-name tenant-admin \
  --description "Tenant administrators"
```

Or via AWS Console:
1. User Pools → Your Pool → "Groups" tab
2. Click "Create group"
3. Name: `super-admin` or `tenant-admin`
4. Create the group

## Alternative: Use Custom Claims

If you can't modify the App Client settings, you can add groups as custom claims via a Lambda trigger:

1. User Pool → "Sign-in experience" → "Lambda triggers"
2. Create a "Pre token generation" trigger
3. Add groups to the token in the Lambda function

But the easier solution is to configure the App Client properly.

## Verification

After completing the steps above:

1. Sign out and sign in again
2. Open browser console
3. Look for:
   - `cognito:groups` in the ID Token payload
   - User groups array should not be empty
   - User role should be "super-admin" instead of "user"

## Troubleshooting

### Groups still not in token?
- Check if the user is actually assigned to the group
- Try creating a new App Client with proper permissions
- Verify the App Client has "read" access to group information

### Getting 403 errors?
- The backend API needs to accept users with the appropriate groups
- Check CloudWatch logs for the Lambda/API Gateway
- Ensure the API authorizer recognizes the group claim

