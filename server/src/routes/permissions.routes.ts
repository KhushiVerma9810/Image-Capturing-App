import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { permissionController } from "../controllers/permission.controller.js";

export const permissionsRouter = Router();

permissionsRouter.use(requireAuth, requirePermission("manage_permissions"));

permissionsRouter.get("/", asyncHandler(permissionController.list));
permissionsRouter.post("/", asyncHandler(permissionController.create));
