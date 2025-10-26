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

# Accept build arguments
ARG REACT_APP_AWS_REGION=us-east-1
ARG REACT_APP_COGNITO_USER_POOL_ID=us-east-1_v5vWtap1R
ARG REACT_APP_COGNITO_CLIENT_ID=1i3euls7ljtesoi0il87qu5rjj
ARG REACT_APP_COGNITO_DOMAIN=security-orchestration-dev-auth.auth.us-east-1.amazoncognito.com
ARG REACT_APP_REDIRECT_SIGN_IN=https://security.ironknight6.com/
ARG REACT_APP_REDIRECT_SIGN_OUT=https://security.ironknight6.com/
ARG REACT_APP_API_URL=https://x0q0fkiuj9.execute-api.us-east-1.amazonaws.com/dev

# Set environment variables for build
ENV REACT_APP_AWS_REGION=$REACT_APP_AWS_REGION
ENV REACT_APP_COGNITO_USER_POOL_ID=$REACT_APP_COGNITO_USER_POOL_ID
ENV REACT_APP_COGNITO_CLIENT_ID=$REACT_APP_COGNITO_CLIENT_ID
ENV REACT_APP_COGNITO_DOMAIN=$REACT_APP_COGNITO_DOMAIN
ENV REACT_APP_REDIRECT_SIGN_IN=$REACT_APP_REDIRECT_SIGN_IN
ENV REACT_APP_REDIRECT_SIGN_OUT=$REACT_APP_REDIRECT_SIGN_OUT
ENV REACT_APP_API_URL=$REACT_APP_API_URL

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
