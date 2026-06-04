import type {
  AuthSession,
  DashboardSummary,
  ImageSummary,
  Pagination,
  PublicUser,
  Role,
  RoleDefinition,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function getSession(): AuthSession | null {
  const raw = localStorage.getItem("session");
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem("session");
    return null;
  }
}

export function getToken() {
  return getSession()?.token ?? null;
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const token = getToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as {
        message?: string;
        errors?: {
          fieldErrors?: Record<string, string[]>;
          formErrors?: string[];
        };
      };

    
      const fieldMessages = body.errors?.fieldErrors
        ? Object.values(body.errors.fieldErrors).flat()
        : [];
      const formMessages = body.errors?.formErrors ?? [];
      const detail = [...fieldMessages, ...formMessages].filter(Boolean);

      if (detail.length > 0) {
        message = detail.join(" ");
      } else if (body.message) {
        message = body.message;
      }
    } catch {
      throw new ApiError(response.status, message);
    }

    if (response.status === 401 && !path.startsWith("/api/auth/")) {
      clearSession();
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== "/login"
      ) {
        window.location.assign("/login");
      }
    }

    throw new ApiError(response.status, message);
  }

  return (await response.json()) as T;
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: PublicUser }>("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
}

export async function fetchCurrentUser() {
  return request<{ user: PublicUser }>("/api/auth/me");
}

export async function listUsers(params?: {
  search?: string;
  page?: number;
  limit?: number;
  role?: string;
  status?: "active" | "inactive";
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.role) query.set("role", params.role);
  if (params?.status) query.set("status", params.status);
  const path = query.toString()
    ? `/api/admin/users?${query.toString()}`
    : "/api/admin/users";
  return request<{ users: PublicUser[]; pagination: Pagination }>(path);
}

export async function createUser(payload: {
  username: string;
  password: string;
  role: string;
}) {
  return request<{ user: PublicUser }>("/api/admin/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  id: string,
  payload: { role?: Role; active?: boolean; password?: string },
) {
  return request<{ user: PublicUser }>(`/api/admin/users/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string) {
  return request<{ id: string }>(`/api/admin/users/${id}`, {
    method: "DELETE",
  });
}

export async function listImages(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const path = query.toString()
    ? `/api/images?${query.toString()}`
    : "/api/images";
  return request<{ images: ImageSummary[]; pagination: Pagination }>(path);
}

export async function uploadImage(file: Blob, fileName = "capture.jpg") {
  const formData = new FormData();
  formData.append("image", file, fileName);

  return request<{
    image: {
      id: string;
      filename: string;
      mimeType: string;
      size: number;
      createdAt: string;
    };
  }>("/api/images", {
    method: "POST",
    body: formData,
  });
}

export async function fetchImageBlob(id: string) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}/api/images/${id}/file`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new ApiError(response.status, "Failed to load image");
  }

  return response.blob();
}

export async function fetchDashboardSummary(search?: string) {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  return request<DashboardSummary>(`/api/admin/summary${query}`);
}

export async function listRoles(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  const path = query.toString()
    ? `/api/roles?${query.toString()}`
    : "/api/roles";
  return request<{ roles: RoleDefinition[]; pagination: Pagination }>(path);
}

export async function listAssignableRoles() {
  return request<{ roles: RoleDefinition[] }>("/api/roles/assignable");
}

export async function listPermissions() {
  return request<{
    permissions: Array<{
      id: string;
      name: string;
      label: string;
      description: string;
      isSystem: boolean;
      isVisible: boolean;
    }>;
    pagination: Pagination;
  }>("/api/permissions?limit=50");
}

export async function createRole(payload: {
  name: string;
  label: string;
  description: string;
  permissions?: string[];
}) {
  return request<{ role: RoleDefinition }>("/api/roles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export function persistSession(session: AuthSession) {
  localStorage.setItem("session", JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem("session");
}

export function readSession() {
  return getSession();
}
