# Camelot Frontend

A React-based frontend application for the Camelot security orchestration platform with multi-tenant authentication and AWS integration.

## 🚀 Features

- **Multi-tenant Authentication**: AWS Cognito integration with user management
- **Responsive Design**: Mobile-first design with modern UI/UX
- **API Integration**: Seamless communication with Camelot API backend
- **Security Dashboard**: Overview of scans, findings, and security metrics
- **Protected Routes**: Secure navigation with authentication guards
- **Docker Support**: Containerized deployment ready

## 🏗️ Architecture

- **Framework**: React 18 with TypeScript
- **Authentication**: AWS Cognito with Amplify
- **Routing**: React Router v6
- **HTTP Client**: Axios with interceptors
- **Styling**: CSS Modules with responsive design
- **Deployment**: Docker with Nginx

## 📁 Project Structure

```
camelot-frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # React components
│   │   ├── Login.tsx      # Authentication component
│   │   ├── Home.tsx       # Dashboard component
│   │   └── ProtectedRoute.tsx
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx # Authentication context
│   ├── services/          # API services
│   │   └── api.ts         # API client
│   ├── aws-config.ts      # AWS Amplify configuration
│   ├── App.tsx           # Main application component
│   └── index.tsx         # Application entry point
├── Dockerfile            # Container configuration
├── nginx.conf           # Nginx configuration
└── env.example          # Environment variables template
```

## 🛠️ Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- AWS Cognito User Pool configured
- Camelot API backend running

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd camelot-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your AWS Cognito and API configuration
   ```

4. **Start development server**
   ```bash
   npm start
   ```

The application will be available at `http://localhost:3000`

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_AWS_REGION` | AWS region | Yes |
| `REACT_APP_COGNITO_USER_POOL_ID` | Cognito User Pool ID | Yes |
| `REACT_APP_COGNITO_CLIENT_ID` | Cognito Client ID | Yes |
| `REACT_APP_COGNITO_DOMAIN` | Cognito domain | Yes |
| `REACT_APP_API_URL` | Backend API URL | Yes |
| `REACT_APP_REDIRECT_SIGN_IN` | OAuth redirect URL | Yes |
| `REACT_APP_REDIRECT_SIGN_OUT` | OAuth sign out URL | Yes |

## 🚀 Deployment

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t camelot-frontend .
   ```

2. **Run the container**
   ```bash
   docker run -p 80:80 camelot-frontend
   ```

### AWS ECS Deployment

The frontend is designed to work with the existing Terraform infrastructure:

1. **Build and push to ECR**
   ```bash
   # Build for linux/amd64 platform
   docker build --platform linux/amd64 -t camelot-frontend .
   
   # Tag for ECR
   docker tag camelot-frontend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/camelot-frontend:latest
   
   # Push to ECR
   docker push <account-id>.dkr.ecr.<region>.amazonaws.com/camelot-frontend:latest
   ```

2. **Update ECS service**
   ```bash
   aws ecs update-service --cluster <cluster-name> --service <service-name> --force-new-deployment
   ```

## 🔐 Authentication Flow

1. **User Registration**: Users can sign up with email and password
2. **Email Verification**: Cognito sends verification code to email
3. **Sign In**: Users authenticate with username/password
4. **JWT Tokens**: Access tokens are automatically included in API requests
5. **Protected Routes**: Authentication state determines access to pages
6. **Sign Out**: Users can securely sign out and clear session

## 📱 User Interface

### Login Page
- Clean, modern design with gradient background
- Sign up/Sign in toggle
- Email verification flow
- Password reset functionality
- Responsive design for mobile devices

### Dashboard (Home Page)
- Security overview cards (scans, findings, critical issues)
- Recent scans table with status indicators
- Recent findings table with severity badges
- User information and sign out functionality
- Responsive grid layout

## 🔧 API Integration

The frontend communicates with the Camelot API through:

- **Authentication**: JWT tokens automatically attached to requests
- **Error Handling**: Automatic token refresh and redirect on 401 errors
- **Data Fetching**: Parallel API calls for optimal performance
- **Type Safety**: TypeScript interfaces for API responses

### Available API Endpoints

- `GET /api/v1/scans` - List security scans
- `POST /api/v1/scans` - Create new scan
- `GET /api/v1/findings` - List security findings
- `POST /api/v1/ai/analyze/{findingId}` - AI analysis

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm test -- --watch
```

## 📦 Build

Create production build:

```bash
npm run build
```

The build artifacts will be stored in the `build/` directory.

## 🔄 CI/CD Integration

The frontend integrates with the existing Terraform CI/CD pipeline:

- **CodeBuild**: Automated builds and tests
- **ECR**: Container image storage
- **ECS**: Container orchestration
- **ALB**: Load balancing and SSL termination

## 🎨 Styling

- **CSS Modules**: Component-scoped styling
- **Responsive Design**: Mobile-first approach
- **Modern UI**: Clean, professional design
- **Accessibility**: WCAG compliant components
- **Performance**: Optimized CSS with minimal bundle size

## 🔒 Security

- **HTTPS Only**: All communications encrypted
- **CSP Headers**: Content Security Policy implemented
- **XSS Protection**: Cross-site scripting prevention
- **Secure Headers**: Security headers configured in Nginx
- **Token Management**: Secure JWT token handling

## 📊 Performance

- **Code Splitting**: Lazy loading of components
- **Bundle Optimization**: Minimized JavaScript bundles
- **Image Optimization**: Compressed and optimized assets
- **Caching**: Static asset caching with long TTL
- **Gzip Compression**: Compressed responses

## 🆘 Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Verify Cognito configuration
   - Check redirect URLs
   - Ensure user pool is active

2. **API Connection Issues**
   - Verify API URL configuration
   - Check CORS settings
   - Ensure API Gateway is deployed

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check TypeScript configuration
   - Verify environment variables

### Debug Mode

Enable debug logging:

```bash
REACT_APP_DEBUG=true npm start
```

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Related Projects

- [Camelot API](../camelot-api) - Backend API service
- [Camelot Terraform](../camelot-terraform) - Infrastructure as code