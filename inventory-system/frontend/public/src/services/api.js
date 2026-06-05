import axios from "axios";

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || "") + "/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — normalise error messages
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const detail = err.response?.data?.detail;
    if (typeof detail === "string") {
      err.message = detail;
    } else if (typeof detail === "object" && detail?.message) {
      err.message = detail.message;
    } else {
      err.message = "An unexpected error occurred.";
    }
    return Promise.reject(err);
  }
);

export default api;