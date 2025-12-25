# AWS CDK Quick Commands Reference

## Initial Setup (Run in Order)

### 1. Install AWS CDK CLI (Global)
```bash
npm install -g aws-cdk
cdk --version
```

### 2. Navigate to Infrastructure Directory
```bash
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure
```

### 3. Initialize CDK Project with TypeScript
```bash
cdk init app --language typescript
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Configure AWS Credentials (if not already done)
```bash
aws configure
```
**Input required:**
- AWS Access Key ID: `[your-access-key]`
- AWS Secret Access Key: `[your-secret-key]`
- Default region: `us-east-1` (or your preferred region)
- Default output format: `json`

### 6. Get Your AWS Account ID and Region
```bash
aws sts get-caller-identity
aws configure get region
```

### 7. Bootstrap Your AWS Environment
```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION
```
**Example:**
```bash
cdk bootstrap aws://123456789012/us-east-1
```

---

## Development Workflow (After Setup)

### Check Your Environment
```bash
cdk doctor
```

### Synthesize CDK to CloudFormation
```bash
cdk synth
```

### Preview Changes (Diff)
```bash
cdk diff
```

### Deploy to AWS
```bash
cdk deploy
```

### Deploy Specific Stack
```bash
cdk deploy InfrastructureStack
```

### Deploy with Approval Disabled (Faster)
```bash
cdk deploy --require-approval never
```

### Destroy Infrastructure
```bash
cdk destroy
```

---

## Troubleshooting Commands

### Check AWS Credentials
```bash
aws sts get-caller-identity
```

### List All CDK Stacks
```bash
cdk list
```

### Check CDK Version
```bash
cdk --version
```

### Reinstall Dependencies
```bash
npm install
```

### Watch Mode (Auto-redeploy on changes)
```bash
cdk deploy --watch
```

---

## Useful AWS CLI Commands (Complement to CDK)

### List CloudFormation Stacks
```bash
aws cloudformation list-stacks
```

### Describe a Specific Stack
```bash
aws cloudformation describe-stacks --stack-name InfrastructureStack
```

### View Stack Events
```bash
aws cloudformation describe-stack-events --stack-name InfrastructureStack
```

### Get Stack Outputs
```bash
aws cloudformation describe-stacks --stack-name InfrastructureStack --query 'Stacks[0].Outputs'
```

---

## Environment Variables

Create a `.env` file in the infrastructure directory to manage configuration:

```bash
AWS_REGION=us-east-1
ENVIRONMENT=development
BACKEND_PORT=3000
DB_NAME=fullstack_db
```

Then load these in your CDK stack using the `dotenv` package:

```typescript
import dotenv from 'dotenv';
dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
```

---

## Git Configuration

Add to `.gitignore` in the infrastructure directory:

```
*.js
*.d.ts
node_modules/
dist/
cdk.out/
.env
.env.local
*.swp
*.swo
*~
.DS_Store
```

---

## Deployment Checklist

Before running `cdk deploy`:

- [ ] AWS credentials configured: `aws sts get-caller-identity`
- [ ] CDK bootstrapped: `cdk bootstrap aws://ACCOUNT_ID/REGION`
- [ ] Code compiles: `npm run build`
- [ ] Changes reviewed: `cdk diff`
- [ ] Naming conventions followed for resources
- [ ] Environment variables set correctly
- [ ] Tagging strategy defined for cost tracking
