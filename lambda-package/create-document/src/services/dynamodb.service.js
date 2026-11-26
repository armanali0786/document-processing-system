"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveDocumentMetadata = saveDocumentMetadata;
exports.getDocumentMetadata = getDocumentMetadata;
exports.listDocuments = listDocuments;
exports.markDocumentUploaded = markDocumentUploaded;
exports.deleteDocumentMetadata = deleteDocumentMetadata;
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
const aws_1 = require("../config/aws");
const env_1 = require("../config/env");
async function saveDocumentMetadata(document) {
    const item = {
        ...document,
        status: "PENDING_UPLOAD",
        createdAt: new Date().toISOString(),
    };
    await aws_1.dynamoDB.send(new lib_dynamodb_1.PutCommand({
        TableName: env_1.env.DYNAMODB_TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(documentId)",
    }));
    return item;
}
async function getDocumentMetadata(documentId) {
    const result = await aws_1.dynamoDB.send(new lib_dynamodb_1.GetCommand({
        TableName: env_1.env.DYNAMODB_TABLE_NAME,
        Key: { documentId },
    }));
    return result.Item; // undefined if not found
}
// Scan reads the whole table. Fine for a small dev table; for big tables
// you would add a GSI and use Query instead.
async function listDocuments() {
    const result = await aws_1.dynamoDB.send(new lib_dynamodb_1.ScanCommand({
        TableName: env_1.env.DYNAMODB_TABLE_NAME,
        Limit: 100,
    }));
    const items = result.Items ?? [];
    return items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}
async function markDocumentUploaded(documentId, size) {
    const result = await aws_1.dynamoDB.send(new lib_dynamodb_1.UpdateCommand({
        TableName: env_1.env.DYNAMODB_TABLE_NAME,
        Key: { documentId },
        UpdateExpression: "SET #status = :status, #size = :size, uploadedAt = :uploadedAt",
        // "status" and "size" are DynamoDB reserved words, so we alias them
        ExpressionAttributeNames: { "#status": "status", "#size": "size" },
        ExpressionAttributeValues: {
            ":status": "UPLOADED",
            ":size": size,
            ":uploadedAt": new Date().toISOString(),
        },
        ConditionExpression: "attribute_exists(documentId)",
        ReturnValues: "ALL_NEW",
    }));
    return result.Attributes;
}
async function deleteDocumentMetadata(documentId) {
    await aws_1.dynamoDB.send(new lib_dynamodb_1.DeleteCommand({
        TableName: env_1.env.DYNAMODB_TABLE_NAME,
        Key: { documentId },
    }));
}
