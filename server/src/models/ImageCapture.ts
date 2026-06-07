import {
  Schema,
  model,
  type HydratedDocument,
  type InferSchemaType,
} from "mongoose";
import { jsonOptions } from "./base.js";

const imageCaptureSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    filename: {
      type: String,
      required: true,
    },
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    // Image bytes stored directly in MongoDB (BSON Binary). `select: false`
    // keeps the buffer out of normal reads — it is only loaded for the
    // authenticated download route, never in list queries.
    data: {
      type: Buffer,
      required: true,
      select: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: jsonOptions(["data"]),
  },
);

imageCaptureSchema.index({ user: 1, createdAt: -1 });

export type ImageCapture = InferSchemaType<typeof imageCaptureSchema>;
export type ImageCaptureDocument = HydratedDocument<ImageCapture>;

export const ImageCaptureModel = model("ImageCapture", imageCaptureSchema);
