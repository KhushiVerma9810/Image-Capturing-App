import type { Request, Response } from "express";
import { listImagesQuery } from "../schemas/image.schema.js";
import {
  getImageForUser,
  listImagesForUser,
  removeImageById,
  storeImageCapture,
} from "../services/image.service.js";
import { AppError } from "../utils/app-error.js";

export const imageController = {
  async list(req: Request, res: Response) {
    const query = listImagesQuery.parse(req.query);
    res.json(await listImagesForUser(req.auth!.userId, req.auth!.role, query));
  },

  async create(req: Request, res: Response) {
    if (!req.file) {
      throw new AppError(400, "Image file is required");
    }

    const image = await storeImageCapture({
      userId: req.auth!.userId,
      originalName: req.file.originalname || "capture.jpg",
      mimeType: req.file.mimetype,
      buffer: req.file.buffer,
      size: req.file.size,
    });

    res.status(201).json({
      image: {
        id: image._id.toString(),
        filename: image.filename,
        mimeType: image.mimeType,
        size: image.size,
        createdAt: image.createdAt,
      },
    });
  },

  async download(req: Request, res: Response) {
    const image = await getImageForUser(
      String(req.params.id),
      req.auth!.userId,
      req.auth!.role,
    );
    if (!image.data) {
      throw new AppError(404, "Image file not found");
    }
    const buffer = Buffer.isBuffer(image.data)
      ? image.data
      : Buffer.from(image.data as unknown as ArrayBuffer);

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", image.mimeType);
    res.setHeader("Content-Length", buffer.length.toString());
    res.send(buffer);
  },

  async remove(req: Request, res: Response) {
    const imageId = String(req.params.id);
    await removeImageById(imageId, req.auth!.userId, req.auth!.role);
    res.json({ id: imageId });
  },
};
