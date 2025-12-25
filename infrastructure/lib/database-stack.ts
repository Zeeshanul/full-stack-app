import * as cdk from 'aws-cdk-lib/core';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly dbPasswordParameter: ssm.IStringParameter;
  public readonly dbHostParameter: ssm.IStringParameter;
  public readonly dbUsernameParameter: ssm.IStringParameter;
  public readonly dbNameParameter: ssm.IStringParameter;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc } = props;

    // Reference ALL database config from Parameter Store (must be created manually before deployment)
    // Create with:
    //   aws ssm put-parameter --name "/fullstack/database/password" --value "YourPassword" --type "SecureString"
    //   aws ssm put-parameter --name "/fullstack/database/name" --value "fullstackdb" --type "String"
    //   aws ssm put-parameter --name "/fullstack/database/username" --value "admin" --type "String"
    
    const dbPassword = ssm.StringParameter.fromSecureStringParameterAttributes(this, 'DBPassword', {
      parameterName: '/fullstack/database/password',
    });

    const dbName = ssm.StringParameter.valueFromLookup(this, '/fullstack/database/name');
    const dbUsername = ssm.StringParameter.valueFromLookup(this, '/fullstack/database/username');

    // Create RDS MySQL Database with all config from Parameter Store
    this.database = new rds.DatabaseInstance(this, 'FullStackDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({ version: rds.MysqlEngineVersion.VER_8_0 }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      databaseName: dbName,
      credentials: rds.Credentials.fromPassword(dbUsername, cdk.SecretValue.ssmSecure(dbPassword.parameterName)),
      port: 3306,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      multiAz: false,
      backupRetention: cdk.Duration.days(0),
      preferredMaintenanceWindow: 'mon:04:00-mon:05:00',
      autoMinorVersionUpgrade: true,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
    });

    // Store host in Parameter Store (created after DB deployment, will be referenced by ECS)
    const dbHost = new ssm.StringParameter(this, 'DBHost', {
      parameterName: '/fullstack/database/host',
      stringValue: this.database.dbInstanceEndpointAddress,
      description: 'Database host endpoint',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Reference existing username parameter (no need to recreate it)
    const dbUsernameParameter = ssm.StringParameter.fromStringParameterAttributes(this, 'DBUsernameParam', {
      parameterName: '/fullstack/database/username',
    });

    const dbNameParameter = ssm.StringParameter.fromStringParameterAttributes(this, 'DBNameParam', {
      parameterName: '/fullstack/database/name',
    });

    // Export all parameters for ECS stack (all from Parameter Store - FREE)
    this.dbPasswordParameter = dbPassword;
    this.dbHostParameter = dbHost;
    this.dbUsernameParameter = dbUsernameParameter;
    this.dbNameParameter = dbNameParameter;

    // Allow inbound traffic to database on port 3306
    this.database.connections.allowDefaultPortFromAnyIpv4('Allow MySQL from anywhere');

    // Output connection details
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
      exportName: 'FullStackDatabaseEndpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: this.database.dbInstanceEndpointPort,
      description: 'RDS Database Port',
      exportName: 'FullStackDatabasePort',
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: dbName,
      description: 'Database Name (from Parameter Store)',
      exportName: 'FullStackDatabaseName',
    });

    new cdk.CfnOutput(this, 'DatabaseUsername', {
      value: dbUsername,
      description: 'Database Username (from Parameter Store)',
      exportName: 'FullStackDatabaseUsername',
    });

    new cdk.CfnOutput(this, 'ParameterStorePrefix', {
      value: '/fullstack/database/',
      description: 'All database credentials stored in Parameter Store (100% FREE)',
      exportName: 'FullStackDatabaseParameterPrefix',
    });

    new cdk.CfnOutput(this, 'PasswordParameterName', {
      value: dbPassword.parameterName,
      description: 'Password stored in Parameter Store SecureString (encrypted, FREE)',
      exportName: 'FullStackDatabasePasswordParam',
    });

    new cdk.CfnOutput(this, 'ConnectionString', {
      value: `mysql://admin:PASSWORD@${this.database.dbInstanceEndpointAddress}:3306/fullstackdb`,
      description: 'Database Connection String (PASSWORD from Parameter Store)',
      exportName: 'FullStackConnectionString',
    });
  }
}
