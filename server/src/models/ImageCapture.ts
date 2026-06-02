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
    storagePath: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    toJSON: jsonOptions(),
  },
);

imageCaptureSchema.index({ user: 1, createdAt: -1 });

export type ImageCapture = InferSchemaType<typeof imageCaptureSchema>;
export type ImageCaptureDocument = HydratedDocument<ImageCapture>;

export const ImageCaptureModel = model("ImageCapture", imageCaptureSchema);
