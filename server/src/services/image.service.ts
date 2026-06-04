import path from "node:path";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { env } from "../config/env.js";
import { serverRoot } from "../utils/app-paths.js";
import { ImageCaptureModel } from "../models/ImageCapture.js";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { ensureDirectory, removeFileIfExists } from "../utils/file-system.js";
import { toObjectId } from "../utils/object-id.js";
import type { PipelineStage } from "mongoose";

function imageDirectory() {
  return path.resolve(serverRoot, env.UPLOAD_DIR, "images");
}

function createStorageName(mimeType: string) {
  const extension = mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";
  return `capture-${Date.now()}-${randomUUID()}.${extension}`;
}

export async function storeImageCapture(params: {
  userId: string;
  originalName: string;
  mimeType: string;
  buffer: Buffer;
  size: number;
}) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(params.mimeType)) {
    throw new AppError(400, "Only JPEG, PNG, and WEBP images are supported");
  }

  const user = await UserModel.findById(toObjectId(params.userId, "User id"));
  if (!user) {
    throw new AppError(404, "User not found");
  }

  const directory = imageDirectory();
  await ensureDirectory(directory);

  const filename = createStorageName(params.mimeType);
  const storagePath = path.join(directory, filename);

  await fs.writeFile(storagePath, params.buffer);

  try {
    return await ImageCaptureModel.create({
      user: toObjectId(params.userId, "User id"),
      filename,
      originalName: params.originalName,
      mimeType: params.mimeType,
      size: params.size,
      storagePath
    });
  } catch (error) {
    await removeFileIfExists(storagePath);
    throw error;
  }
}

export async function listImagesForUser(
  userId: string,
  role: string,
  params: { search?: string; page: number; limit: number }
) {
  const match: Record<string, unknown> = {};
  if (role !== "Admin") {
    match.user = toObjectId(userId, "User id");
  }

  const search = params.search?.trim();
  const pipeline: PipelineStage[] = [
    { $match: match },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    }
  ];

  if (search) {
    pipeline.push({
      $match: {
        $or: [
          { originalName: { $regex: search, $options: "i" } },
          { filename: { $regex: search, $options: "i" } },
          { "user.username": { $regex: search, $options: "i" } },
          { "user.role": { $regex: search, $options: "i" } }
        ]
      }
    });
  }

  const countPipeline: PipelineStage[] = [...pipeline, { $count: "total" }];
  const docsPipeline: PipelineStage[] = [
    ...pipeline,
    { $sort: { createdAt: -1 } },
    { $skip: (params.page - 1) * params.limit },
    { $limit: params.limit }
  ];

  const [countResult, documents] = await Promise.all([
    ImageCaptureModel.aggregate(countPipeline),
    ImageCaptureModel.aggregate(docsPipeline)
  ]);

  const total = countResult[0]?.total ?? 0;

  return {
    images: documents.map((image) => ({
      id: image._id.toString(),
      userId: image.user?._id?.toString(),
      username: image.user?.username ?? "",
      role: image.user?.role ?? "",
      filename: image.filename,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      createdAt: image.createdAt,
      downloadPath: `/api/images/${image._id}/file`
    })),
    pagination: {
      total,
      page: params.page,
      limit: params.limit,
      totalPages: Math.max(1, Math.ceil(total / params.limit))
    }
  };
}

export async function getImageForUser(imageId: string, userId: string, role: string) {
  toObjectId(imageId, "Image id");
  const image = await ImageCaptureModel.findById(imageId).populate("user", "username role").lean();
  if (!image) {
    throw new AppError(404, "Image not found");
  }

  const ownerId =
    image.user && typeof image.user === "object"
      ? (image.user as { _id: { toString(): string } })._id.toString()
      : "";

  if (role !== "Admin" && ownerId !== userId) {
    throw new AppError(403, "You do not have access to this image");
  }

  return image;
}

export async function readImageFile(imagePath: string) {
  try {
    return await fs.readFile(imagePath);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      throw new AppError(404, "Image file not found");
    }

    throw error;
  }
}

export async function deleteImagesForUser(userId: string) {
  const images = await ImageCaptureModel.find({ user: toObjectId(userId, "User id") });
  await Promise.all(images.map((image) => removeFileIfExists(image.storagePath)));
  await ImageCaptureModel.deleteMany({ user: toObjectId(userId, "User id") });
}

export async function removeImageById(imageId: string, userId: string, role: string) {
  toObjectId(imageId, "Image id");
  toObjectId(userId, "User id");
  const image = await ImageCaptureModel.findById(imageId);
  if (!image) {
    throw new AppError(404, "Image not found");
  }

  const canDelete = role === "Admin" || image.user.toString() === userId;
  if (!canDelete) {
    throw new AppError(403, "You do not have access to this image");
  }

  await removeFileIfExists(image.storagePath);
  await image.deleteOne();
}
