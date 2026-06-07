import { randomUUID } from "node:crypto";
import { ImageCaptureModel } from "../models/ImageCapture.js";
import { UserModel } from "../models/User.js";
import { AppError } from "../utils/app-error.js";
import { toObjectId } from "../utils/object-id.js";
import type { PipelineStage } from "mongoose";

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

  const filename = createStorageName(params.mimeType);

  return await ImageCaptureModel.create({
    user: toObjectId(params.userId, "User id"),
    filename,
    originalName: params.originalName,
    mimeType: params.mimeType,
    size: params.size,
    data: params.buffer,
  });
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
    // Aggregation ignores the schema's `select: false`, so explicitly drop the
    // image bytes here — list results must never carry the buffers.
    { $project: { data: 0 } },
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
  const image = await ImageCaptureModel.findById(imageId)
    .select("+data")
    .populate("user", "username role")
    .lean();
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

export async function deleteImagesForUser(userId: string) {
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

  await image.deleteOne();
}
