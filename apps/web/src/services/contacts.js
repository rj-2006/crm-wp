import api from "./api";

export const getContacts = () => api.get("/contacts");
export const addContact = (contact) => api.post("/contacts", contact);
export const updateContact = (id, updates) => api.patch(`/contacts/${id}`, updates);
export const importContacts = (file) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/contacts/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};