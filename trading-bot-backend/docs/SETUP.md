# TradeMind Quotation Dashboard - Setup Guide

Welcome to the TradeMind Quotation Dashboard! This guide will walk you through setting up the n8n automation workflows, configuring the required Google Sheets, and running the application.

## 1. Prerequisites
- **Node.js** (v16+)
- **n8n** (Self-hosted or Cloud)
- **Google Cloud Platform (GCP)** account (for Gemini API and Google Sheets API)
- **Microsoft Azure/Office 365** account (for Outlook Email Trigger and Sending)

## 2. Google Sheets Setup

Create a new Google Sheet to store inquiries and closed deals.

### Tab 1: "Inquiries"
Create the following columns exactly in this order:
- `inquiry_id` (Unique identifier, e.g., INQ-1001)
- `date_received` (ISO date string)
- `buyer_name`
- `buyer_email`
- `products` (JSON array string of requested products)
- `status` (Must be one of: PENDING, RFQ_SENT, QUOTE_SENT, CLOSED)

### Tab 2: "ClosedDeals"
Create the following columns exactly in this order:
- `inquiry_id`
- `date_closed` (ISO date string)
- `buyer_name`
- `products` (Summary of products)
- `seller_cost` (Total cost from seller)
- `my_price` (Total selling price)
- `margin_percent`
- `profit`

## 3. n8n Workflow Configuration

1. Open your n8n instance and create a new workflow.
2. Import the `trading_bot_workflow.json` file from the `workflows/` directory.
3. Configure the **Credentials** for the following nodes:
   - **Microsoft Outlook Triggers / Nodes**: Connect your Microsoft account via OAuth2. Ensure scopes include `Mail.ReadWrite` and `Mail.Send`.
   - **Google Sheets Nodes**: Connect your Google account via OAuth2. Ensure scopes include Google Sheets access. Update the nodes to point to the Document ID of the sheet you created in step 2.
4. Activate the workflow.

### Webhook URLs
The n8n workflow contains several webhook triggers that communicate with the desktop app. You will need to copy the production URLs of these webhooks and add them to your desktop app configuration.
- `GET /webhook/get-inquiries`
- `POST /webhook/send-rfq`
- `POST /webhook/send-quote`
- `POST /webhook/update-status`
- `GET /webhook/get-profit-data`

## 4. Application Configuration

In the root of the project, create a `.env` file (do not commit this file to version control). Add the following variables:

```env
# Gemini Configuration
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GEMINI_MODEL=gemini-2.0-flash

# n8n Webhook Configuration
VITE_N8N_WEBHOOK_BASE_URL=https://your-n8n-instance.com
VITE_N8N_WEBHOOK_SECRET=your_secure_random_string

# Application Default Settings
VITE_BUSINESS_NAME="TradeMind Sourcing"
VITE_BUSINESS_EMAIL="contact@trademind.com"
VITE_SELLER_EMAIL="supplier@example.com"
VITE_DEFAULT_MARGIN=50
VITE_GOOGLE_SHEET_ID=your_google_sheet_id
```

## 5. Security Notes
- **API Keys**: Ensure your `.env` file is in your `.gitignore`.
- **Webhook Security**: Set the `VITE_N8N_WEBHOOK_SECRET` to a strong, random string. This is used as a Bearer token in the app's requests to n8n to ensure only your app can trigger the webhooks. Add an Header Auth credential to your n8n Webhook nodes to validate this token.

## 6. Building and Running

To run the application locally in development mode:
```bash
npm install
npm run dev
```

To build the production application (creates a desktop executable for your OS):
```bash
npm run build
```
Once the build is complete, you can find the executable (e.g., `.exe` for Windows, `.dmg`/`.app` for macOS) in the `dist` or `build` folder.

## 7. Troubleshooting

- **Sync Pending Indicator**: If the app fails to reach n8n or Google Sheets (e.g., due to an internet outage), an amber dot will appear in the sidebar indicating a pending sync. The app will automatically save your actions locally in `electron-store` and retry the operations in the background every 10 minutes.
- **n8n Webhook Errors**: Ensure your `VITE_N8N_WEBHOOK_BASE_URL` exactly matches your n8n instance and does not include a trailing slash. Confirm your webhook nodes are set to accept `POST`/`GET` as expected.
