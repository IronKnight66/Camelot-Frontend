// src/aws-config.ts
import { Amplify } from 'aws-amplify';

// Get configuration from environment variables
const awsConfig = {
  Auth: {
    Cognito: {
      region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
      userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
      userPoolClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
      loginWith: {
        oauth: {
          domain: process.env.REACT_APP_COGNITO_DOMAIN || '',
          scopes: ['email', 'openid', 'profile'],
          redirectSignIn: [process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000/'],
          redirectSignOut: [process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000/'],
          responseType: 'code' as const
        }
      }
    }
  }
};

// Configure Amplify
Amplify.configure(awsConfig);

export default awsConfig;
