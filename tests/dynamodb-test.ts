import { DescribeTableCommand } from "@aws-sdk/client-dynamodb";
import { env } from "../src/config/env";
import { dynamoDBClient } from "../src/config/aws";

async function testDynamoDB() {
  try {
    const result = await dynamoDBClient.send(
      new DescribeTableCommand({
        TableName: env.DYNAMODB_TABLE_NAME,
      })
    );

    console.log("DynamoDB connection successful!");
    console.log("Table name:", result.Table?.TableName);
    console.log("Table status:", result.Table?.TableStatus);
  } catch (error) {
    console.error("DynamoDB connection failed:", error);
    process.exitCode = 1;
  }
}

testDynamoDB();
