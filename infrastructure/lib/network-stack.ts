import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC that will be shared across all stacks
    // Development configuration: No NAT Gateway to save costs (~$32/month)
    // Using only public subnets - secure with Security Groups instead
    this.vpc = new ec2.Vpc(this, 'FullStackAppVpc', {
      maxAzs: 2,
      natGateways: 0, // Removed to save costs
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // Export VPC attributes for cross-stack references
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: 'FullStackAppVpcId',
    });

    new cdk.CfnOutput(this, 'VpcCidr', {
      value: this.vpc.vpcCidrBlock,
      description: 'VPC CIDR Block',
      exportName: 'FullStackAppVpcCidr',
    });
  }
}
