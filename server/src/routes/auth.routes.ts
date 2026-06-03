import { Router } from "express";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { authController } from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(authController.login));
authRouter.get("/me", requireAuth, asyncHandler(authController.me));
