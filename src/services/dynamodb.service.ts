import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../config/aws";
import { env } from "../config/env";

export async function saveDocumentMetadata(document: {
  documentId: string;
  fileName: string;
  contentType: string;
  s3Key: string;
}) {
  const item = {
    ...document,
    status: "PENDING_UPLOAD",
    createdAt: new Date().toISOString(),
  };

  await dynamoDB.send(
    new PutCommand({
      TableName: env.DYNAMODB_TABLE_NAME,
      Item: item,
      ConditionExpression: "attribute_not_exists(documentId)",
    })
  );

  return item;
}

export async function getDocumentMetadata(documentId: string) {
  const result = await dynamoDB.send(
    new GetCommand({
      TableName: env.DYNAMODB_TABLE_NAME,
      Key: { documentId },
    })
  );

  return result.Item; // undefined if not found
}
