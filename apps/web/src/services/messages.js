import api from "./api";

// 1:1 individual message send
export const sendMessage = ({ contactId, templateId, variables }) =>
  api.post(`/messages`, { contactId, templateId, variables });

// Message history for a specific contact
export const getContactMessages = (contactId) =>
  api.get(`/messages/contact/${contactId}`);

// Tags
export const getTags = () => api.get(`/tags`);
export const createTag = (name) => api.post(`/tags`, { name });
export const addTagToContact = (contactId, tagId) => api.post(`/contacts/${contactId}/tags/${tagId}`);
