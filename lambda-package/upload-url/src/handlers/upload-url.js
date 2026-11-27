"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const dynamodb_service_1 = require("../services/dynamodb.service");
const s3_service_1 = require("../services/s3.service");
const env_1 = require("../config/env");
const handler = async (event) => {
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
        let body;
        try {
            body = JSON.parse(event.body);
        }
        catch {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Invalid JSON request body",
                }),
            };
        }
        const { documentId, fileSize } = body;
        if (typeof documentId !== "string" ||
            !documentId.trim() ||
            typeof fileSize !== "number" ||
            !Number.isSafeInteger(fileSize) ||
            fileSize <= 0) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: "Valid documentId and fileSize are required",
                }),
            };
        }
        const maxFileSize = env_1.env.MAX_FILE_SIZE_MB * 1024 * 1024;
        if (fileSize > maxFileSize) {
            return {
                statusCode: 413,
                body: JSON.stringify({
                    success: false,
                    message: `Maximum file size is ${env_1.env.MAX_FILE_SIZE_MB} MB`,
                }),
            };
        }
        // Retrieve the trusted document metadata
        const document = await (0, dynamodb_service_1.getDocumentMetadata)(documentId);
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
        const result = await (0, s3_service_1.generateUploadUrl)(document.fileName, document.contentType, document.documentId, fileSize);
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
                    expiresIn: env_1.env.PRESIGNED_URL_EXPIRY,
                    requiredHeaders: {
                        "Content-Type": document.contentType,
                    },
                },
            }),
        };
    }
    catch (error) {
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
exports.handler = handler;
