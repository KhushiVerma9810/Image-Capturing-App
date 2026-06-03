import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { roleController } from "../controllers/role.controller.js";

export const rolesRouter = Router();

rolesRouter.use(requireAuth);

rolesRouter.get(
  "/",
  requirePermission("manage_roles"),
  asyncHandler(roleController.list),
);
rolesRouter.get(
  "/assignable",
  requirePermission("manage_roles"),
  asyncHandler(roleController.listAssignable),
);
rolesRouter.post(
  "/",
  requirePermission("manage_roles"),
  asyncHandler(roleController.create),
);
