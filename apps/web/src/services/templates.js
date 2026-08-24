import api from "./api";

export const getTemplates = () => api.get("/templates");
export const createTemplate = (template) => api.post("/templates", template);
export const updateTemplate = (id, updates) => api.put(`/templates/${id}`, updates);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);