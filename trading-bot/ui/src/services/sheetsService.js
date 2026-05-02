import axios from 'axios';
import { CONFIG } from '../config';

export const fetchProfitData = async () => {
  try {
    const response = await axios.get(`${CONFIG.n8nBaseUrl}/webhook/get-profit-data`, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data || { closedDeals: [], weeklyTrend: [] };
  } catch (error) {
    console.error("Error fetching profit data from webhook:", error);
    return null;
  }
};

export const logQuoteSent = async (deal) => {
  try {
    // Legacy fallback, logic should ideally route through webhooks now
    const response = await axios.post(`${CONFIG.n8nBaseUrl}/webhook/update-status`, { dealId: deal.inquiry_id, status: 'QUOTE_SENT' }, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data;
  } catch (e) {
    if (window.electronStore) {
      const failed = await window.electronStore.get('failed_writes') || [];
      failed.push({ type: 'logQuoteSent', payload: deal, timestamp: Date.now() });
      await window.electronStore.set('failed_writes', failed);
    }
    return { success: false, storedLocally: true };
  }
};
