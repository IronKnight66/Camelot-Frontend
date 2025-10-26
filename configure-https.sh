#!/bin/bash

# Configure HTTPS for security.ironknight6.com
# This script updates the SSL policy and adds HTTP to HTTPS redirect

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Configuring HTTPS for security.ironknight6.com..."

# Configuration
AWS_REGION="us-east-1"
LOAD_BALANCER_ARN="arn:aws:elasticloadbalancing:us-east-1:535002872918:loadbalancer/app/security-orchestration-dev-alb/c1f2473bb094c271"
HTTPS_LISTENER_ARN="arn:aws:elasticloadbalancing:us-east-1:535002872918:listener/app/security-orchestration-dev-alb/c1f2473bb094c271/3993b19814e0e205"
CERTIFICATE_ARN="arn:aws:acm:us-east-1:535002872918:certificate/9c91733f-2139-43bd-a1f2-c20519c916a0"
TARGET_GROUP_ARN="arn:aws:elasticloadbalancing:us-east-1:535002872918:targetgroup/sec-orch-dev-frontend/63260b2a9757ba6d"

# Find the HTTP listener on port 80 or 3000 that forwards to the frontend
print_status "Finding HTTP listener for frontend..."

HTTP_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn $LOAD_BALANCER_ARN \
    --region $AWS_REGION \
    --query 'Listeners[?Port==`3000`].ListenerArn' \
    --output text)

if [ -z "$HTTP_LISTENER" ]; then
    print_error "Could not find HTTP listener for frontend"
    exit 1
fi

print_success "Found HTTP listener: $HTTP_LISTENER"

# Update HTTPS listener with modern SSL policy
print_status "Updating HTTPS listener with modern SSL policy..."
aws elbv2 modify-listener \
    --listener-arn $HTTPS_LISTENER_ARN \
    --ssl-policy ELBSecurityPolicy-TLS13-1-2-2021-06 \
    --region $AWS_REGION \
    --certificates CertificateArn=$CERTIFICATE_ARN

print_success "SSL policy updated to ELBSecurityPolicy-TLS13-1-2-2021-06"

# Configure HTTP to HTTPS redirect
print_status "Configuring HTTP to HTTPS redirect on port 3000..."
aws elbv2 modify-listener \
    --listener-arn $HTTP_LISTENER \
    --protocol HTTP \
    --port 3000 \
    --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
    --region $AWS_REGION

print_success "HTTP to HTTPS redirect configured"

# Also update the port 80 listener if it exists
print_status "Checking for port 80 listener..."
PORT_80_LISTENER=$(aws elbv2 describe-listeners \
    --load-balancer-arn $LOAD_BALANCER_ARN \
    --region $AWS_REGION \
    --query 'Listeners[?Port==`80`].ListenerArn' \
    --output text)

if [ ! -z "$PORT_80_LISTENER" ]; then
    print_status "Found port 80 listener, configuring redirect..."
    aws elbv2 modify-listener \
        --listener-arn $PORT_80_LISTENER \
        --protocol HTTP \
        --port 80 \
        --default-actions Type=redirect,RedirectConfig="{Protocol=HTTPS,Port=443,StatusCode=HTTP_301}" \
        --region $AWS_REGION
    print_success "Port 80 redirect configured"
fi

print_success "HTTPS configuration complete!"
print_status "The site https://security.ironknight6.com should now work with TLS 1.3/1.2"
print_status "All HTTP traffic will be automatically redirected to HTTPS"

