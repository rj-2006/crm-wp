import api from "./api";

export const getUsers = () => api.get("/users");
export const createUser = (user) => api.post("/users", user);
export const updateUser = (id, updates) => api.patch(`/users/${id}`, updates);