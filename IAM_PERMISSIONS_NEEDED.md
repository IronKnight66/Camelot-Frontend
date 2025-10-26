# IAM Permissions Required for HTTPS Configuration

## Overview

To run the `configure-https.sh` script, your AWS IAM user or role needs specific permissions for Elastic Load Balancing (ELB) operations.

## Minimal Required Permissions

The script performs these operations:
1. **Describe Listeners** - Finds existing HTTP listeners
2. **Modify Listener** - Updates SSL policy and configures redirects

### Minimal IAM Policy

Attach this policy to your IAM user or role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:ModifyListener"
      ],
      "Resource": [
        "arn:aws:elasticloadbalancing:us-east-1:535002872918:listener/app/security-orchestration-dev-alb/*",
        "arn:aws:elasticloadbalancing:us-east-1:535002872918:loadbalancer/app/security-orchestration-dev-alb/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeLoadBalancers"
      ],
      "Resource": "*"
    }
  ]
}
```

## Full Policy Document

A complete policy document has been created at: `elb-permissions-policy.json`

## How to Apply

### Option 1: Attach to IAM User

```bash
# Create a custom policy
aws iam create-policy \
  --policy-name ELB-HTTPS-Config-Policy \
  --policy-document file://elb-permissions-policy.json \
  --region us-east-1

# Attach to your user (replace YOUR_USERNAME)
aws iam attach-user-policy \
  --user-name YOUR_USERNAME \
  --policy-arn arn:aws:iam::535002872918:policy/ELB-HTTPS-Config-Policy
```

### Option 2: Add to Existing IAM Role

If you're using Terraform or similar, add this to your existing IAM role that manages ELB resources:

```hcl
resource "aws_iam_role_policy" "elb_https_config" {
  name = "elb-https-config-policy"
  role = aws_iam_role.your_existing_role.id

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:ModifyListener"
      ],
      "Resource": [
        "arn:aws:elasticloadbalancing:us-east-1:535002872918:listener/app/security-orchestration-dev-alb/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:DescribeLoadBalancers"
      ],
      "Resource": "*"
    }
  ]
}
EOF
}
```

### Option 3: Use Existing Admin Permissions

If you already have AWS administrator access or `elasticloadbalancing:*` permissions, you're all set!

## Alternative: Use an IAM User with Temporary Credentials

If you don't want to modify the current user, create a temporary IAM user:

```bash
# 1. Create IAM user
aws iam create-user --user-name https-config-temp

# 2. Create and attach policy
aws iam put-user-policy \
  --user-name https-config-temp \
  --policy-name HTTPSConfigPolicy \
  --policy-document file://elb-permissions-policy.json

# 3. Create access keys
aws iam create-access-key --user-name https-config-temp

# 4. Configure credentials temporarily
export AWS_ACCESS_KEY_ID="<from-step-3>"
export AWS_SECRET_ACCESS_KEY="<from-step-3>"

# 5. Run the script
./configure-https.sh

# 6. Delete the temporary user and keys when done
```

## Verify Your Current Permissions

Check what permissions your current user has:

```bash
# Check your current user
aws sts get-caller-identity

# Check attached policies
aws iam list-attached-user-policies --user-name terraform-security-platform

# Check if you have ELB permissions
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::535002872918:user/terraform-security-platform \
  --action-names elasticloadbalancing:ModifyListener \
  --resource-arns "arn:aws:elasticloadbalancing:us-east-1:535002872918:listener/app/security-orchestration-dev-alb/c1f2473bb094c271/3993b19814e0e205"
```

## Current Error

Based on the error you received:
```
User: arn:aws:iam::535002872918:user/terraform-security-platform 
is not authorized to perform: elasticloadbalancing:ModifyListener
```

Your current IAM user (`terraform-security-platform`) needs the `elasticloadbalancing:ModifyListener` permission added.

## Quick Fix

If you have access to IAM console or an admin user:

1. Go to IAM Console → Users → `terraform-security-platform`
2. Click "Add permissions" → "Attach policies directly"
3. Either:
   - Create the minimal policy above, or
   - Attach the AWS managed policy `ElasticLoadBalancingFullAccess` (broader than needed but works)

## Testing After Adding Permissions

After adding permissions, verify you can run the commands:

```bash
# Test describe (should work)
aws elbv2 describe-listeners \
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:535002872918:loadbalancer/app/security-orchestration-dev-alb/c1f2473bb094c271 \
  --region us-east-1

# Then run the script
./configure-https.sh
```

## Security Best Practice

The minimal policy above restricts permissions to only the specific load balancer listeners needed for this configuration. This follows the principle of least privilege.

For production systems, you may want even more granular control, such as:
- Adding conditions to only allow modifications during specific hours
- Requiring MFA for these operations
- Using AWS CloudTrail to audit these changes

