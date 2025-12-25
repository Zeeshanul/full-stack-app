# RDS MySQL Database Setup Guide

This guide explains how to deploy the RDS MySQL database using AWS CDK and retrieve connection details for your backend application.

## Prerequisites

1. AWS Account configured with credentials
2. AWS CDK CLI installed: `npm install -g aws-cdk`
3. Node.js and npm installed

## Configuration Details

The RDS MySQL database is configured with:

- **Engine**: MySQL 8.0
- **Instance Type**: t3.micro (AWS free tier eligible)
- **Allocated Storage**: 20 GB
- **Database Name**: `fullstackdb`
- **Username**: `admin`
- **Port**: 3306
- **Backup**: 7-day retention
- **Multi-AZ**: Disabled (for development)
- **Auto Minor Version Upgrade**: Enabled

## Deployment Steps

### 1. Install Dependencies

```bash
cd infrastructure
npm install
npm run build
```

### 2. Bootstrap AWS Environment (First time only)

```bash
cdk bootstrap aws://ACCOUNT_ID/REGION
```

Example:
```bash
cdk bootstrap aws://123456789012/us-east-1
```

### 3. Review the Stack

```bash
cdk diff
```

This shows you what resources will be created.

### 4. Deploy the Stack

```bash
cdk deploy
```

When prompted, enter `y` to confirm the deployment.

**Deployment typically takes 10-15 minutes.**

### 5. Retrieve Connection Details

After deployment completes, the outputs will display all connection information:

```
Outputs:
FullStackDatabaseEndpoint = your-db.xxxxx.us-east-1.rds.amazonaws.com
FullStackDatabasePort = 3306
FullStackDatabaseName = fullstackdb
FullStackDatabaseUsername = admin
FullStackDatabasePassword = (check AWS Secrets Manager)
FullStackDatabaseSecretsArn = arn:aws:secretsmanager:...
```

## Retrieve Database Password

The password is automatically generated and stored in AWS Secrets Manager. Retrieve it using:

```bash
aws secretsmanager get-secret-value \
  --secret-id $(aws secretsmanager list-secrets --query 'SecretList[?name_like(`rds-`]' | jq -r '.SecretList[0].ARN') \
  --query 'SecretString' | jq .
```

Or use the AWS Console:
1. Go to AWS Secrets Manager
2. Search for the secret starting with `rds-`
3. Click on it and view the secret value

## Configure Backend Application

### Update Backend Environment Variables

Create or update your `.env` file in the `back-end` directory:

```env
DB_HOST=your-db.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=<your-generated-password>
DB_NAME=fullstackdb
```

### Update TypeORM Configuration

The existing `back-end/src/config/typeorm.config.ts` will automatically use these environment variables.

## Database Access

### From Your Local Machine

The RDS instance is configured to allow inbound traffic from anywhere on port 3306. You can connect using:

```bash
mysql -h your-db.xxxxx.us-east-1.rds.amazonaws.com \
      -u admin \
      -p \
      fullstackdb
```

### Run Migrations

```bash
cd back-end
npm install
npx typeorm migration:run
```

## Cost Estimates

- **t3.micro**: ~$0.01/hour (~$7-10/month)
- **Storage (20GB)**: ~$2-3/month
- **Backup Storage**: Additional cost for retention

**Total: ~$12-15/month** (eligible for AWS free tier for first 12 months)

## Cleanup

To delete the RDS instance and free up resources:

```bash
cdk destroy
```

When prompted, confirm with `y`.

## Troubleshooting

### Connection Timeout

- Verify security group rules allow port 3306
- Ensure database endpoint is correct
- Check if RDS instance is in "available" state in AWS Console

### Authentication Failed

- Verify username and password are correct
- Password may contain special characters - ensure it's properly escaped in connection strings

### Deployment Failed

- Ensure AWS credentials are configured: `aws configure`
- Check if you're in the correct AWS region
- Verify IAM permissions for CDK deployment

## Next Steps

1. Deploy this RDS stack: `cdk deploy`
2. Retrieve connection details from CloudFormation outputs
3. Update backend `.env` file with database credentials
4. Run migrations: `npx typeorm migration:run`
5. Deploy your backend application pointing to the RDS instance
