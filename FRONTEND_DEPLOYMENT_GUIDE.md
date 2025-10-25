# Frontend Deployment Script Documentation

## Overview

The `deploy-frontend.sh` script automates the complete deployment process for the Camelot React frontend to AWS ECS. It handles building, containerizing, and deploying the application with proper AWS integration.

## Prerequisites

Before running the deployment script, ensure you have:

1. **Docker** installed and running
2. **AWS CLI** configured with appropriate permissions
3. **Node.js** and **npm** installed
4. **Frontend code** in the `camelot-frontend` directory
5. **AWS resources** deployed via Terraform (ECS cluster, ECR repository, etc.)

## Usage

### Full Deployment (Default)
```bash
./deploy-frontend.sh
# or
./deploy-frontend.sh full
```

### Build Only
```bash
./deploy-frontend.sh build-only
```

### Deploy Only (Existing Image)
```bash
./deploy-frontend.sh deploy-only
```

### Help
```bash
./deploy-frontend.sh help
```

## What the Script Does

### 1. Prerequisites Check
- Verifies Docker is installed and running
- Checks AWS CLI configuration
- Validates Node.js and npm installation
- Confirms frontend directory structure

### 2. Build Process
- Installs npm dependencies
- Creates production React build
- Builds Docker image for linux/amd64 platform
- Tags image for ECR repository

### 3. AWS Deployment
- Pushes Docker image to ECR
- Retrieves environment variables from AWS Secrets Manager
- Creates/updates ECS task definition
- Updates ECS service with new image
- Waits for deployment completion

### 4. Configuration Management
The script automatically configures:

- **Cognito Integration**: User pool ID, client ID, domain
- **API Gateway**: Backend API URL
- **Environment Variables**: Production settings
- **Security**: Proper IAM roles and secrets management

## Environment Variables

The script retrieves these from AWS Secrets Manager:

- `REACT_APP_COGNITO_USER_POOL_ID`
- `REACT_APP_COGNITO_CLIENT_ID` 
- `REACT_APP_COGNITO_DOMAIN`
- `REACT_APP_API_URL`
- `REACT_APP_AWS_REGION`

## AWS Resources Required

The script expects these AWS resources to exist:

- **ECR Repository**: `security-orchestration-dev-frontend`
- **ECS Cluster**: `security-orchestration-dev-cluster`
- **ECS Service**: `security-orchestration-dev-frontend-service`
- **IAM Roles**: Task execution and task roles
- **Secrets Manager**: Cognito configuration secrets
- **Load Balancer**: Target group for frontend service

## Troubleshooting

### Common Issues

1. **Docker not running**
   ```bash
   # Start Docker Desktop or Docker daemon
   sudo systemctl start docker  # Linux
   ```

2. **AWS credentials not configured**
   ```bash
   aws configure
   ```

3. **Frontend directory not found**
   - Ensure `camelot-frontend` directory exists
   - Check that `package.json` is present

4. **ECR repository doesn't exist**
   ```bash
   # Create ECR repository
   aws ecr create-repository --repository-name security-orchestration-dev-frontend --region us-east-1
   ```

5. **ECS service creation fails**
   - Verify VPC and subnets exist
   - Check security groups are configured
   - Ensure load balancer target group exists

### Debug Mode

Add debug output by modifying the script:
```bash
set -x  # Add this after the shebang for debug output
```

### Manual Steps

If the script fails, you can run steps manually:

1. **Build locally**:
   ```bash
   cd camelot-frontend
   npm install
   npm run build
   docker build --platform linux/amd64 -t security-orchestration-dev-frontend:latest .
   ```

2. **Push to ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 535002872918.dkr.ecr.us-east-1.amazonaws.com
   docker tag security-orchestration-dev-frontend:latest 535002872918.dkr.ecr.us-east-1.amazonaws.com/security-orchestration-dev-frontend:latest
   docker push 535002872918.dkr.ecr.us-east-1.amazonaws.com/security-orchestration-dev-frontend:latest
   ```

3. **Update ECS service**:
   ```bash
   aws ecs update-service --cluster security-orchestration-dev-cluster --service security-orchestration-dev-frontend-service --force-new-deployment --region us-east-1
   ```

## Integration with Terraform

The deployment script is designed to work with the existing Terraform infrastructure:

- Uses the same naming conventions
- Integrates with existing ECS cluster
- Uses configured load balancer and target groups
- Leverages existing IAM roles and policies

## Security Considerations

- All sensitive configuration is stored in AWS Secrets Manager
- Docker images are scanned for vulnerabilities
- ECS tasks run with minimal required permissions
- Network traffic is encrypted in transit

## Monitoring and Logs

After deployment, monitor the application:

- **ECS Service**: Check service status and task health
- **CloudWatch Logs**: View application logs
- **Load Balancer**: Monitor traffic and health checks
- **API Gateway**: Check API integration

## Rollback Procedure

If deployment fails or issues occur:

1. **Revert to previous task definition**:
   ```bash
   aws ecs update-service --cluster security-orchestration-dev-cluster --service security-orchestration-dev-frontend-service --task-definition security-orchestration-dev-frontend:PREVIOUS_REVISION --region us-east-1
   ```

2. **Check service status**:
   ```bash
   aws ecs describe-services --cluster security-orchestration-dev-cluster --services security-orchestration-dev-frontend-service --region us-east-1
   ```

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Verify Terraform infrastructure is properly deployed
4. Ensure all prerequisites are met
