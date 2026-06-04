import { describe, expect, it } from "vitest";
import { toPublicUser } from "./public-user.js";

describe("toPublicUser", () => {
  it("strips sensitive fields and keeps public metadata", () => {
    const user = toPublicUser({
      _id: "123",
      username: "worker1",
      role: "Worker",
      active: true,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
      lastLoginAt: null
    });

    expect(user).toMatchObject({
      id: "123",
      username: "worker1",
      role: "Worker",
      active: true
    });
  });
});
