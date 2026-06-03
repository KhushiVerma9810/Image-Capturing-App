import { ImageCaptureModel } from "../models/ImageCapture.js";
import { UserModel } from "../models/User.js";
import type { PipelineStage } from "mongoose";

function shiftDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function imagePipeline(role: string, search?: string) {
  const pipeline: PipelineStage[] = [
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

  if (search?.trim()) {
    pipeline.push({
      $match: {
        $or: [
          { originalName: { $regex: search.trim(), $options: "i" } },
          { "user.username": { $regex: search.trim(), $options: "i" } },
          { "user.role": { $regex: search.trim(), $options: "i" } }
        ]
      }
    });
  }

  return pipeline;
}

export async function getDashboardSummary(role: string, search?: string) {
  const userSearch = search?.trim();

  const [totalUsers, activeUsers, inactiveUsers, activeWorkers, adminRoles, recentUsers] = await Promise.all([
    UserModel.countDocuments(),
    UserModel.countDocuments({ active: true }),
    UserModel.countDocuments({ active: false }),
    UserModel.countDocuments({ role: { $regex: "^worker$", $options: "i" }, active: true }),
    UserModel.countDocuments({ role: { $regex: "^admin$", $options: "i" } }),
    UserModel.find(
      userSearch
        ? {
            $or: [
              { username: { $regex: userSearch, $options: "i" } },
              { role: { $regex: userSearch, $options: "i" } }
            ]
          }
        : {}
    )
    .sort({ updatedAt: -1 })
    .limit(3)
    .lean()
  ]);

  const visibleImagesPipeline = imagePipeline(role, search);
  const [countResult, recentImages] = await Promise.all([
    ImageCaptureModel.aggregate([...visibleImagesPipeline, { $count: "total" }]),
    ImageCaptureModel.aggregate([...visibleImagesPipeline, { $sort: { createdAt: -1 } }, { $limit: 3 }])
  ]);

  const chart = await Promise.all(
    Array.from({ length: 7 }, async (_value, index) => {
      const dayOffset = 6 - index;
      const start = shiftDays(new Date(), -dayOffset);
      const end = shiftDays(new Date(), -(dayOffset - 1));
      const dayCount = await ImageCaptureModel.aggregate([
        ...imagePipeline(role),
        {
          $match: {
            createdAt: { $gte: start, $lt: end }
          }
        },
        { $count: "total" }
      ]);

      return {
        label: start.toLocaleDateString(undefined, { weekday: "short" }).toUpperCase(),
        value: dayCount[0]?.total ?? 0
      };
    })
  );

  return {
    metrics: {
      visibleUsers: totalUsers,
      activeUsers,
      inactiveUsers,
      activeWorkers,
      adminRoles,
      capturedImages: countResult[0]?.total ?? 0
    },
    chart,
    recentUsers: recentUsers.map((user) => ({
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      active: user.active,
      updatedAt: user.updatedAt
    })),
    recentImages: recentImages.map((image) => ({
      id: image._id.toString(),
      username: image.user?.username ?? "",
      role: image.user?.role ?? "",
      originalName: image.originalName,
      createdAt: image.createdAt
    }))
  };
}
