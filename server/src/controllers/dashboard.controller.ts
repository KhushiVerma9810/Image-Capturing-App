import type { Request, Response } from "express";
import { summaryQuery } from "../schemas/dashboard.schema.js";
import { getDashboardSummary } from "../services/dashboard.service.js";

export const dashboardController = {
  async summary(req: Request, res: Response) {
    const { search } = summaryQuery.parse(req.query);
    res.json(await getDashboardSummary(req.auth!.role, search));
  },
};
