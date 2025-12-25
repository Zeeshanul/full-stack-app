import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';

/**
 * Main Infrastructure Stack
 * This is a placeholder for future application-level resources
 * (e.g., Lambda functions, API Gateway, etc.)
 * 
 * Network and database resources are now in separate stacks for better reusability
 */
export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Future application resources can be added here
    // They can reference the VPC and other resources via stack dependencies
  }
}
