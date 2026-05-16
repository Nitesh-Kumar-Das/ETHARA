import axios from "axios";
import Cookies from "js-cookie";

const TOKEN_KEY = "ttm_access_token";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally – redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export const getToken = () => Cookies.get(TOKEN_KEY) || null;
export const setToken = (token: string) =>
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: "strict" });
export const removeToken = () => Cookies.remove(TOKEN_KEY);
