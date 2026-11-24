import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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

// Scan reads the whole table. Fine for a small dev table; for big tables
// you would add a GSI and use Query instead.
export async function listDocuments() {
  const result = await dynamoDB.send(
    new ScanCommand({
      TableName: env.DYNAMODB_TABLE_NAME,
      Limit: 100,
    })
  );

  const items = result.Items ?? [];
  return items.sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt))
  );
}

export async function markDocumentUploaded(documentId: string, size: number) {
  const result = await dynamoDB.send(
    new UpdateCommand({
      TableName: env.DYNAMODB_TABLE_NAME,
      Key: { documentId },
      UpdateExpression:
        "SET #status = :status, #size = :size, uploadedAt = :uploadedAt",
      // "status" and "size" are DynamoDB reserved words, so we alias them
      ExpressionAttributeNames: { "#status": "status", "#size": "size" },
      ExpressionAttributeValues: {
        ":status": "UPLOADED",
        ":size": size,
        ":uploadedAt": new Date().toISOString(),
      },
      ConditionExpression: "attribute_exists(documentId)",
      ReturnValues: "ALL_NEW",
    })
  );

  return result.Attributes;
}

export async function deleteDocumentMetadata(documentId: string) {
  await dynamoDB.send(
    new DeleteCommand({
      TableName: env.DYNAMODB_TABLE_NAME,
      Key: { documentId },
    })
  );
}
