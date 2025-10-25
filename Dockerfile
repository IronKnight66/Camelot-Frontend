# Multi-stage build for React frontend
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY . .

# Set environment variables for build
ENV REACT_APP_AWS_REGION=us-east-1
ENV REACT_APP_COGNITO_USER_POOL_ID=us-east-1_v5vWtap1R
ENV REACT_APP_COGNITO_CLIENT_ID=1i3euls7ljtesoi0il87qu5rjj
ENV REACT_APP_COGNITO_DOMAIN=security-orchestration-dev-auth.auth.us-east-1.amazoncognito.com
ENV REACT_APP_REDIRECT_SIGN_IN=https://security.ironknight6.com/
ENV REACT_APP_REDIRECT_SIGN_OUT=https://security.ironknight6.com/

# Build the application
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
