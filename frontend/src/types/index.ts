// ─── User Types ───────────────────────────────────────────────────────────────

export type UserRole = "ADMIN" | "TASKER";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  active_role: UserRole;
  is_active: boolean;
  avatar_url?: string | null;
  created_at: string;
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  active_role: UserRole;
  exp: number;
  iat: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  email: string;
  full_name: string;
  password: string;
  role?: UserRole;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ─── Project Types ────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  color: string;
  is_active: boolean;
  owner_id?: string | null;
  owner?: User | null;
  members: User[];
  task_count?: number;
  created_at: string;
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  color?: string;
  is_active?: boolean;
}

// ─── Task Types ───────────────────────────────────────────────────────────────

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  project_id: string;
  project?: Project | null;
  assignee_id?: string | null;
  assignee?: User | null;
  creator_id?: string | null;
  creator?: User | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  project_id: string;
  assignee_id?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  assignee_id?: string | null;
}

// ─── Dashboard Types ──────────────────────────────────────────────────────────

export interface DashboardStats {
  total_projects: number;
  total_tasks: number;
  completed_tasks: number;
  in_progress_tasks: number;
  overdue_tasks: number;
  todo_tasks: number;
  total_members: number;
  completion_rate: number;
}

// ─── API Error ────────────────────────────────────────────────────────────────

export interface ApiError {
  detail: string;
}
