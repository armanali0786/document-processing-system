
import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().default(3000),

  AWS_REGION: z.string().min(1),

  AWS_PROFILE: z.string().optional(),

  S3_BUCKET_NAME: z.string().min(3),

  DYNAMODB_TABLE_NAME: z.string().min(3),

  PRESIGNED_URL_EXPIRY: z.coerce.number()
    .int()
    .min(1)
    .max(3600)
    .default(300),
    
  MAX_FILE_SIZE_MB: z.coerce.number()
    .positive()
    .max(5120)
    .default(10)
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("Invalid environment configuration:");
  console.error(z.flattenError(result.error).fieldErrors);
  throw new Error("Environment configuration failed");
}

export const env = result.data;
