export type Role = string;

export type RoleDefinition = {
  id: string;
  name: string;
  label: string;
  description: string;
  permissions?: string[];
  isSystem: boolean;
  isVisible: boolean;
  createdAt: string;
};

export type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type PublicUser = {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  permissions?: string[];
};

export type AuthSession = {
  token: string;
  user: PublicUser;
};

export type ImageSummary = {
  id: string;
  userId?: string;
  username: string;
  role: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: string;
  downloadPath: string;
};

export type DashboardSummary = {
  metrics: {
    visibleUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    activeWorkers: number;
    adminRoles: number;
    capturedImages: number;
  };
  chart: Array<{ label: string; value: number }>;
  recentUsers: Array<{
    id: string;
    username: string;
    role: string;
    active: boolean;
    updatedAt: string;
  }>;
  recentImages: Array<{
    id: string;
    username: string;
    role: string;
    originalName: string;
    createdAt: string;
  }>;
};
