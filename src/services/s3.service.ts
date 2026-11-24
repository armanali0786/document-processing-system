import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../config/aws";
import { env } from "../config/env";

const allowedTypes: Record<string, string[]> = {
  pdf: ["application/pdf"],
  jpg: ["image/jpeg"],
  jpeg: ["image/jpeg"],
  png: ["image/png"],
};

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
