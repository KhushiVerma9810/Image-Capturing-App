import { promises as fs } from "node:fs";
import path from "node:path";

export async function ensureDirectory(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function removeFileIfExists(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

export function safeJoin(baseDir: string, fileName: string) {
  return path.join(baseDir, path.basename(fileName));
}
