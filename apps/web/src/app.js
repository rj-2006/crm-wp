import { api } from './api.js';

// DOM Elements
const views = document.querySelectorAll('.view');
const navItems = document.querySelectorAll('.nav-item');
const globalMetricsGrid = document.getElementById('global-metrics-grid');
const campaignsTableBody = document.getElementById('campaigns-table-body');

// Modals
const campaignModal = document.getElementById('campaign-modal');
const btnNewCampaign = document.getElementById('btn-new-campaign');
const btnCloseModal = document.getElementById('btn-close-modal');
const formCampaign = document.getElementById('form-campaign');

// State
let campaigns = [];

// ==========================================
// Initialization
// ==========================================
async function init() {
    try {
        // Initial Boot
        // Hardcoded login for demo purposes
        await api.login('admin@test.com', 'password123');
        console.log('Logged in successfully!');
        
        // Load initial view
        await loadDashboard();
        
    } catch (err) {
        console.error('Failed to initialize app:', err);
        alert('Initialization failed. Ensure the backend is running and the admin@test.com user exists.');
    }
}

// ==========================================
// Navigation
// ==========================================
navItems.forEach(item => {
    item.addEventListener('click', async (e) => {
        if (item.classList.contains('disabled')) return;
        
        // Update active class
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Switch view
        const viewId = item.dataset.view;
        views.forEach(view => view.classList.add('hidden'));
        document.getElementById(`view-${viewId}`).classList.remove('hidden');

        // Load data based on view
        if (viewId === 'dashboard') {
            await loadDashboard();
        } else if (viewId === 'campaigns') {
            await loadCampaigns();
        } else if (viewId === 'contacts') {
            await loadContacts();
        }
    });
});

// ==========================================
// Dashboard View
// ==========================================
async function loadDashboard() {
    try {
        const report = await api.getGlobalMetrics();
        const { metrics, rates } = report;
        
        globalMetricsGrid.innerHTML = `
            <div class="metric-card glass-panel">
                <div class="metric-title">Total Messages Sent</div>
                <div class="metric-value">${metrics.sent}</div>
                <div class="metric-trend">Across ${report.totalCampaigns} campaigns</div>
            </div>
            <div class="metric-card glass-panel">
                <div class="metric-title">Delivery Rate</div>
                <div class="metric-value">${rates.globalDeliveryRate.toFixed(1)}%</div>
                <div class="metric-trend">Total delivered: ${metrics.delivered}</div>
            </div>
            <div class="metric-card glass-panel">
                <div class="metric-title">Read Rate</div>
                <div class="metric-value">${rates.globalReadRate.toFixed(1)}%</div>
                <div class="metric-trend">Total read: ${metrics.read}</div>
            </div>
        `;
    } catch (err) {
        console.error('Failed to load dashboard:', err);
        globalMetricsGrid.innerHTML = `<div class="error">Failed to load metrics.</div>`;
    }
}

// ==========================================
// Campaigns View
// ==========================================
async function loadCampaigns() {
    try {
        const response = await api.getCampaigns();
        campaigns = response.data;
        renderCampaignsTable();
    } catch (err) {
        console.error('Failed to load campaigns:', err);
        campaignsTableBody.innerHTML = `<tr><td colspan="6">Error loading campaigns.</td></tr>`;
    }
}

function renderCampaignsTable() {
    if (campaigns.length === 0) {
        campaignsTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 40px;">No campaigns found. Create one!</td></tr>`;
        return;
    }

    campaignsTableBody.innerHTML = campaigns.map(c => {
        const statusClass = `badge-${c.status.toLowerCase()}`;
        
        // Execute button only available for DRAFT campaigns
        const actionBtn = c.status === 'DRAFT' 
            ? `<button class="btn btn-action" onclick="executeCampaign('${c.id}')">Execute 🚀</button>`
            : `<span style="color: var(--text-muted); font-size: 0.8rem;">Locked</span>`;

        return `
            <tr>
                <td style="font-weight: 500;">${c.name}</td>
                <td><span class="badge ${statusClass}">${c.status}</span></td>
                <td>${c.totalRecipients}</td>
                <td>${c.deliveredCount}</td>
                <td style="color: var(--brand-danger);">${c.failedCount}</td>
                <td>${actionBtn}</td>
            </tr>
        `;
    }).join('');
}

// Expose execute function globally so inline onclick handlers can access it
window.executeCampaign = async (campaignId) => {
    try {
        await api.executeCampaign(campaignId);
        alert('Campaign queued for execution!');
        await loadCampaigns(); // refresh table
    } catch (err) {
        alert('Failed to execute campaign: ' + err.message);
    }
};

// ==========================================
// Contacts View
// ==========================================
async function loadContacts() {
    const tbody = document.getElementById('contacts-table-body');
    try {
        const contacts = await api.getContacts();
        
        if (!contacts || contacts.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding: 40px;">No contacts found.</td></tr>`;
            return;
        }

        tbody.innerHTML = contacts.map(c => {
            const tags = c.tags ? c.tags.map(t => `<span class="badge">${t.tag.name}</span>`).join(' ') : '';
            return `
                <tr>
                    <td style="font-weight: 500;">${c.phone}</td>
                    <td><span class="badge badge-${c.consentStatus.toLowerCase()}">${c.consentStatus}</span></td>
                    <td>${tags}</td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Failed to load contacts:', err);
        tbody.innerHTML = `<tr><td colspan="3">Error loading contacts.</td></tr>`;
    }
}

// ==========================================
// Modals & Forms
// ==========================================
btnNewCampaign.addEventListener('click', async () => {
    campaignModal.classList.remove('hidden');
    
    // Load dropdowns dynamically
    try {
        const [tplRes, accRes, tagRes] = await Promise.all([
            api.getTemplates(),
            api.getAccounts(),
            api.getTags()
        ]);
        
        const selTemplate = document.getElementById('input-camp-template');
        const selAccount = document.getElementById('input-camp-account');
        const selTag = document.getElementById('input-camp-tag');
        
        selTemplate.innerHTML = '<option value="">Select a Template</option>' + 
            tplRes.map(t => `<option value="${t.id}">${t.name} (${t.approvalStatus})</option>`).join('');
            
        selAccount.innerHTML = '<option value="">Select an Account</option>' + 
            accRes.map(a => `<option value="${a.id}">${a.name} (${a.phoneNumberId})</option>`).join('');
            
        selTag.innerHTML = '<option value="">Select a Segment</option>' + 
            tagRes.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
            
    } catch (err) {
        console.error('Error loading dropdowns', err);
    }
});

btnCloseModal.addEventListener('click', () => {
    campaignModal.classList.add('hidden');
});

formCampaign.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const dto = {
        name: document.getElementById('input-camp-name').value,
        templateId: document.getElementById('input-camp-template').value,
        whatsappAccountId: document.getElementById('input-camp-account').value,
        segmentFilter: { tagId: document.getElementById('input-camp-tag').value }
    };

    try {
        await api.createCampaign(dto);
        alert('Draft campaign created successfully!');
        campaignModal.classList.add('hidden');
        formCampaign.reset();
        await loadCampaigns(); // Refresh list
    } catch (err) {
        alert('Failed to create campaign: ' + err.message);
    }
});

// Boot the app
init();
