import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original?._retry || original?.url?.includes("/refresh")) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return Promise.reject(error);

    try {
      original._retry = true;
      if (!refreshing) {
        refreshing = axios.post(
          `${api.defaults.baseURL}/refresh`,
          {},
          { headers: { Authorization: `Bearer ${refreshToken}` } }
        ).finally(() => { refreshing = null; });
      }
      const response = await refreshing;
      localStorage.setItem("access_token", response.data.access_token);
      original.headers.Authorization = `Bearer ${response.data.access_token}`;
      return api(original);
    } catch (refreshError) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      return Promise.reject(refreshError);
    }
  }
);

export default api;
