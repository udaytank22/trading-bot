# Trading Bot Project Flow Documentation

## 1. Overview
The **Trading Bot Dashboard** is a comprehensive CRM and business management tool designed to streamline the workflow of receiving buyer inquiries, managing supplier communications (RFQs), calculating margins, and tracking profitability. It provides a centralized interface for traders to manage the entire lifecycle of a deal.

---

## 2. Tech Stack
- **Frontend Framework**: [React](https://reactjs.org/) (v18+)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Routing**: [React Router](https://reactrouter.com/) (using `HashRouter`)
- **Charts**: [Recharts](https://recharts.org/)
- **State Management**: React Context API (`AppContext`)
- **Icons/UI Components**: [Lucide React](https://lucide.dev/) and custom Tailwind-based components

---

## 3. Core Architecture

### Directory Structure
- `src/components`: Reusable UI components (Layout, UI, Modals, etc.)
- `src/pages`: Main application views (Dashboard, Inquiries, Profit, etc.)
- `src/services`: Business logic and external integrations.
- `src/context.js`: Global state management.
- `src/config.js`: Application settings and environment variables.
- `src/data`: Mock data for development and demonstration.

### Services
1.  **Margin Engine (`src/services/marginEngine.js`)**: 
    -   The "brain" of the application.
    -   Calculates final prices for buyers based on seller costs.
    -   Implements multi-rule markup logic:
        -   **Category-based**: Different margins for different product types (e.g., Fasteners at 18%, Pipes at 12%).
        -   **Price-tier**: Higher margins for lower-priced items and vice versa.
        -   **Quantity-discount**: Automatic discounts for bulk orders (e.g., >5000 units).
2.  **n8n Service (`src/services/n8nService.js`)**:
    -   Interface for automation triggers (sending RFQs, updating statuses).
3.  **Sheets Service (`src/services/sheetsService.js`)**:
    -   Handles data persistence and fetching from Google Sheets (currently uses mock data).

---

## 4. Operational Flow (The Lifecycle of a Deal)

### Phase 1: Inquiry Ingestion
- Inquiries are received (simulated via `mockInquiries.js`).
- Each inquiry contains buyer details, product requirements, and a status (initially `PENDING`).
- They appear on the **Dashboard** (as "Recent Inquiries") and the **Inquiries Page**.

### Phase 2: Processing (The Status Pipeline)
The system moves deals through several statuses:
1.  **PENDING**: New inquiry received. Action: **Send RFQ** to suppliers.
2.  **RFQ_SENT**: Request for Quote has been sent to potential suppliers.
3.  **RFQ_RECEIVED**: Supplier has provided pricing.
4.  **QUOTE_SENT**: The user has calculated the final price (using the Margin Engine) and sent a formal quote to the buyer.
5.  **CONFIRMED/CLOSED**: Buyer accepted the quote. The deal is moved to the **Supply Page** for logistics management.

### Phase 3: Pricing & Margin Calculation
When a user prepares a quote:
- The **Margin Engine** calculates the `applied_margin_percent`.
- It rounds prices up to the nearest 10 for professional pricing.
- Users can manually override margins or apply specific discounts.

### Phase 4: Analytics & Tracking
- **Profit Tracking**: Every closed deal logs its profit.
- **Dashboard Metrics**: Real-time stats on today's inquiries, quotes sent, and total profit.
- **Visual Trends**: The **Profit Page** shows weekly trends using bar charts to visualize business growth.

---

## 5. Page Breakdown

### [Dashboard](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/DashboardPage.jsx)
- **Stats Grid**: Quick glance at Today's Inquiries, Quotes Sent, Pending Replies, and Total Profit.
- **Recent Inquiries**: A table showing the 5 most recent activities.
- **Weekly Trend**: A bar chart visualizing profit over the last 7 days.

### [Inquiries](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/InquiriesPage.jsx)
- **Central Management**: View all inquiries with advanced filtering (status, date, search).
- **Deal Drawer**: Detailed view of a specific inquiry, including product lists and history.
- **Action Buttons**: Context-aware actions like "Send RFQ", "Prepare Quote", or "Confirm Deal".

### [Supply](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/SupplyPage.jsx)
- **Logistics View**: Once a deal is confirmed, it moves here.
- **Tracking**: Manage supplier assignments, destination tracking, and delivery status.

### [Profit](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/ProfitPage.jsx)
- **Financial Overview**: Detailed breakdown of closed deals.
- **Metrics**: Total Revenue, Total Cost, Total Profit, and Average Margin.

### [Settings](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/SettingsPage.jsx)
- **Identity Management**: Configure Seller Email, Business Name, and Default Margins.
- **Persistence**: Settings are saved to `localStorage` for continuity across sessions.

### [Login](file:///c:/Users/HP/Desktop/trading-bot/trading-bot/src/pages/LoginPage.jsx)
- **Secure Access**: A premium glassmorphic entry point for the application.
- **Form Validation**: Standard email and password validation with visual feedback.
- **Session Management**: Redirects users to the dashboard upon successful entry.

---

## 6. How to Configure
The application uses environment variables for default settings:
- `VITE_SELLER_EMAIL`: Default email for sending quotes.
- `VITE_BUSINESS_NAME`: Your company name.
- `VITE_DEFAULT_MARGIN`: Fallback margin percentage.

These can be overridden in the **Settings** page within the app.
