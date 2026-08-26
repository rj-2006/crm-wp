import api from "./api";

export const getCampaigns = (companyId) => api.get(`/companies/${companyId}/campaigns`);
export const createCampaign = (companyId, campaign) => api.post(`/companies/${companyId}/campaigns`, campaign);
export const executeCampaign = (companyId, campaignId) => api.post(`/companies/${companyId}/campaigns/${campaignId}/execute`);
export const getCampaign = (companyId, campaignId) => api.get(`/companies/${companyId}/campaigns/${campaignId}`);