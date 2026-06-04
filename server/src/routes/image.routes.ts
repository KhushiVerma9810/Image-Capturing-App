import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { env } from "../config/env.js";
import { imageController } from "../controllers/image.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_IMAGE_SIZE_MB * 1024 * 1024,
  },
});

export const imageRouter = Router();

imageRouter.use(requireAuth);

imageRouter.get(
  "/",
  requirePermission("view_images"),
  asyncHandler(imageController.list),
);
imageRouter.post(
  "/",
  requirePermission("upload_images"),
  upload.single("image"),
  asyncHandler(imageController.create),
);
imageRouter.get(
  "/:id/file",
  requirePermission("view_images"),
  asyncHandler(imageController.download),
);
imageRouter.delete(
  "/:id",
  requirePermission("delete_images"),
  asyncHandler(imageController.remove),
);
