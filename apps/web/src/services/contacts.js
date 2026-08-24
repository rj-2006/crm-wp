import api from "./api";

export const getContacts = () => api.get("/contacts");
export const addContact = (contact) => api.post("/contacts", contact);
export const updateContact = (id, updates) => api.put(`/contacts/${id}`, updates);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);