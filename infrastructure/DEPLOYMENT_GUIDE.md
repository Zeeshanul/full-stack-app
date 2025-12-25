# AWS CDK Deployment Guide

Complete step-by-step instructions to deploy your full-stack infrastructure.

---

## Pre-Deployment Checklist

Before deploying, verify everything is ready:

### 1. Check CDK Environment
```bash
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure
cdk doctor
```

**Expected output:** ✓ for Node.js, npm, AWS CLI, Docker (if using local images)

**What it does:** Validates your development environment is properly configured.

---

### 2. Verify AWS Credentials
```bash
aws sts get-caller-identity
```

**Expected output:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

**What it does:** Confirms AWS CLI authentication is working and shows your AWS account ID.

---

### 3. Confirm CDK Bootstrap (if not done)
Check if your AWS account has been bootstrapped:

```bash
aws cloudformation describe-stacks --region $(aws configure get region) --query 'Stacks[?StackName==`CDKToolkit`]' --output table
```

**If no output:** Bootstrap your account with:
```bash
cdk bootstrap aws://YOUR_ACCOUNT_ID/YOUR_REGION
```

**Example:**
```bash
cdk bootstrap aws://123456789012/us-east-1
```

**What it does:** Creates necessary S3 bucket and IAM roles for CDK deployments.

---

## Deployment Steps

### Step 1: Build TypeScript Code
```bash
npm run build
```

**What it does:** Compiles your TypeScript code to JavaScript.

**Expected output:** Should complete without errors. If you see errors, fix them before proceeding.

---

### Step 2: List All Stacks
```bash
cdk list
```

**Expected output:**
```
FullStackNetworkStack
FullStackDatabaseStack
FullStackAppStack
```

**What it does:** Shows all CDK stacks that will be deployed.

---

### Step 3: Synthesize to CloudFormation
```bash
cdk synth
```

**What it does:** Converts your CDK code to CloudFormation template and validates syntax.

**Expected output:**
- Creates `cdk.out/` directory
- Generates CloudFormation JSON templates
- No errors

---

### Step 4: Preview Changes (Dry Run)
```bash
cdk diff
```

**What it does:** Shows exactly what resources will be created/modified without deploying anything.

**Example output:**
```
Stack FullStackNetworkStack
[+] AWS::EC2::VPC VPC
    vpc-xxxxxxx
[+] AWS::EC2::Subnet PublicSubnet1
    subnet-xxxxxxx
[+] AWS::EC2::Subnet PublicSubnet2
    subnet-xxxxxxx
... (and more resources)
```

**⚠️ IMPORTANT:** Review this output carefully. Make sure:
- No unexpected resources are being created
- Resource names are correct
- Security settings look appropriate

---

### Step 5: Deploy Infrastructure

#### Option A: Interactive Deployment (Recommended for first-time)

```bash
cdk deploy
```

**What it does:** Deploys all stacks in the app to AWS.

**What happens:**
1. Shows security confirmation (IAM changes, etc.)
2. Prompts: "Do you wish to deploy these changes (y/n)?"
3. Type `y` and press Enter

**Expected behavior:**
- Shows: `FullStackNetworkStack` deployment in progress
- Then: `FullStackDatabaseStack` deployment (waits for NetworkStack to finish)
- Then: `FullStackAppStack` deployment
- Finally: Shows stack outputs and status

---

#### Option B: Deploy Specific Stack Only
If you want to deploy just one stack for testing:

```bash
cdk deploy FullStackNetworkStack
```

**What it does:** Deploys only the Network Stack first. Good for testing.

**Then deploy others:**
```bash
cdk deploy FullStackDatabaseStack
cdk deploy FullStackAppStack
```

---

#### Option C: Deploy Without Approval (Advanced)
For automated/CI/CD deployments:

```bash
cdk deploy --require-approval never
```

**⚠️ WARNING:** Only use after thoroughly testing. Deploys without asking for confirmation.

---

## Monitoring Deployment

### In Terminal
Watch the deployment progress in your terminal. You'll see:

```
FullStackNetworkStack: deploying... [1/3]
FullStackNetworkStack: CREATE_IN_PROGRESS
FullStackNetworkStack: CREATE_IN_PROGRESS [AWS::EC2::VPC]
FullStackNetworkStack: CREATE_COMPLETE
✓ FullStackNetworkStack

FullStackDatabaseStack: deploying... [2/3]
FullStackDatabaseStack: CREATE_IN_PROGRESS
FullStackDatabaseStack: CREATE_IN_PROGRESS [AWS::RDS::DBInstance]
... (takes 5-15 minutes for RDS)
FullStackDatabaseStack: CREATE_COMPLETE
✓ FullStackDatabaseStack

FullStackAppStack: deploying... [3/3]
FullStackAppStack: CREATE_COMPLETE
✓ FullStackAppStack

✅ Deployment successful!
```

---

### In AWS Console
Monitor deployment in real-time:

**CloudFormation:**
```
https://console.aws.amazon.com/cloudformation
```

**What to look for:**
- Stack status: `CREATE_IN_PROGRESS` → `CREATE_COMPLETE`
- Click on stack to see events
- Estimated time: 10-20 minutes (RDS takes longest)

**EC2 (to see VPC resources):**
```
https://console.aws.amazon.com/ec2
```

**RDS (to see database):**
```
https://console.aws.amazon.com/rds
```

---

## After Deployment

### Step 6: Verify Deployment Success
```bash
aws cloudformation describe-stacks --region $(aws configure get region) --query 'Stacks[?StackStatus==`CREATE_COMPLETE`]' --output table
```

**Expected output:** Should show your 3 stacks with `CREATE_COMPLETE` status.

---

### Step 7: Get Stack Outputs
```bash
aws cloudformation describe-stacks --region $(aws configure get region) --stack-name FullStackNetworkStack --query 'Stacks[0].Outputs' --output table
```

**Example output:**
```
OutputKey             OutputValue
─────────────────────────────────
VpcId                 vpc-0a1b2c3d4e5f6g7h8
PublicSubnet1Id       subnet-0a1b2c3d4e5f6g7h8
PublicSubnet2Id       subnet-0x1y2z3a4b5c6d7e8f
PrivateSubnet1Id      subnet-0p1q2r3s4t5u6v7w8
PrivateSubnet2Id      subnet-0j1k2l3m4n5o6p7q8
```

Save these outputs - you'll need them for future configurations!

---

### Step 8: Check Database Connection
```bash
aws rds describe-db-instances --query 'DBInstances[*].[DBInstanceIdentifier,Endpoint.Address,DBInstanceStatus]' --output table
```

**Expected output:**
```
DBInstanceIdentifier          Endpoint.Address              DBInstanceStatus
──────────────────────────────────────────────────────────────────────────
fullstack-mysql-db            fullstackdb.XXXXXXXXXXXX.rds.amazonaws.com    available
```

**Important:** Take note of the endpoint URL (like `fullstackdb.XXX.rds.amazonaws.com`). You'll use this for backend connection.

---

## Troubleshooting Deployment Issues

### Issue: "User is not authorized to perform: iam:CreateRole"
**Cause:** IAM permissions insufficient
**Solution:** 
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure your IAM user has `AdministratorAccess` policy
- Or contact your AWS account administrator

---

### Issue: "Stack creation failed" or "Rollback in progress"
**Solution:**
1. Check CloudFormation console for specific error
2. Fix the issue in your CDK code
3. Run `cdk deploy` again (CDK will retry)

---

### Issue: Deployment hangs or takes too long
**What's normal:**
- RDS creation: 5-15 minutes (expected)
- Total deployment: 15-30 minutes first time

**If stuck beyond that:**
1. Check CloudFormation console
2. Check EC2/RDS console for stuck resources
3. If needed, destroy and retry: `cdk destroy`

---

### Issue: "Bucket already exists" or resource already exists
**Cause:** Resource naming conflict
**Solution:**
1. Modify stack names in `bin/infrastructure.ts`
2. Add timestamp or unique prefix
3. Or destroy existing stack: `cdk destroy`

---

### Issue: Port already in use error
**Cause:** Resource conflict
**Solution:** Check what's running on that port and stop it, or modify the port in your CDK code

---

## Redeployment (After Fixes)

If you make changes to your infrastructure code:

```bash
npm run build
cdk diff
```

**Review changes carefully**, then:

```bash
cdk deploy
```

**What happens:** CloudFormation will:
- Create new resources
- Update existing resources
- Delete removed resources (if configured)

---

## Scaling Deployment Options

### Deploy in Watch Mode (Auto-redeploy on code changes)
```bash
cdk deploy --watch
```

**What it does:** Monitors your code files and auto-deploys when you save changes.

**Exit:** Press `Ctrl+C`

---

### Deploy Multiple Times for Different Environments
Create environment-specific stacks:

```bash
// In bin/infrastructure.ts
const devNetworkStack = new NetworkStack(app, 'FullStackNetworkStack-Dev', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
});

const prodNetworkStack = new NetworkStack(app, 'FullStackNetworkStack-Prod', {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
});
```

Then deploy specific environment:
```bash
cdk deploy FullStackNetworkStack-Dev
```

---

## Next Steps After Successful Deployment

1. ✅ Infrastructure deployed
2. ⬜ Document stack outputs
3. ⬜ Configure backend application with database endpoint
4. ⬜ Build and push Docker images to ECR
5. ⬜ Deploy backend containers to ECS (next phase)
6. ⬜ Deploy frontend to S3 + CloudFront (next phase)
7. ⬜ Set up monitoring and alarms
8. ⬜ Configure CI/CD pipeline for automated deployments

---

## Rollback / Destroy Infrastructure

### Destroy All Stacks (Use with caution!)
```bash
cdk destroy
```

**What it does:** Removes all AWS resources created by CDK.

**Warning:** This will:
- Delete your VPC
- Delete your RDS database (with data!)
- Terminate all resources

**You will be prompted to confirm before deletion.**

---

### Destroy Specific Stack
```bash
cdk destroy FullStackAppStack
```

---

## Useful AWS CLI Commands During Deployment

### Watch CloudFormation Events in Real-Time
```bash
aws cloudformation describe-stack-events --stack-name FullStackNetworkStack --query 'StackEvents[0:10]' --output table
```

---

### Check Resource Status
```bash
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock,State]' --output table
```

---

### Get All Stack Outputs
```bash
for stack in FullStackNetworkStack FullStackDatabaseStack FullStackAppStack; do
  echo "=== $stack ==="
  aws cloudformation describe-stacks --stack-name $stack --query 'Stacks[0].Outputs' --output table
done
```

---

## Quick Reference: Complete Deployment Command Sequence

Copy and run these in order:

```bash
# 1. Navigate to infrastructure directory
cd /Users/zeeshanulhaq/Desktop/full-stack-app/infrastructure

# 2. Verify environment
cdk doctor

# 3. Verify AWS credentials
aws sts get-caller-identity

# 4. Build code
npm run build

# 5. List stacks
cdk list

# 6. Preview changes
cdk diff

# 7. Deploy
cdk deploy

# 8. Verify success
aws cloudformation describe-stacks --query 'Stacks[?StackStatus==`CREATE_COMPLETE`]' --output table
```

---

## Success Indicators

After successful deployment, you should see:

✅ All 3 stacks showing `CREATE_COMPLETE` status
✅ VPC created with public and private subnets
✅ RDS MySQL database in `available` status
✅ Security groups and IAM roles created
✅ No errors in CloudFormation events
✅ No rollback messages

Congratulations! Your infrastructure is now running on AWS! 🎉
