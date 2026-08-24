import api from "./api";

export const getCampaigns = () => api.get("/campaigns");
export const createCampaign = (campaign) => api.post("/campaigns", campaign);
export const launchCampaign = (id) => api.post(`/campaigns/${id}/launch`);
export const getCampaignStats = (id) => api.get(`/campaigns/${id}/stats`);