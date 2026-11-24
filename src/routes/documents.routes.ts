import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env";
import { generateUploadUrl } from "../services/s3.service";
import {
  getDocumentMetadata,
  saveDocumentMetadata,
} from "../services/dynamodb.service";

export const documentsRouter = Router();

// What the client must send in POST /documents
const createDocumentSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
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

  // Keep only safe characters so the name can't create odd S3 paths ("../", "/", etc.)
  const fileName = parsed.data.fileName
    .split(/[\\/]/)
    .pop()!
    .replace(/[^a-zA-Z0-9._-]/g, "_");
  const { contentType } = parsed.data;
  const documentId = randomUUID();

  let upload;
  try {
    upload = await generateUploadUrl(fileName, contentType, documentId);
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
