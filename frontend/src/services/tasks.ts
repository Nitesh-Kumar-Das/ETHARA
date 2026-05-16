import { api } from "@/lib/api";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
  DashboardStats,
} from "@/types";

interface TaskFilters {
  project_id?: string;
  status?: TaskStatus;
  priority?: string;
  assignee_id?: string;
  overdue?: boolean;
}

export const taskService = {
  list: async (filters: TaskFilters = {}): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters.project_id) params.append("project_id", filters.project_id);
    if (filters.status) params.append("status", filters.status);
    if (filters.priority) params.append("priority", filters.priority);
    if (filters.assignee_id) params.append("assignee_id", filters.assignee_id);
    if (filters.overdue !== undefined)
      params.append("overdue", String(filters.overdue));

    const res = await api.get<Task[]>(`/tasks?${params.toString()}`);
    return res.data;
  },

  myTasks: async (): Promise<Task[]> => {
    const res = await api.get<Task[]>("/tasks/my-tasks");
    return res.data;
  },

  get: async (id: string): Promise<Task> => {
    const res = await api.get<Task>(`/tasks/${id}`);
    return res.data;
  },

  create: async (data: CreateTaskPayload): Promise<Task> => {
    const res = await api.post<Task>("/tasks", data);
    return res.data;
  },

  update: async (id: string, data: UpdateTaskPayload): Promise<Task> => {
    const res = await api.put<Task>(`/tasks/${id}`, data);
    return res.data;
  },

  updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
    const res = await api.patch<Task>(`/tasks/${id}/status`, { status });
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },
};

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>("/dashboard/stats");
    return res.data;
  },
};
