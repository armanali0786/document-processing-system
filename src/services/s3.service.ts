import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/aws";
import { env } from "../config/env";

const allowedTypes: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
};

// Presigned PUT link: lets the client upload one file directly to S3
export async function generateUploadUrl(
  fileName: string,
  contentType: string,
  documentId: string
) {
  const fileExtension = fileName.split(".").pop()?.toLowerCase();

  if (!fileExtension || !allowedTypes[fileExtension]?.includes(contentType)) {
    throw new Error("Unsupported file type");
  }

  const key = `documents/${documentId}/${fileName}`;

  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, {
    expiresIn: env.PRESIGNED_URL_EXPIRY,
  });

  return {
    uploadUrl,
    s3Key: key,
  };
}

// Presigned GET link: lets the client view/download one file
export async function generateDownloadUrl(s3Key: string) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: s3Key,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: env.PRESIGNED_URL_EXPIRY,
  });
}

// Check whether the file really exists in S3. Returns its size, or null if missing.
export async function getObjectInfo(s3Key: string) {
  try {
    const result = await s3Client.send(
      new HeadObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: s3Key })
    );
    return { size: result.ContentLength ?? 0 };
  } catch (err) {
    if (err instanceof Error && err.name === "NotFound") {
      return null;
    }
    throw err;
  }
}

export async function deleteObject(s3Key: string) {
  await s3Client.send(
    new DeleteObjectCommand({ Bucket: env.S3_BUCKET_NAME, Key: s3Key })
  );
}
