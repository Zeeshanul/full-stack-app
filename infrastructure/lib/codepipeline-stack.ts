import * as cdk from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ssm from 'aws-cdk-lib/aws-ssm';  // Changed from secretsmanager
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface CodePipelineStackProps extends cdk.StackProps {
  ecrRepository: ecr.IRepository;
  ecsService: ecs.IBaseService;
  ecsCluster: ecs.ICluster;
  vpc: ec2.IVpc;
}

export class CodePipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CodePipelineStackProps) {
    super(scope, id, props);

    // =====================================================
    // STEP 1: Import GitHub Token from Parameter Store
    // =====================================================
    // Using Parameter Store (FREE) instead of Secrets Manager ($0.40/month)
    // Note: Must use plain String (not SecureString) due to CloudFormation limitations
    const githubToken = ssm.StringParameter.valueFromLookup(
      this,
      '/codepipeline/github-token'
    );

    // =====================================================
    // STEP 2: Create S3 Bucket for Pipeline Artifacts
    // =====================================================
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifactBucket', {
      bucketName: `backend-pipeline-artifacts-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // =====================================================
    // STEP 3: Define Pipeline Artifacts
    // =====================================================
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    // =====================================================
    // STEP 4: Create CodeBuild Project
    // =====================================================
    const buildProject = new codebuild.PipelineProject(this, 'BackendBuildProject', {
      projectName: 'backend-build-project',
      
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
        computeType: codebuild.ComputeType.SMALL,
      },

      environmentVariables: {
        AWS_ACCOUNT_ID: {
          value: this.account,
        },
        AWS_DEFAULT_REGION: {
          value: this.region,
        },
        IMAGE_REPO_NAME: {
          value: props.ecrRepository.repositoryName,
        },
        REPOSITORY_URI: {
          value: props.ecrRepository.repositoryUri,
        },
        VPC_SUBNETS: {
          value: props.vpc.publicSubnets.map(subnet => subnet.subnetId).join(','),
        },
        ECS_CLUSTER: {
          value: props.ecsCluster.clusterName,
        },
      },

      buildSpec: codebuild.BuildSpec.fromSourceFilename('back-end/buildspec.yml'),
    });

    // Grant CodeBuild permission to push to ECR
    props.ecrRepository.grantPullPush(buildProject);

    // Grant CodeBuild permission to run ECS tasks for migrations
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ecs:RunTask',
        'ecs:DescribeTasks',
        'ecs:StopTask',
      ],
      resources: ['*'], // Specific task definition ARNs
    }));

    // Grant CodeBuild permission to describe EC2 resources (for finding subnets)
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ec2:DescribeSubnets',
        'ec2:DescribeSecurityGroups',
        'ec2:DescribeNetworkInterfaces',
      ],
      resources: ['*'], // EC2 describe actions don't support resource-level permissions
    }));

    // Grant CodeBuild permission to pass the execution role to ECS tasks
    buildProject.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['iam:PassRole'],
      resources: ['*'],
      conditions: {
        StringEquals: {
          'iam:PassedToService': 'ecs-tasks.amazonaws.com',
        },
      },
    }));

    // =====================================================
    // STEP 5: Create the Pipeline
    // =====================================================
    const pipeline = new codepipeline.Pipeline(this, 'BackendPipeline', {
      pipelineName: 'backend-ecs-pipeline',
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // =====================================================
    // STAGE 1: SOURCE - Get code from GitHub
    // =====================================================
    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: 'GitHub_Source',
          owner: 'Zeeshanul',    // Replace with your GitHub username
          repo: 'full-stack-app',           // Replace with your repo name
          branch: 'main',
          oauthToken: cdk.SecretValue.unsafePlainText(githubToken),
          output: sourceOutput,
          trigger: codepipeline_actions.GitHubTrigger.WEBHOOK,
        }),
      ],
    });

    // =====================================================
    // STAGE 2: BUILD - Build and push Docker image
    // =====================================================
    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'Docker_Build_Push',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // =====================================================
    // STAGE 3: DEPLOY - Update ECS Service
    // =====================================================
    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.EcsDeployAction({
          actionName: 'ECS_Deploy',
          service: props.ecsService,
          input: buildOutput,
          deploymentTimeout: cdk.Duration.minutes(10),
        }),
      ],
    });

    // =====================================================
    // OUTPUTS
    // =====================================================
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline Name',
    });

    new cdk.CfnOutput(this, 'PipelineConsoleUrl', {
      value: `https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName}/view?region=${this.region}`,
      description: 'CodePipeline Console URL',
    });
  }
}