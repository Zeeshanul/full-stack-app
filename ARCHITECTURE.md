# Infrastructure Architecture Plan

This document outlines the recommended AWS infrastructure for your full-stack application.

## Current Application Stack

- **Frontend:** Angular (JavaScript/TypeScript)
- **Backend:** NestJS (Node.js/TypeScript)
- **Database:** MySQL
- **Current Deployment:** Docker (local containers)

---

## Recommended AWS Architecture

### Overview Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼─────┐
                    │ Route 53  │ (DNS)
                    └────┬─────┘
                         │
                    ┌────▼─────────┐
                    │  CloudFront  │ (CDN)
                    └────┬─────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼──┐        ┌────▼──┐       ┌────▼────┐
   │  S3   │        │  ALB  │       │ API GW  │
   │Static │        │       │       │         │
   └───────┘        └────┬──┘       └────┬────┘
                         │               │
                    ┌────▼──────────────┘
                    │
            ┌───────▼────────┐
            │   VPC          │
            │  10.0.0.0/16   │
            ├────────────────┤
            │ Public Subnets │
            │ - ECS Cluster  │
            │ - NAT Gateway  │
            │                │
            │ Private Subnet │
            │ - RDS MySQL    │
            │ - Cache/Redis  │
            └────────────────┘
```

---

## Infrastructure Components

### 1. **VPC (Virtual Private Cloud)**
- **CIDR Block:** 10.0.0.0/16
- **Public Subnets:** 2 (for NAT Gateway, ALB)
- **Private Subnets:** 2 (for RDS, backend services)
- **Availability Zones:** 2 (High availability)

### 2. **Frontend Hosting**
- **S3 Bucket:** Store Angular compiled assets (SPA)
- **CloudFront:** CDN for fast global delivery
- **Route 53:** DNS routing

### 3. **Backend Compute**
- **ECS (Elastic Container Service):** Run NestJS in containers
  - **Fargate:** Serverless container execution (recommended)
  - OR **EC2:** Traditional instances (more control)
- **Application Load Balancer (ALB):** Distribute traffic to containers
- **Auto Scaling:** Scale containers based on CPU/memory

### 4. **Database**
- **RDS MySQL:** Managed relational database
  - Multi-AZ deployment for high availability
  - Automated backups
  - Read replicas option

### 5. **Additional Services**
- **ElastiCache:** Redis/Memcached for session/caching
- **CloudWatch:** Logging and monitoring
- **Secrets Manager:** Store database credentials securely
- **IAM Roles/Policies:** Fine-grained access control

---

## Deployment Approach with CDK

You'll define these components in TypeScript CDK constructs:

### File Structure After `cdk init`

```
infrastructure/
├── bin/
│   └── infrastructure.ts              # CDK App entry point
├── lib/
│   ├── infrastructure-stack.ts        # Main stack definition
│   ├── stacks/
│   │   ├── vpc-stack.ts              # VPC configuration
│   │   ├── rds-stack.ts              # Database setup
│   │   ├── ecs-stack.ts              # Backend container setup
│   │   └── frontend-stack.ts         # S3 + CloudFront setup
│   └── constructs/
│       ├── backend-service.ts        # Reusable backend construct
│       └── rds-database.ts           # Reusable database construct
├── package.json                       # Dependencies
├── tsconfig.json                      # TypeScript config
└── cdk.json                          # CDK configuration
```

---

## Step-by-Step Implementation Plan

### Phase 1: Foundation (Start Here)
1. Initialize CDK project with TypeScript
2. Create VPC with public/private subnets
3. Create Security Groups
4. Set up IAM roles

### Phase 2: Database
1. Create RDS MySQL instance
2. Configure backup and monitoring
3. Set up read replicas (optional)
4. Create database schema migration strategy

### Phase 3: Backend
1. Create ECS Cluster (Fargate)
2. Create Application Load Balancer
3. Deploy NestJS Docker image to ECR (Elastic Container Registry)
4. Set up auto-scaling policies
5. Configure health checks

### Phase 4: Frontend
1. Create S3 bucket for static assets
2. Configure CloudFront distribution
3. Set up Route 53 DNS
4. Configure CORS and security headers

### Phase 5: Monitoring & Logging
1. Set up CloudWatch Log Groups
2. Create CloudWatch Alarms
3. Set up SNS notifications
4. Create CloudWatch Dashboard

### Phase 6: CI/CD Integration
1. Integrate with GitHub Actions
2. Auto-deploy on push to main branch
3. Build and push Docker images to ECR
4. Deploy via CDK

---

## Environment Configuration

### Development Environment
- Smaller instance sizes
- Single AZ (cost optimization)
- Manual approval for changes
- Logging level: DEBUG

### Production Environment
- Larger instance sizes
- Multi-AZ (high availability)
- Auto-approval disabled (manual review)
- Logging level: INFO
- Backups: Daily, 30-day retention

---

## Cost Estimation (Approximate Monthly)

| Service | Dev | Prod | Notes |
|---------|-----|------|-------|
| VPC + NAT | $32 | $32 | NAT Gateway costs |
| RDS MySQL | $30-50 | $100-200 | Single-AZ / Multi-AZ |
| ECS Fargate | $20-50 | $100-300 | Depends on CPU/memory |
| S3 | $0.50 | $2-5 | Storage + transfer |
| CloudFront | $5-10 | $20-50 | Data transfer |
| **Total** | **~$90** | **~$250-600** | Rough estimates |

---

## Security Considerations

1. **Database:** Store credentials in AWS Secrets Manager
2. **Network:** Private subnets for RDS, only ALB in public subnet
3. **IAM:** Least privilege access (follow AWS best practices)
4. **Encryption:** Enable encryption at rest and in transit
5. **DDoS:** Use AWS Shield and WAF for protection
6. **Monitoring:** CloudTrail for audit logging

---

## Disaster Recovery

1. **RDS Backups:** Automated daily backups
2. **Multi-AZ:** Data replicated across availability zones
3. **Cross-Region Replication:** Backup to another region
4. **Disaster Recovery Plan:** Document RTO/RPO targets

---

## Next Steps

1. ✅ Set up CDK project (follow AWS_CDK_SETUP_GUIDE.md)
2. ⬜ Design detailed network topology in CDK
3. ⬜ Implement VPC stack
4. ⬜ Implement RDS stack
5. ⬜ Implement ECS stack
6. ⬜ Test deployment to dev environment
7. ⬜ Set up CI/CD pipeline
8. ⬜ Deploy to production

---

## Additional Resources

- [AWS CDK Best Practices](https://docs.aws.amazon.com/cdk/latest/guide/best_practices.html)
- [VPC Design Guide](https://docs.aws.amazon.com/vpc/latest/userguide/)
- [ECS on Fargate Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/what-is-fargate.html)
- [RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
