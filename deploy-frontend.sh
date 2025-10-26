#!/bin/bash

# Camelot Frontend Deployment Script
# This script builds, pushes, and deploys the React frontend to AWS ECS

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="security-orchestration"
ENVIRONMENT="dev"
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="535002872918"
ECR_REPOSITORY="${PROJECT_NAME}-${ENVIRONMENT}-frontend"
ECS_CLUSTER="${PROJECT_NAME}-${ENVIRONMENT}-cluster"
ECS_SERVICE="${PROJECT_NAME}-${ENVIRONMENT}-frontend-service"
ECS_TASK_DEFINITION="${PROJECT_NAME}-${ENVIRONMENT}-frontend"

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="${SCRIPT_DIR}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if AWS CLI is installed
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install AWS CLI first."
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured or invalid. Please run 'aws configure' first."
        exit 1
    fi
    
    local caller_identity=$(aws sts get-caller-identity --query 'Account' --output text)
    if [ "$caller_identity" != "$AWS_ACCOUNT_ID" ]; then
        print_warning "AWS account ID ($caller_identity) doesn't match expected account ID ($AWS_ACCOUNT_ID)"
    fi
    
    print_success "AWS credentials are valid"
}

# Function to check if frontend directory exists
check_frontend_directory() {
    print_status "Checking frontend directory..."
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_error "Frontend directory not found: $FRONTEND_DIR"
        print_error "Please ensure the frontend code is in the correct location."
        exit 1
    fi
    
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_error "package.json not found in frontend directory"
        exit 1
    fi
    
    print_success "Frontend directory found"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR"
    
    if [ ! -d "node_modules" ]; then
        print_status "Installing npm dependencies..."
        npm install
    else
        print_status "Dependencies already installed, skipping..."
    fi
    
    print_success "Dependencies installed"
}

# Function to build the React application
build_frontend() {
    print_status "Building React application..."
    
    cd "$FRONTEND_DIR"
    
    # Create production build
    print_status "Creating production build..."
    npm run build
    
    if [ ! -d "build" ]; then
        print_error "Build failed - build directory not found"
        exit 1
    fi
    
    print_success "Frontend build completed"
}

# Function to build Docker image
build_docker_image() {
    print_status "Building Docker image..."
    
    cd "$FRONTEND_DIR"
    
    # Get Cognito configuration from Secrets Manager
    COGNITO_USER_POOL_ID=$(aws secretsmanager get-secret-value \
        --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-cognito-user-pool-id" \
        --query 'SecretString' \
        --output text --region $AWS_REGION 2>/dev/null || echo "us-east-1_v5vWtap1R")
    
    COGNITO_CLIENT_ID=$(aws secretsmanager get-secret-value \
        --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-cognito-client-id" \
        --query 'SecretString' \
        --output text --region $AWS_REGION 2>/dev/null || echo "1i3euls7ljtesoi0il87qu5rjj")
    
    # Get API Gateway URL
    API_GATEWAY_URL=$(aws apigateway get-rest-apis \
        --query "items[?name=='${PROJECT_NAME}-${ENVIRONMENT}-api'].id" \
        --output text --region $AWS_REGION 2>/dev/null | head -1 || echo "x0q0fkiuj9")
    
    # Clean any whitespace from the API Gateway URL
    API_GATEWAY_URL=$(echo "$API_GATEWAY_URL" | tr -d '[:space:]')
    
    if [ -n "$API_GATEWAY_URL" ]; then
        API_URL="https://${API_GATEWAY_URL}.execute-api.${AWS_REGION}.amazonaws.com/${ENVIRONMENT}"
    else
        API_URL="https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev"
    fi
    
    COGNITO_DOMAIN="security-orchestration-dev-auth.auth.us-east-1.amazoncognito.com"
    
    # Build the image for linux/amd64 platform (required for ECS Fargate)
    print_status "Building for linux/amd64 platform..."
    docker build --platform linux/amd64 \
        --build-arg REACT_APP_AWS_REGION=$AWS_REGION \
        --build-arg REACT_APP_COGNITO_USER_POOL_ID=$COGNITO_USER_POOL_ID \
        --build-arg REACT_APP_COGNITO_CLIENT_ID=$COGNITO_CLIENT_ID \
        --build-arg REACT_APP_COGNITO_DOMAIN=$COGNITO_DOMAIN \
        --build-arg REACT_APP_REDIRECT_SIGN_IN="https://security.ironknight6.com/" \
        --build-arg REACT_APP_REDIRECT_SIGN_OUT="https://security.ironknight6.com/" \
        --build-arg REACT_APP_API_URL=$API_URL \
        -t ${ECR_REPOSITORY}:latest \
        .
    
    # Tag the image for ECR
    docker tag ${ECR_REPOSITORY}:latest ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
    
    print_success "Docker image built and tagged"
}

# Function to push image to ECR
push_to_ecr() {
    print_status "Pushing image to ECR..."
    
    # Login to ECR
    print_status "Logging in to ECR..."
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com
    
    # Push the image
    print_status "Pushing image to ECR repository..."
    docker push ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest
    
    print_success "Image pushed to ECR"
}

# Function to get environment variables from AWS
get_environment_variables() {
    print_status "Retrieving environment variables from AWS..."
    
    # Get Cognito configuration from Secrets Manager
    COGNITO_USER_POOL_ID=$(aws secretsmanager get-secret-value \
        --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-cognito-user-pool-id" \
        --query 'SecretString' \
        --output text --region $AWS_REGION 2>/dev/null || echo "us-east-1_v5vWtap1R")
    
    COGNITO_CLIENT_ID=$(aws secretsmanager get-secret-value \
        --secret-id "${PROJECT_NAME}-${ENVIRONMENT}-cognito-client-id" \
        --query 'SecretString' \
        --output text --region $AWS_REGION 2>/dev/null || echo "1i3euls7ljtesoi0il87qu5rjj")
    
    # Get API Gateway URL
    API_GATEWAY_URL=$(aws apigateway get-rest-apis \
        --query "items[?name=='${PROJECT_NAME}-${ENVIRONMENT}-api'].id" \
        --output text --region $AWS_REGION 2>/dev/null | head -1 || echo "x0q0fkiuj9")
    
    # Clean any whitespace from the API Gateway URL
    API_GATEWAY_URL=$(echo "$API_GATEWAY_URL" | tr -d '[:space:]')
    
    if [ -n "$API_GATEWAY_URL" ]; then
        API_URL="https://${API_GATEWAY_URL}.execute-api.${AWS_REGION}.amazonaws.com/${ENVIRONMENT}"
    else
        API_URL="https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev"
    fi
    
    # Get Cognito domain
    COGNITO_DOMAIN="security-orchestration-dev-auth.auth.us-east-1.amazoncognito.com"
    
    print_success "Environment variables retrieved"
}

# Function to create or update ECS task definition
create_task_definition() {
    print_status "Creating ECS task definition..."
    
    # Create task definition JSON
    cat > /tmp/frontend-task-definition.json << EOF
{
  "family": "${ECS_TASK_DEFINITION}",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-${ENVIRONMENT}-ecs-task-execution-role",
  "taskRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/${PROJECT_NAME}-${ENVIRONMENT}-frontend-task-role",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${ECR_REPOSITORY}:latest",
      "cpu": 256,
      "memory": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 80,
          "hostPort": 80,
          "protocol": "tcp"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/${PROJECT_NAME}-${ENVIRONMENT}-frontend",
          "awslogs-region": "${AWS_REGION}",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "REACT_APP_AWS_REGION",
          "value": "${AWS_REGION}"
        },
        {
          "name": "REACT_APP_API_URL",
          "value": "${API_URL}"
        },
        {
          "name": "REACT_APP_REDIRECT_SIGN_IN",
          "value": "https://${PROJECT_NAME}-${ENVIRONMENT}.example.com/"
        },
        {
          "name": "REACT_APP_REDIRECT_SIGN_OUT",
          "value": "https://${PROJECT_NAME}-${ENVIRONMENT}.example.com/"
        },
        {
          "name": "REACT_APP_COGNITO_DOMAIN",
          "value": "${COGNITO_DOMAIN}"
        }
      ]
    }
  ],
  "tags": [
    {
      "key": "Name",
      "value": "${PROJECT_NAME}-${ENVIRONMENT}-frontend-task"
    },
    {
      "key": "Environment",
      "value": "${ENVIRONMENT}"
    },
    {
      "key": "Project",
      "value": "${PROJECT_NAME}"
    }
  ]
}
EOF

    # Register the task definition
    print_status "Registering task definition..."
    TASK_DEFINITION_ARN=$(aws ecs register-task-definition \
        --cli-input-json file:///tmp/frontend-task-definition.json \
        --query 'taskDefinition.taskDefinitionArn' \
        --output text --region $AWS_REGION)
    
    print_success "Task definition created: $TASK_DEFINITION_ARN"
    
    # Clean up temporary file
    rm /tmp/frontend-task-definition.json
}

# Function to update ECS service
update_ecs_service() {
    print_status "Updating ECS service..."
    
    # Check if service exists
    if aws ecs describe-services \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE \
        --region $AWS_REGION \
        --query 'services[0].status' \
        --output text 2>/dev/null | grep -q "ACTIVE"; then
        
        print_status "Service exists, updating..."
        
        # Update the service
        aws ecs update-service \
            --cluster $ECS_CLUSTER \
            --service $ECS_SERVICE \
            --task-definition $ECS_TASK_DEFINITION \
            --region $AWS_REGION
        
        print_success "ECS service updated"
    else
        print_status "Service doesn't exist, creating..."
        
        # Get VPC and subnet information
        VPC_ID=$(aws ec2 describe-vpcs \
            --filters "Name=tag:Name,Values=${PROJECT_NAME}-${ENVIRONMENT}-vpc" \
            --query 'Vpcs[0].VpcId' \
            --output text --region $AWS_REGION)
        
        PRIVATE_SUBNETS=$(aws ec2 describe-subnets \
            --filters "Name=vpc-id,Values=$VPC_ID" "Name=tag:Name,Values=*private*" \
            --query 'Subnets[].SubnetId' \
            --output text --region $AWS_REGION | tr '\t' ',')
        
        SECURITY_GROUP_ID=$(aws ec2 describe-security-groups \
            --filters "Name=group-name,Values=security-orchestration-dev-frontend-*" \
            --query 'SecurityGroups[0].GroupId' \
            --output text --region $AWS_REGION)
        
        # Get target group ARN
        TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups \
            --names "sec-orch-dev-frontend" \
            --query 'TargetGroups[0].TargetGroupArn' \
            --output text --region $AWS_REGION)
        
        # Create the service
        aws ecs create-service \
            --cluster $ECS_CLUSTER \
            --service-name $ECS_SERVICE \
            --task-definition $ECS_TASK_DEFINITION \
            --desired-count 1 \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[$PRIVATE_SUBNETS],securityGroups=[$SECURITY_GROUP_ID],assignPublicIp=DISABLED}" \
            --load-balancers "targetGroupArn=$TARGET_GROUP_ARN,containerName=frontend,containerPort=80" \
            --region $AWS_REGION
        
        print_success "ECS service created"
    fi
}

# Function to wait for deployment
wait_for_deployment() {
    print_status "Waiting for deployment to complete..."
    
    # Wait for service to be stable
    aws ecs wait services-stable \
        --cluster $ECS_CLUSTER \
        --services $ECS_SERVICE \
        --region $AWS_REGION
    
    print_success "Deployment completed successfully"
}

# Function to get service URL
get_service_url() {
    print_status "Getting service URL..."
    
    # Get load balancer DNS name
    LOAD_BALANCER_ARN=$(aws elbv2 describe-target-groups \
        --names "sec-orch-dev-frontend" \
        --query 'TargetGroups[0].LoadBalancerArns[0]' \
        --output text --region $AWS_REGION)
    
    LOAD_BALANCER_DNS=$(aws elbv2 describe-load-balancers \
        --load-balancer-arns $LOAD_BALANCER_ARN \
        --query 'LoadBalancers[0].DNSName' \
        --output text --region $AWS_REGION)
    
    print_success "Frontend is available at: http://$LOAD_BALANCER_DNS"
    print_success "Or via API Gateway: https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev"
}

# Function to show help
show_help() {
    echo "Camelot Frontend Deployment Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  build-only     Only build the frontend (no deployment)"
    echo "  deploy-only    Only deploy (assumes image is already built and pushed)"
    echo "  full           Full build and deployment (default)"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                 # Full build and deployment"
    echo "  $0 build-only     # Only build the frontend"
    echo "  $0 deploy-only     # Only deploy existing image"
}

# Main deployment function
deploy_frontend() {
    print_status "Starting Camelot Frontend deployment..."
    
    # Check prerequisites
    check_prerequisites
    check_aws_credentials
    check_frontend_directory
    
    # Install dependencies and build
    install_dependencies
    build_frontend
    build_docker_image
    
    # Deploy to AWS
    push_to_ecr
    get_environment_variables
    create_task_definition
    update_ecs_service
    wait_for_deployment
    get_service_url
    
    print_success "Frontend deployment completed successfully!"
}

# Build only function
build_only() {
    print_status "Building frontend only..."
    
    check_prerequisites
    check_frontend_directory
    install_dependencies
    build_frontend
    build_docker_image
    
    print_success "Frontend build completed!"
    print_status "To deploy, run: $0 deploy-only"
}

# Deploy only function
deploy_only() {
    print_status "Deploying existing image..."
    
    check_prerequisites
    check_aws_credentials
    
    push_to_ecr
    get_environment_variables
    create_task_definition
    update_ecs_service
    wait_for_deployment
    get_service_url
    
    print_success "Frontend deployment completed!"
}

# Main script logic
case "${1:-full}" in
    "build-only")
        build_only
        ;;
    "deploy-only")
        deploy_only
        ;;
    "full")
        deploy_frontend
        ;;
    "help")
        show_help
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
