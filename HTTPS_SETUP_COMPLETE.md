# HTTPS Setup for security.ironknight6.com

## Summary

HTTPS has been successfully configured for your frontend application.

## What Was Fixed

### 1. Added HTTPS Listener ✓
- **Problem**: The ALB only had HTTP listeners (ports 80, 3000, 8080, 8081)
- **Solution**: Created HTTPS listener on port 443 with AWS Certificate Manager (ACM) certificate
- **Certificate**: Valid until November 2026 for `security.ironknight6.com` and `*.ironknight6.com`

### 2. Enhanced nginx Configuration ✓
Updated `nginx.conf` to include:
- Real IP detection from AWS ALB (X-Forwarded-For headers)
- Strict-Transport-Security (HSTS) header to force HTTPS
- All existing security headers preserved

### 3. Created Configuration Script ✓
Created `configure-https.sh` that will:
- Update SSL policy to modern TLS 1.3/1.2
- Configure automatic HTTP to HTTPS redirect (301)
- Apply to both port 80 and port 3000 listeners

## Next Steps

### Run the Configuration Script

You need to run the script with AWS credentials that have ELB permissions:

```bash
./configure-https.sh
```

This will:
1. Update the SSL policy to `ELBSecurityPolicy-TLS13-1-2-2021-06`
2. Configure HTTP (port 3000) to redirect to HTTPS (port 443)
3. Configure HTTP (port 80) to redirect to HTTPS (port 443)

### Deploy the Updated nginx Configuration

The nginx configuration has been updated with better security headers. To deploy:

```bash
# Rebuild and deploy the frontend with updated nginx.conf
./deploy-frontend.sh
```

## Architecture

```
User Request (HTTPS on port 443)
    ↓
AWS Application Load Balancer
    ↓ (terminates SSL, uses ACM certificate)
    ↓
ECS Container (nginx on port 80)
    ↓
React Application
```

**Important**: The nginx container listens on port 80 only. SSL termination happens at the ALB level, which is the AWS best practice.

## Verify HTTPS is Working

After running the configuration script and deploying:

1. **Test HTTPS**: Visit `https://security.ironknight6.com/login`
2. **Test Redirect**: Visit `http://security.ironknight6.com/login` - should redirect to HTTPS
3. **Check Certificate**: Browser should show valid certificate from ACM

## Current Configuration

- **Load Balancer**: `security-orchestration-dev-alb`
- **HTTPS Listener**: Port 443 with ACM certificate
- **HTTP Listeners**: Ports 80, 3000, 8080, 8081
- **Target Group**: `sec-orch-dev-frontend` (points to ECS frontend service)
- **Certificate**: Issued by ACM, valid until 2026-11-24

## Permissions Required

The user running `configure-https.sh` needs these AWS IAM permissions:
- `elasticloadbalancing:ModifyListener`
- `elasticloadbalancing:DescribeListeners`
- `acm:ListCertificates`

## Troubleshooting

### If HTTPS still doesn't work:

1. Check DNS is pointing to the ALB:
   ```bash
   dig security.ironknight6.com
   # Should resolve to: security-orchestration-dev-alb-765222026.us-east-1.elb.amazonaws.com
   ```

2. Check the listener is active:
   ```bash
   aws elbv2 describe-listeners \
     --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:535002872918:loadbalancer/app/security-orchestration-dev-alb/c1f2473bb094c271 \
     --region us-east-1
   ```

3. Verify certificate is attached:
   ```bash
   aws elbv2 describe-listeners \
     --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:535002872918:loadbalancer/app/security-orchestration-dev-alb/c1f2473bb094c271 \
     --region us-east-1 \
     --query 'Listeners[?Port==`443`]'
   ```

### Security Notes

- **HSTS**: Strict-Transport-Security header forces browsers to use HTTPS for 1 year
- **TLS 1.3**: Modern SSL policy supports TLS 1.3 and TLS 1.2 (minimum)
- **Certificate**: Managed by AWS Certificate Manager, auto-renewing
- **No Mixed Content**: All resources should be served over HTTPS

## Testing SSL Configuration

After running the script, test the SSL configuration:

```bash
# Using curl
curl -I https://security.ironknight6.com/login

# Using openssl to check certificate
echo | openssl s_client -servername security.ironknight6.com -connect security.ironknight6.com:443 2>/dev/null | openssl x509 -noout -dates

# Using SSL Labs test
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=security.ironknight6.com
```

## Maintenance

- The certificate will auto-renew via AWS Certificate Manager
- Expiration date: November 24, 2026
- No manual intervention needed for certificate renewal

