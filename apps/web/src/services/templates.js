import api from "./api";

export const getTemplates = () => api.get("/templates");
export const getTemplate = (id) => api.get(`/templates/${id}`);
export const syncTemplates = (whatsappAccountId) => api.post(`/templates/sync/${whatsappAccountId}`);