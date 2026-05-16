import { api, setToken, removeToken } from "@/lib/api";
import {
  AuthResponse,
  LoginCredentials,
  SignupCredentials,
  User,
  UserRole,
} from "@/types";

export const authService = {
  signup: async (data: SignupCredentials): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/signup", data);
    setToken(res.data.access_token);
    return res.data;
  },

  login: async (data: LoginCredentials): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/login", data);
    setToken(res.data.access_token);
    return res.data;
  },

  switchRole: async (role: UserRole): Promise<AuthResponse> => {
    const res = await api.post<AuthResponse>("/auth/switch-role", { role });
    setToken(res.data.access_token);
    return res.data;
  },

  getMe: async (): Promise<User> => {
    const res = await api.get<User>("/auth/me");
    return res.data;
  },

  logout: () => {
    removeToken();
  },
};

export const userService = {
  listUsers: async (): Promise<User[]> => {
    const res = await api.get<User[]>("/users");
    return res.data;
  },
};
