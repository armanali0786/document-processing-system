import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { getDocumentMetadata } from "../services/dynamodb.service";
import { generateUploadUrl } from "../services/s3.service";
import { env } from "../config/env";

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Request body is required",
        }),
      };
    }

    let body: { documentId?: string; fileSize?: number };

    try {
      body = JSON.parse(event.body);
    } catch {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Invalid JSON request body",
        }),
      };
    }

    const { documentId, fileSize } = body;

    if (
      typeof documentId !== "string" ||
      !documentId.trim() ||
      typeof fileSize !== "number" ||
      !Number.isSafeInteger(fileSize) ||
      fileSize <= 0
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          message: "Valid documentId and fileSize are required",
        }),
      };
    }

    const maxFileSize = env.MAX_FILE_SIZE_MB * 1024 * 1024;

    if (fileSize > maxFileSize) {
      return {
        statusCode: 413,
        body: JSON.stringify({
          success: false,
          message: `Maximum file size is ${env.MAX_FILE_SIZE_MB} MB`,
        }),
      };
    }

    // Retrieve the trusted document metadata
    const document = await getDocumentMetadata(documentId);

    if (!document) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          success: false,
          message: "Document not found",
        }),
      };
    }

    if (document.status !== "PENDING_UPLOAD") {
      return {
        statusCode: 409,
        body: JSON.stringify({
          success: false,
          message: "Document is not awaiting upload",
        }),
      };
    }

    // Generate URL using metadata stored in DynamoDB
    const result = await generateUploadUrl(
      document.fileName,
      document.contentType,
      document.documentId,
      fileSize
    );

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        success: true,
        message: "Upload URL generated successfully",
        data: {
          documentId,
          uploadUrl: result.uploadUrl,
          s3Key: result.s3Key,
          expiresIn: env.PRESIGNED_URL_EXPIRY,
          requiredHeaders: {
            "Content-Type": document.contentType,
          },
        },
      }),
    };
  } catch (error) {
    console.error("Generate upload URL error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Internal server error",
      }),
    };
  }
};