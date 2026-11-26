"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"])
        .default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    AWS_REGION: zod_1.z.string().min(1),
    AWS_PROFILE: zod_1.z.string().optional(),
    S3_BUCKET_NAME: zod_1.z.string().min(3),
    DYNAMODB_TABLE_NAME: zod_1.z.string().min(3),
    PRESIGNED_URL_EXPIRY: zod_1.z.coerce.number()
        .int()
        .min(1)
        .max(3600)
        .default(300),
    MAX_FILE_SIZE_MB: zod_1.z.coerce.number()
        .positive()
        .max(5120)
        .default(10)
});
const result = envSchema.safeParse(process.env);
if (!result.success) {
    console.error("Invalid environment configuration:");
    console.error(zod_1.z.flattenError(result.error).fieldErrors);
    throw new Error("Environment configuration failed");
}
exports.env = result.data;
