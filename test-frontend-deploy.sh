#!/bin/bash

# Quick test script for frontend deployment
# This script tests the deployment script without actually deploying

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Test script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-frontend.sh"

print_status "Testing frontend deployment script..."

# Test 1: Check if script exists and is executable
if [ -f "$DEPLOY_SCRIPT" ] && [ -x "$DEPLOY_SCRIPT" ]; then
    print_success "Deployment script exists and is executable"
else
    echo "❌ Deployment script not found or not executable"
    exit 1
fi

# Test 2: Check help command
print_status "Testing help command..."
if "$DEPLOY_SCRIPT" help > /dev/null 2>&1; then
    print_success "Help command works"
else
    echo "❌ Help command failed"
    exit 1
fi

# Test 3: Check script syntax
print_status "Testing script syntax..."
if bash -n "$DEPLOY_SCRIPT" 2>/dev/null; then
    print_success "Script syntax is valid"
else
    echo "❌ Script syntax is invalid"
    exit 1
fi

# Test 4: Check if required functions exist
print_status "Testing function definitions..."
if grep -q "check_prerequisites()" "$DEPLOY_SCRIPT"; then
    print_success "check_prerequisites function exists"
else
    echo "❌ check_prerequisites function not found"
    exit 1
fi

if grep -q "check_aws_credentials()" "$DEPLOY_SCRIPT"; then
    print_success "check_aws_credentials function exists"
else
    echo "❌ check_aws_credentials function not found"
    exit 1
fi

if grep -q "build_frontend()" "$DEPLOY_SCRIPT"; then
    print_success "build_frontend function exists"
else
    echo "❌ build_frontend function not found"
    exit 1
fi

if grep -q "deploy_frontend()" "$DEPLOY_SCRIPT"; then
    print_success "deploy_frontend function exists"
else
    echo "❌ deploy_frontend function not found"
    exit 1
fi

# Test 5: Check if frontend directory exists
print_status "Testing frontend directory..."
FRONTEND_DIR="$SCRIPT_DIR/camelot-frontend"
if [ -d "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
    print_success "Frontend directory and package.json found"
else
    echo "❌ Frontend directory or package.json not found"
    exit 1
fi

print_success "All tests passed! The deployment script is ready to use."
echo ""
echo "✅ Deployment script structure is valid"
echo "✅ Frontend code is present"
echo "✅ All required functions are defined"
echo ""
echo "To deploy the frontend, run:"
echo "  ./deploy-frontend.sh"
echo ""
echo "To build only:"
echo "  ./deploy-frontend.sh build-only"
echo ""
echo "To deploy only (existing image):"
echo "  ./deploy-frontend.sh deploy-only"