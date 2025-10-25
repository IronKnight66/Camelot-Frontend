// src/aws-config.ts
import { Amplify } from 'aws-amplify';

// Get configuration from environment variables
const awsConfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION || 'us-east-1',
    userPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID || '',
    userPoolWebClientId: process.env.REACT_APP_COGNITO_CLIENT_ID || '',
    oauth: {
      domain: process.env.REACT_APP_COGNITO_DOMAIN || '',
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: process.env.REACT_APP_REDIRECT_SIGN_IN || 'http://localhost:3000/',
      redirectSignOut: process.env.REACT_APP_REDIRECT_SIGN_OUT || 'http://localhost:3000/',
      responseType: 'code'
    }
  },
  API: {
    endpoints: [
      {
        name: 'camelot-api',
        endpoint: process.env.REACT_APP_API_URL || 'https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev',
        region: process.env.REACT_APP_AWS_REGION || 'us-east-1'
      }
    ]
  }
};

// Configure Amplify
Amplify.configure(awsConfig);

export default awsConfig;
