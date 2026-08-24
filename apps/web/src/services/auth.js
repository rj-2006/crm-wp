import api from "./api";

export const login = (email, password) => api.post("/auth/login", { email, password });
export const logout = () => api.post("/auth/logout");