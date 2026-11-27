"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUploadUrl = generateUploadUrl;
exports.generateDownloadUrl = generateDownloadUrl;
exports.getObjectInfo = getObjectInfo;
exports.deleteObject = deleteObject;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const aws_1 = require("../config/aws");
const env_1 = require("../config/env");
const allowedTypes = {
    pdf: ["application/pdf"],
    jpg: ["image/jpeg"],
    jpeg: ["image/jpeg"],
    png: ["image/png"],
};
// Presigned PUT link: lets the client upload one file directly to S3
// export async function generateUploadUrl(
//   fileName: string,
//   contentType: string,
//   documentId: string
// ) {
//   const fileExtension = fileName.split(".").pop()?.toLowerCase();
//   if (!fileExtension || !allowedTypes[fileExtension]?.includes(contentType)) {
//     throw new Error("Unsupported file type");
//   }
//   const key = `documents/${documentId}/${fileName}`;
//   const command = new PutObjectCommand({
//     Bucket: env.S3_BUCKET_NAME,
//     Key: key,
//     ContentType: contentType,
//   });
//   const uploadUrl = await getSignedUrl(s3Client, command, {
//     expiresIn: env.PRESIGNED_URL_EXPIRY,
//   });
//   return {
//     uploadUrl,
//     s3Key: key,
//   };
// }
// Presigned PUT link: lets the client upload one file directly to S3.
// Content-Length and Content-Type are signed, so S3 rejects any upload
// whose size or type differs from what the client declared.
async function generateUploadUrl(fileName, contentType, documentId, fileSize) {
    const fileExtension = fileName.split(".").pop()?.toLowerCase();
    if (!fileExtension || !allowedTypes[fileExtension]?.includes(contentType)) {
        throw new Error("Unsupported file type");
    }
    const key = `documents/${documentId}/${fileName}`;
    const command = new client_s3_1.PutObjectCommand({
        Bucket: env_1.env.S3_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
    });
    const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(aws_1.s3Client, command, {
        expiresIn: env_1.env.PRESIGNED_URL_EXPIRY,
        signableHeaders: new Set(["content-type"]), // not signed by default
    });
    return {
        uploadUrl,
        s3Key: key,
    };
}
// Presigned GET link: lets the client view/download one file
async function generateDownloadUrl(s3Key) {
    const command = new client_s3_1.GetObjectCommand({
        Bucket: env_1.env.S3_BUCKET_NAME,
        Key: s3Key,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(aws_1.s3Client, command, {
        expiresIn: env_1.env.PRESIGNED_URL_EXPIRY,
    });
}
// Check whether the file really exists in S3. Returns its size, or null if missing.
async function getObjectInfo(s3Key) {
    try {
        const result = await aws_1.s3Client.send(new client_s3_1.HeadObjectCommand({ Bucket: env_1.env.S3_BUCKET_NAME, Key: s3Key }));
        return { size: result.ContentLength ?? 0 };
    }
    catch (err) {
        if (err instanceof Error && err.name === "NotFound") {
            return null;
        }
        throw err;
    }
}
async function deleteObject(s3Key) {
    await aws_1.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: env_1.env.S3_BUCKET_NAME, Key: s3Key }));
}
