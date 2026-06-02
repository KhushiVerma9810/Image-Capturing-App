import { Types } from "mongoose";
import { AppError } from "./app-error.js";

export function toObjectId(id: string, label = "Identifier") {
  if (!Types.ObjectId.isValid(id)) {
    throw new AppError(400, `${label} is invalid`);
  }

  return new Types.ObjectId(id);
}
