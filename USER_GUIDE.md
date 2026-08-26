# User & Admin Guide

Welcome to the Bharat Infotechs CRM + WhatsApp Bulk Messaging System! This guide will walk you through the core features of the platform, whether you are a Sales/Support Staff member or a System Administrator.

---

## For Sales & Support Staff

### 1. Managing Contacts
The **Contacts Directory** is your central hub for managing customers and leads.
- **Adding a Contact:** Click the `+` button (or "Add Contact") to manually enter a new lead's details (Name, Phone Number, Consent Status).
- **Importing Contacts:** Click "Import CSV" to bulk-upload contacts. The system automatically skips empty rows and deduplicates existing phone numbers. Ensure your CSV has headers for Name and Phone.
- **Tagging:** Use Tags (e.g., "VIP", "Kerala", "Retailer") to group contacts. Tags are displayed on each contact's card and are crucial for targeting bulk campaigns.

### 2. Sending 1:1 Messages
You can send an individual WhatsApp message to a specific contact directly from the CRM.
1. Locate the contact in the Contacts Directory.
2. Hover over their row and click the **Send** button.
3. Select an approved message template from the dropdown.
4. Click **Send Message**.
*(Note: You cannot send messages to contacts whose consent status is "Opted out".)*

### 3. Launching a Campaign
To send a bulk message to a group of contacts:
1. Navigate to the **Campaigns** tab and click **New Campaign**.
2. **Audience:** Select the tags you want to target. For example, selecting "VIP" will target all opted-in contacts with that tag.
3. **Template:** Choose an approved WhatsApp message template.
4. **Preview:** Review the message content and the exact number of eligible recipients.
5. **Launch:** Click "Launch campaign". The system will queue the messages and send them at a rate-limited pace to comply with WhatsApp API policies.

---

## For Administrators

### 1. User Management
Administrators have access to the **Admin** tab to manage staff accounts.
- Here you can create new user accounts, assign roles (Admin vs. Staff), and revoke access.
- *Tip: Ensure all users have strong passwords, as they have access to customer data.*

### 2. WhatsApp Account Configuration
Before campaigns can be launched, the WhatsApp Business API must be connected.
- Navigate to the **Settings** (or Admin config area).
- Ensure the `WhatsApp Phone Number ID` and `Access Token` are correctly configured.
- The webhook URL must be registered in your Meta App Dashboard to receive delivery receipts and inbound messages.

### 3. Template Management
The **Templates** tab shows all message templates synced from your WhatsApp Business account.
- **Approved:** These templates can be used freely for 1:1 messages and bulk campaigns.
- **Pending/Rejected:** These cannot be selected by staff until Meta approves them.
- *Note: Template creation and approval happens within the Meta WhatsApp Manager, not directly inside this CRM.*

### 4. Reporting & Analytics
The **Dashboard** and **Reports** tabs provide high-level metrics:
- **Campaign Status:** Track how many messages were Sent, Delivered, Read, or Failed.
- **Consent Tracking:** Monitor your total audience size versus your "Opted-in" reach.
- Use these insights to refine your messaging strategy and ensure high deliverability rates.
