#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { NetworkStack } from "../lib/network-stack";
import { DatabaseStack } from "../lib/database-stack";
import { EcsStack } from "../lib/ecs-stack";
import { InfrastructureStack } from "../lib/infrastructure-stack";
import { CodePipelineStack } from "../lib/codepipeline-stack";

const app = new cdk.App();

// Define environment - recommended to specify for resource lookups
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

// 1. Create the Network Stack first (VPC will be shared across all stacks)
const networkStack = new NetworkStack(app, "FullStackNetworkStack", {
  env,
  description: "Network infrastructure including VPC, subnets, and NAT gateway",
});

// 2. Create the Database Stack (uses VPC from Network Stack)
const databaseStack = new DatabaseStack(app, "FullStackDatabaseStack", {
  env,
  vpc: networkStack.vpc,
  description: "RDS MySQL database for the full-stack application",
});
databaseStack.addDependency(networkStack);

// 3. Create the ECS Stack (backend container service)
const ecsStack = new EcsStack(app, "FullStackEcsStack", {
  env,
  vpc: networkStack.vpc,
  dbPasswordParameter: databaseStack.dbPasswordParameter,
  dbHostParameter: databaseStack.dbHostParameter,
  dbUsernameParameter: databaseStack.dbUsernameParameter,
  dbNameParameter: databaseStack.dbNameParameter,
});
ecsStack.addDependency(networkStack);
ecsStack.addDependency(databaseStack); // ECS needs database credentials

// 4. Create the CodePipeline Stack (CI/CD for backend)
const codePipelineStack = new CodePipelineStack(
  app,
  "FullStackCodePipelineStack",
  {
    env,
    ecrRepository: ecsStack.repository, // ← Pass ECR repo from ECS stack
    ecsService: ecsStack.service, // ← Pass ECS service from ECS stack
    ecsCluster: ecsStack.cluster, // ← Pass ECS cluster from ECS stack
    vpc: networkStack.vpc, // ← Pass VPC for migration task
    description: "CI/CD pipeline for backend deployment",
  }
);
codePipelineStack.addDependency(ecsStack); // Pipeline needs ECS resources to exist first

// 4. Main Infrastructure Stack (placeholder for future app resources)
const infrastructureStack = new InfrastructureStack(app, "FullStackAppStack", {
  env,
  description: "Main application infrastructure",
});
infrastructureStack.addDependency(networkStack);

app.synth();
