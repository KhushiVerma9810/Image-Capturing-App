import { z } from "zod";
import { listQuerySchema } from "./common.schema.js";

export const listImagesQuery = listQuerySchema({ defaultLimit: 12 });

export type ListImagesQuery = z.infer<typeof listImagesQuery>;
