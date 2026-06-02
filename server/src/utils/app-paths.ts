import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);

export const serverRoot = path.resolve(path.dirname(currentFile), "..", "..");
