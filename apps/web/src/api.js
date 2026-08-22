const API_BASE = 'http://localhost:3000/api';

let authToken = null;
let companyId = null;
let userId = null;

// Helper for authenticated requests
async function fetchWithAuth(url, options = {}) {
    if (!authToken) {
        throw new Error('Not authenticated');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...(options.headers || {})
    };

    const response = await fetch(`${API_BASE}${url}`, { ...options, headers });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'API request failed');
    }

    // Some endpoints (like execution) might just return 200 OK or 201 without body
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

export const api = {
    // We'll call this once at startup
    async login(email, password) {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) throw new Error('Login failed');
        
        const data = await res.json();
        authToken = data.accessToken;
        companyId = data.user.companyId;
        userId = data.user.id;
        
        return data.user;
    },

    getCompanyId() {
        return companyId;
    },

    getUserId() {
        return userId;
    },

    async getGlobalMetrics() {
        return fetchWithAuth(`/companies/${companyId}/reports/global`);
    },

    async getCampaigns() {
        return fetchWithAuth(`/companies/${companyId}/campaigns`);
    },

    async createCampaign(dto) {
        return fetchWithAuth(`/companies/${companyId}/campaigns`, {
            method: 'POST',
            body: JSON.stringify(dto)
        });
    },

    async executeCampaign(campaignId) {
        return fetchWithAuth(`/companies/${companyId}/campaigns/${campaignId}/execute`, {
            method: 'POST'
        });
    },

    async getContacts() {
        return fetchWithAuth(`/contacts`);
    },

    async getTags() {
        return fetchWithAuth(`/tags`);
    },

    async getTemplates() {
        return fetchWithAuth(`/templates`);
    },

    async getAccounts() {
        return fetchWithAuth(`/whatsapp/accounts`);
    }
};
