import axios from 'axios';
import { CONFIG } from '../config';

export const fetchInquiries = async () => {
  try {
    const response = await axios.get(`${CONFIG.n8nBaseUrl}/webhook/get-inquiries`, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data || [];
  } catch(e) {
    throw e;
  }
};

export const triggerRFQ = async (deal) => {
  try {
    const response = await axios.post(`${CONFIG.n8nBaseUrl}/webhook/send-rfq`, { deal }, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data;
  } catch(e) {
    throw e;
  }
};

export const triggerBuyerQuote = async (deal) => {
  try {
    const response = await axios.post(`${CONFIG.n8nBaseUrl}/webhook/send-quote`, { deal }, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data;
  } catch(e) {
    throw e;
  }
};

export const updateDealStatus = async (dealId, status) => {
  try {
    const response = await axios.post(`${CONFIG.n8nBaseUrl}/webhook/update-status`, { dealId, status }, {
      headers: { 'Authorization': `Bearer ${CONFIG.n8nSecret}` },
      timeout: 15000
    });
    return response.data;
  } catch(e) {
    throw e;
  }
};
