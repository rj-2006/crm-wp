import api from "./api";

export const getUsers = () => api.get("/users");
export const inviteUser = (user) => api.post("/users/invite", user);
export const updateUser = (id, updates) => api.put(`/users/${id}`, updates);