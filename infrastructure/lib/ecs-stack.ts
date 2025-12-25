import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface EcsStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;  // Reuse VPC from NetworkStack
  dbPasswordParameter: ssm.IStringParameter; // Password from Parameter Store (FREE)
  dbHostParameter: ssm.IStringParameter;     // Host from Parameter Store (FREE)
  dbUsernameParameter: ssm.IStringParameter; // Username from Parameter Store (FREE)
  dbNameParameter: ssm.IStringParameter;     // Database name from Parameter Store (FREE)
}

export class EcsStack extends cdk.Stack {
  public readonly cluster: ecs.Cluster;
  public readonly service: ecs.FargateService;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // =====================================================
    // STEP 1: ECR Repository (Docker Image Storage)
    // =====================================================
    // This is like your private Docker Hub on AWS
    // You'll push your NestJS Docker image here
    this.repository = new ecr.Repository(this, 'BackendRepository', {
      repositoryName: 'fullstack-backend',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Delete repo when stack is destroyed
      autoDeleteImages: true, // Delete all images when repo is deleted
      imageScanOnPush: true, // Scan images for vulnerabilities
    });

    // Output the repository URI (you'll use this to push Docker images)
    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      description: 'ECR Repository URI for backend Docker images',
      exportName: 'BackendRepositoryUri',
    });

    // =====================================================
    // STEP 2: ECS Cluster (Container Orchestration)
    // =====================================================
    // The cluster is the logical grouping of your container services
    // Think of it as the "environment" where containers run
    this.cluster = new ecs.Cluster(this, 'BackendCluster', {
      clusterName: 'fullstack-backend-cluster',
      vpc,
      containerInsights: true, // Enable CloudWatch Container Insights for monitoring
    });

    // Output cluster details
    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster Name',
      exportName: 'BackendClusterName',
    });

    // =====================================================
    // STEP 3: Application Load Balancer (Traffic Router)
    // =====================================================
    // ALB receives traffic from the internet and routes it to your containers
    // It also handles health checks and auto-scaling
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'BackendALB', {
      vpc,
      internetFacing: true, // Accessible from the internet
      loadBalancerName: 'fullstack-backend-alb',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Must be in public subnets
      },
    });

    // Create a listener on port 80 (HTTP)
    // Later you can add HTTPS on port 443 with SSL certificate
    const httpListener = this.loadBalancer.addListener('HttpListener', {
      port: 80,
      open: true, // Allow traffic from 0.0.0.0/0
    });

    // Default response if no targets are healthy
    httpListener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'Backend service is initializing...',
      }),
    });

    // Output ALB DNS name (you'll use this to access your API)
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: 'BackendLoadBalancerDNS',
    });

    // =====================================================
    // STEP 4: Task Definition (Container Blueprint)
    // =====================================================
    // This defines WHAT runs in your container:
    // - Which Docker image to use
    // - How much CPU/memory to allocate
    // - Environment variables
    // - Ports to expose
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'BackendTaskDef', {
      memoryLimitMiB: 512, // 0.5 GB RAM - good for development
      cpu: 256, // 0.25 vCPU - good for development
      // For production, consider: memory: 1024, cpu: 512
    });

    // Create CloudWatch log group for container logs
    const logGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: '/ecs/fullstack-backend',
      retention: logs.RetentionDays.ONE_WEEK, // Keep logs for 7 days
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('BackendContainer', {
      // Using your actual NestJS Docker image from ECR
      image: ecs.ContainerImage.fromEcrRepository(this.repository, 'latest'),
      
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logGroup: logGroup,
      }),
      
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DB_PORT: '3306',
      },

      // All secrets from Parameter Store (100% FREE - no Secrets Manager costs)
      secrets: {
        DB_HOST: ecs.Secret.fromSsmParameter(props.dbHostParameter),
        DB_USERNAME: ecs.Secret.fromSsmParameter(props.dbUsernameParameter),
        DB_NAME: ecs.Secret.fromSsmParameter(props.dbNameParameter),
        DB_PASSWORD: ecs.Secret.fromSsmParameter(props.dbPasswordParameter), // SecureString is encrypted
      },
      
      // Health check - ECS will restart container if this fails
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    // Expose port 3000 from container
    container.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // =====================================================
    // STEP 5: ECS Service (Runs & Manages Containers)
    // =====================================================
    // The service ensures your containers are always running
    // It handles auto-scaling, health checks, and load balancing
    this.service = new ecs.FargateService(this, 'BackendService', {
      cluster: this.cluster,
      taskDefinition,
      serviceName: 'fullstack-backend-service',
      desiredCount: 1, // Start with 1 container (can scale up later)
      assignPublicIp: true, // Containers get public IPs (needed for internet access)
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC, // Run containers in public subnets
      },
      healthCheckGracePeriod: cdk.Duration.seconds(60), // Wait 60s before starting health checks
    });

    // Connect ECS service to the load balancer
    // Traffic flow: Internet → ALB → ECS Service → Container
    httpListener.addTargets('BackendTargetGroup', {
      port: 80,
      targets: [this.service],
      healthCheck: {
        path: '/health', // ALB checks this endpoint
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Auto-scaling configuration (optional but recommended)
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: 1, // Minimum 1 container always running
      maxCapacity: 4, // Maximum 4 containers under load
    });

    // Scale up when CPU > 70%
    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Scale up when memory > 80%
    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // Final output: Your API URL
    new cdk.CfnOutput(this, 'BackendApiUrl', {
      value: `http://${this.loadBalancer.loadBalancerDnsName}`,
      description: 'Backend API Base URL',
      exportName: 'BackendApiUrl',
    });
  }
}