# Infrastructure Architecture

## Overview

The infrastructure is organized into multiple stacks for better modularity, reusability, and maintainability. Each stack has a specific purpose and can be deployed independently while sharing common resources like the VPC.

## Stack Architecture

### 1. **NetworkStack** (Foundation Layer)
- **Purpose**: Creates and manages the VPC and networking resources
- **Resources**:
  - VPC with 2 Availability Zones
  - Public subnets (for ALB, NAT Gateway)
  - Private subnets (for ECS, RDS, ElastiCache)
  - NAT Gateway (1 for cost optimization)
  - Internet Gateway
- **Exports**: VPC ID and CIDR block
- **Dependencies**: None

### 2. **DatabaseStack** (Data Layer)
- **Purpose**: Manages RDS MySQL database
- **Resources**:
  - RDS MySQL 8.0 instance (t3.micro)
  - Security group for database access
  - Secrets Manager for credentials
  - CloudWatch logs
- **Imports**: VPC from NetworkStack
- **Exports**: Database endpoint, port, credentials ARN
- **Dependencies**: NetworkStack

### 3. **InfrastructureStack** (Application Layer)
- **Purpose**: Placeholder for application-level resources
- **Resources**: Currently empty (ready for Lambda, API Gateway, etc.)
- **Imports**: Can import VPC and other resources
- **Dependencies**: NetworkStack

### 4. **EcsStack** (Compute Layer) - Template
- **Purpose**: Container orchestration for backend services
- **Resources**:
  - ECS Cluster
  - Fargate Services
  - Application Load Balancer
  - Task Definitions
  - Auto Scaling policies
- **Imports**: VPC from NetworkStack
- **Dependencies**: NetworkStack, DatabaseStack

### 5. **CacheStack** (Caching Layer) - Template
- **Purpose**: Redis cache for application performance
- **Resources**:
  - ElastiCache Redis cluster
  - Security group for Redis
  - Subnet group
- **Imports**: VPC from NetworkStack
- **Dependencies**: NetworkStack

## Stack Dependencies

```
NetworkStack (VPC)
    ├── DatabaseStack (RDS)
    ├── InfrastructureStack (App Resources)
    ├── EcsStack (Containers)
    └── CacheStack (Redis)
```

## Deployment Order

When deploying all stacks:

```bash
# NetworkStack must be deployed first
cdk deploy FullStackNetworkStack

# Then deploy dependent stacks (can be done in parallel or sequentially)
cdk deploy FullStackDatabaseStack
cdk deploy FullStackAppStack

# Future stacks
cdk deploy FullStackEcsStack
cdk deploy FullStackCacheStack

# Or deploy all at once (CDK handles dependencies automatically)
cdk deploy --all
```

## Benefits of This Architecture

1. **Single VPC**: All resources share the same VPC, reducing costs and complexity
2. **Modularity**: Each stack can be updated independently without affecting others
3. **Reusability**: VPC is created once and reused across all stacks
4. **Clear Separation**: Different concerns (networking, data, compute) are separated
5. **Cost Efficiency**: No duplicate VPCs or NAT Gateways
6. **Easy Scaling**: Add new stacks (DynamoDB, S3, etc.) following the same pattern

## Adding New Stacks

To add a new stack (e.g., DynamoDB):

1. Create `lib/dynamodb-stack.ts`:
```typescript
import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DynamoDbStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DynamoDbStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);
    
    // Your DynamoDB resources here
  }
}
```

2. Update `bin/infrastructure.ts`:
```typescript
import { DynamoDbStack } from '../lib/dynamodb-stack';

const dynamoDbStack = new DynamoDbStack(app, 'FullStackDynamoDbStack', {
  env,
  vpc: networkStack.vpc,
});
dynamoDbStack.addDependency(networkStack);
```

3. Deploy:
```bash
cdk deploy FullStackDynamoDbStack
```

## Cost Breakdown

### Current Stacks (Deployed)
- **NetworkStack**: ~$30-40/month (NAT Gateway)
- **DatabaseStack**: ~$12-15/month (t3.micro RDS)
- **Total**: ~$42-55/month

### Future Stacks (When Added)
- **EcsStack**: ~$15-30/month (Fargate)
- **CacheStack**: ~$12-15/month (Redis t3.micro)
- **Additional Total**: ~$69-100/month

## Environment Variables

After deployment, update your backend `.env`:

```env
# From DatabaseStack
DB_HOST=<DatabaseEndpoint>
DB_PORT=3306
DB_USERNAME=admin
DB_PASSWORD=<from Secrets Manager>
DB_NAME=fullstackdb

# From CacheStack (when deployed)
REDIS_HOST=<RedisEndpoint>
REDIS_PORT=6379

# From EcsStack (when deployed)
API_URL=<LoadBalancerDNS>
```

## Security Considerations

1. **VPC Isolation**: Private subnets for databases and backend services
2. **Security Groups**: Fine-grained access control between resources
3. **Secrets Management**: Database credentials in AWS Secrets Manager
4. **Network ACLs**: Default deny with explicit allow rules
5. **IAM Roles**: Principle of least privilege for all services

## Cleanup

To remove all infrastructure:

```bash
# Delete in reverse dependency order
cdk destroy FullStackCacheStack
cdk destroy FullStackEcsStack
cdk destroy FullStackAppStack
cdk destroy FullStackDatabaseStack
cdk destroy FullStackNetworkStack

# Or destroy all at once
cdk destroy --all
```
