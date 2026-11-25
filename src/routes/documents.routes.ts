import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import {
  deleteObject,
  generateDownloadUrl,
  generateUploadUrl,
  getObjectInfo,
} from "../services/s3.service";
import {
  deleteDocumentMetadata,
  getDocumentMetadata,
  listDocuments,
  markDocumentUploaded,
  saveDocumentMetadata,
} from "../services/dynamodb.service";

export const documentsRouter = Router();

// What the client must send in POST /documents
const createDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  fileSize: z.number().int().positive(), // bytes
});

// GET /documents  →  list all records (newest first)
documentsRouter.get("/", async (_req, res) => {
  const documents = await listDocuments();
  res.json({ documents });
});

// POST /documents  →  create a record + return a presigned upload URL
documentsRouter.post("/", async (req, res) => {
  const parsed = createDocumentSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request body",
      details: z.flattenError(parsed.error).fieldErrors,
    });
  }

  const maxBytes = env.MAX_FILE_SIZE_MB * 1024 * 1024;
  if (parsed.data.fileSize > maxBytes) {
    return res.status(413).json({
      error: `File is too large. Maximum size is ${env.MAX_FILE_SIZE_MB} MB.`,
    });
  }

  // Keep only safe characters so the name can't create odd S3 paths ("../", "/", etc.)
  const fileName = parsed.data.fileName
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const { contentType, fileSize } = parsed.data;
  const documentId = randomUUID();

  let upload;
  try {
    upload = await generateUploadUrl(fileName, contentType, documentId, fileSize);
  } catch (err) {
    if (err instanceof Error && err.message === "Unsupported file type") {
      return res.status(400).json({
        error: "Unsupported file type. Allowed: pdf, jpg, jpeg, png",
      });
    }
    throw err;
  }

  const document = await saveDocumentMetadata({
    documentId,
    fileName,
    contentType,
    s3Key: upload.s3Key,
  });

  res.status(201).json({
    document,
    uploadUrl: upload.uploadUrl,
    expiresIn: env.PRESIGNED_URL_EXPIRY,
  });
});

// GET /documents/:id  →  read a record
documentsRouter.get("/:id", async (req, res) => {
  const document = await getDocumentMetadata(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  res.json({ document });
});

// POST /documents/:id/complete  →  client says "upload finished";
// we verify the file is really in S3, then mark it UPLOADED
documentsRouter.post("/:id/complete", async (req, res) => {
  const document = await getDocumentMetadata(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  const info = await getObjectInfo(document.s3Key);
  if (!info) {
    return res
      .status(409)
      .json({ error: "File not found in S3 yet. Upload it first." });
  }

  const updated = await markDocumentUploaded(document.documentId, info.size);
  res.json({ document: updated });
});

// GET /documents/:id/download-url  →  temporary link to view/download the file
documentsRouter.get("/:id/download-url", async (req, res) => {
  const document = await getDocumentMetadata(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }
  if (document.status !== "UPLOADED") {
    return res.status(409).json({ error: "File has not been uploaded yet" });
  }

  const downloadUrl = await generateDownloadUrl(document.s3Key);
  res.json({ downloadUrl, expiresIn: env.PRESIGNED_URL_EXPIRY });
});

// DELETE /documents/:id  →  remove the file from S3 and the record from DynamoDB
documentsRouter.delete("/:id", async (req, res) => {
  const document = await getDocumentMetadata(req.params.id);
  if (!document) {
    return res.status(404).json({ error: "Document not found" });
  }

  await deleteObject(document.s3Key); // succeeds even if the file was never uploaded
  await deleteDocumentMetadata(document.documentId);
  res.status(204).send();
});
