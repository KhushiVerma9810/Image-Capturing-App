type UserLike = {
  _id: { toString(): string } | string;
  username?: unknown;
  role?: unknown;
  active?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  lastLoginAt?: unknown;
};

export function toPublicUser(user: UserLike) {
  return {
    id: user._id.toString(),
    username: String(user.username),
    role: typeof user.role === "string" ? user.role : "Worker",
    active: Boolean(user.active),
    lastLoginAt: user.lastLoginAt instanceof Date ? user.lastLoginAt : null,
    createdAt: user.createdAt instanceof Date ? user.createdAt : new Date(),
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt : new Date(),
  };
}
