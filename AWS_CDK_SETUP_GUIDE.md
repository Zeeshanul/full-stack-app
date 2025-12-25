# AWS CDK Setup Guide for Full-Stack App

This guide walks you through setting up AWS Cloud Development Kit (CDK) to manage your infrastructure as code.

## Prerequisites

Before starting, ensure you have:
1. **Node.js** (v14.x or higher) and **npm** installed
2. **AWS Account** with appropriate permissions
3. **AWS CLI** installed and configured with credentials

### Verify Prerequisites

Run these commands to check if you have the required tools:

```bash
node --version
npm --version
aws --version
```

If AWS CLI is not installed, follow: https://aws.amazon.com/cli/

---

## Step 1: Install AWS CDK CLI (Global Installation)

**What it does:** Installs the AWS CDK command-line tool globally on your system.

```bash
npm install -g aws-cdk
```

**Verify installation:**
```bash
cdk --version
```

---

## Step 2: Initialize CDK Project

**What it does:** Creates a new CDK project with TypeScript (recommended for your stack).

Navigate to the infrastructure directory and initialize the project:

```bash
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure
cdk init app --language typescript
```

This will:
- Create the basic CDK project structure
- Generate `package.json` with dependencies
- Create TypeScript configuration files
- Create a sample stack in `lib/infrastructure-stack.ts`

---

## Step 3: Install Dependencies

**What it does:** Installs all required npm packages for the CDK project.

```bash
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure
npm install
```

---

## Step 4: Bootstrap AWS Environment (One-time per AWS account/region)

**What it does:** Prepares your AWS account to deploy CDK applications. Creates necessary S3 bucket and IAM roles.

```bash
cdk bootstrap aws://YOUR_AWS_ACCOUNT_ID/YOUR_AWS_REGION
```

**Example:**
```bash
cdk bootstrap aws://123456789012/us-east-1
```

**How to find your AWS Account ID and Region:**
```bash
aws sts get-caller-identity  # Shows Account ID
aws configure get region     # Shows configured region
```

---

## Step 5: Configure AWS Credentials

**What it does:** Sets up AWS credentials for CDK to deploy resources.

If you haven't configured AWS CLI, run:

```bash
aws configure
```

You'll be prompted for:
- **AWS Access Key ID:** Your IAM user's access key
- **AWS Secret Access Key:** Your IAM user's secret key
- **Default region:** e.g., `us-east-1`
- **Default output format:** `json`

---

## Step 6: Synthesize the CDK App

**What it does:** Converts your CDK code into a CloudFormation template (checks for errors).

```bash
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure
cdk synth
```

This generates a `cdk.out` directory with the CloudFormation template.

---

## Step 7: Preview Changes Before Deployment

**What it does:** Shows you what resources will be created/modified without deploying.

```bash
cdk diff
```

This shows a diff of what will change in your AWS account.

---

## Step 8: Deploy Your Stack

**What it does:** Deploys your CDK application to AWS.

```bash
cdk deploy
```

When prompted, type `y` and press Enter to confirm deployment.

**Track deployment:**
- Watch the terminal for deployment progress
- Or go to AWS CloudFormation console: https://console.aws.amazon.com/cloudformation

---

## Project Structure

After initialization, your CDK project will have:

```
infrastructure/
├── lib/
│   └── infrastructure-stack.ts    # Your CDK stack definition
├── bin/
│   └── infrastructure.ts          # CDK app entry point
├── cdk.json                       # CDK configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── README.md                      # Project documentation
└── .gitignore                     # Git configuration
```

---

## Useful CDK Commands

| Command | What it does |
|---------|-------------|
| `cdk synth` | Converts CDK to CloudFormation template |
| `cdk diff` | Shows changes before deployment |
| `cdk deploy` | Deploys the stack to AWS |
| `cdk destroy` | Tears down the stack (removes resources) |
| `cdk list` | Lists all stacks in the app |
| `cdk doctor` | Checks your environment setup |

---

## Example: Adding Your Backend Service

Once your CDK stack is initialized, you'll modify `lib/infrastructure-stack.ts` to define:

1. **VPC** - Virtual network for your resources
2. **RDS Database** - For your MySQL/database
3. **ECS/EC2** - To run your NestJS backend
4. **S3** - For static files or backups
5. **CloudFront** - CDN for your Angular frontend
6. **Security Groups** - Firewall rules

Example structure (you'll implement this after initialization):

```typescript
// lib/infrastructure-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'AppVpc');

    // Create RDS Database
    // Create Container Cluster
    // etc.
  }
}
```

---

## Troubleshooting

### Issue: "cdk: command not found"
**Solution:** Install CDK globally again:
```bash
npm install -g aws-cdk
```

### Issue: "Unable to assume IAM role"
**Solution:** Check AWS credentials:
```bash
aws sts get-caller-identity
```

### Issue: "Cannot find module errors"
**Solution:** Reinstall dependencies:
```bash
npm install
```

### Issue: "Region not configured"
**Solution:** Configure AWS region:
```bash
aws configure set region us-east-1
```

---

## Next Steps (After Initial Setup)

1. Define your infrastructure resources in `lib/infrastructure-stack.ts`
2. Add AWS CDK constructs for:
   - VPC and networking
   - RDS database
   - ECS/EKS for containers
   - S3 for static assets
   - CloudFront for CDN
3. Use environment variables for configuration
4. Set up CI/CD pipeline to deploy automatically
5. Document your infrastructure in code

---

## Useful Resources

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CDK Examples](https://github.com/aws-samples/aws-cdk-examples)
- [CDK API Reference](https://docs.aws.amazon.com/cdk/api/latest/)
- [AWS Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best_practices.html)
