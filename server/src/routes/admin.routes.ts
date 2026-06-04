import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { userController } from "../controllers/user.controller.js";
import { dashboardController } from "../controllers/dashboard.controller.js";

export const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get(
  "/users",
  requirePermission("manage_users"),
  asyncHandler(userController.list),
);
adminRouter.post(
  "/users",
  requirePermission("manage_users"),
  asyncHandler(userController.create),
);
adminRouter.patch(
  "/users/:id",
  requirePermission("manage_users"),
  asyncHandler(userController.update),
);
adminRouter.delete(
  "/users/:id",
  requirePermission("manage_users"),
  asyncHandler(userController.remove),
);

adminRouter.get(
  "/summary",
  requirePermission("view_dashboard"),
  asyncHandler(dashboardController.summary),
);
