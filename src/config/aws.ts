import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "./env";

// Credentials are picked up automatically from AWS_PROFILE (loaded from .env).
const awsConfig = {
  region: env.AWS_REGION,
};

export const s3Client = new S3Client(awsConfig);

export const dynamoDBClient = new DynamoDBClient(awsConfig);

export const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient, {
  marshallOptions: { removeUndefinedValues: true },
});
