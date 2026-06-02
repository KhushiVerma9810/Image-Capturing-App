import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";
import { serverRoot } from "../utils/app-paths.js";

const envCandidates = [
  path.resolve(serverRoot, ".env"),
  path.resolve(serverRoot, "..", ".env")
];

for (const envPath of envCandidates) {
  dotenv.config({ path: envPath, override: false });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGO_URI: z
    .string()
    .trim()
    .min(1)
    .refine((value) => !/[<>]/.test(value), {
      message:
        "MONGO_URI still contains placeholder brackets. Replace it with a real MongoDB connection string."
  }),
  JWT_SECRET: z.string().trim().min(16),
  CLIENT_ORIGIN: z.string().trim().url().default("http://localhost:5173"),
  ADMIN_USERNAME: z.string().trim().min(1).default("admin"),
  ADMIN_PASSWORD: z.string().trim().min(8).default("Admin@12345"),
  UPLOAD_DIR: z.string().trim().default("uploads"),
  MAX_IMAGE_SIZE_MB: z.coerce.number().int().positive().default(8)
});

export const env = envSchema.parse(process.env);
