import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { randomUUID } from "node:crypto";
import { saveDocumentMetadata } from "../services/dynamodb.service";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    // 1. Read request body
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Request body is required",
        }),
      };
    }

    const body = JSON.parse(event.body);

    // 2. Validate input
    const fileName = body.fileName;
    const contentType = body.contentType;

    if (
      typeof fileName !== "string" ||
      !fileName.trim() ||
      typeof contentType !== "string" ||
      !ALLOWED_CONTENT_TYPES.includes(contentType)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Valid fileName and contentType are required",
        }),
      };
    }

    // 3. Generate unique document ID
    const documentId = randomUUID();

    // 4. Generate S3 object key
    const s3Key = `documents/${documentId}/${fileName.trim()}`;

    // 5. Save metadata in DynamoDB
    const document = await saveDocumentMetadata({
      documentId,
      fileName: fileName.trim(),
      contentType,
      s3Key,
    });

    // 6. Return response
    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Document metadata created successfully",
        data: document,
      }),
    };
  } catch (error) {
    console.error("Create document error:", error);

    if (error instanceof SyntaxError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Invalid JSON request body",
        }),
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};