import type { ToObjectOptions } from "mongoose";

/**
 * Shared JSON serializer used in every model's `toJSON` option so documents
 * serialize consistently: expose a string `id` (instead of `_id`), drop Mongo
 * internals (`__v`), and strip any sensitive fields (e.g. `passwordHash`).
 *
 * `timestamps`/`versionKey` are kept inline in each schema (as literals) so
 * Mongoose can still infer `createdAt`/`updatedAt` onto the document type.
 */
export function jsonOptions(hiddenFields: string[] = []): ToObjectOptions {
  return {
    virtuals: false,
    transform(_doc, ret) {
      const record = ret as Record<string, unknown> & {
        _id?: { toString(): string };
      };
      record.id = record._id?.toString();
      delete record._id;
      delete record.__v;
      for (const field of hiddenFields) {
        delete record[field];
      }
      return record;
    },
  };
}
