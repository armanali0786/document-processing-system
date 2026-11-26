"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dynamoDB = exports.dynamoDBClient = exports.s3Client = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const env_1 = require("./env");
// Credentials are picked up automatically from AWS_PROFILE (loaded from .env).
const awsConfig = {
    region: env_1.env.AWS_REGION,
};
exports.s3Client = new client_s3_1.S3Client(awsConfig);
exports.dynamoDBClient = new client_dynamodb_1.DynamoDBClient(awsConfig);
exports.dynamoDB = lib_dynamodb_1.DynamoDBDocumentClient.from(exports.dynamoDBClient, {
    marshallOptions: { removeUndefinedValues: true },
});
