import { z } from "zod";
import { searchParam } from "./common.schema.js";

export const summaryQuery = z.object({
  search: searchParam,
});

export type SummaryQuery = z.infer<typeof summaryQuery>;
