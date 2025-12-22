# Multi-stage build for React frontend
FROM public.ecr.aws/docker/library/node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Accept build arguments
# These should be passed from Terraform outputs during Docker build
# Defaults are for local development only
ARG REACT_APP_AWS_REGION=us-east-1
ARG REACT_APP_COGNITO_USER_POOL_ID=""
ARG REACT_APP_COGNITO_CLIENT_ID=""
ARG REACT_APP_COGNITO_DOMAIN=""
ARG REACT_APP_REDIRECT_SIGN_IN="http://localhost:3000/"
ARG REACT_APP_REDIRECT_SIGN_OUT="http://localhost:3000/"
ARG REACT_APP_API_URL=""

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
FROM public.ecr.aws/nginx/nginx:alpine

# Copy built app to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
