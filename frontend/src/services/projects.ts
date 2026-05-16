import { api } from "@/lib/api";
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  User,
} from "@/types";

export const projectService = {
  list: async (): Promise<Project[]> => {
    const res = await api.get<Project[]>("/projects");
    return res.data;
  },

  get: async (id: string): Promise<Project> => {
    const res = await api.get<Project>(`/projects/${id}`);
    return res.data;
  },

  create: async (data: CreateProjectPayload): Promise<Project> => {
    const res = await api.post<Project>("/projects", data);
    return res.data;
  },

  update: async (id: string, data: UpdateProjectPayload): Promise<Project> => {
    const res = await api.put<Project>(`/projects/${id}`, data);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  addMember: async (projectId: string, userId: string): Promise<void> => {
    await api.post(`/projects/${projectId}/members`, { user_id: userId });
  },

  removeMember: async (
    projectId: string,
    userId: string
  ): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  },

  listMembers: async (projectId: string): Promise<User[]> => {
    const res = await api.get<User[]>(`/projects/${projectId}/members`);
    return res.data;
  },
};
