import { mockInquiries } from '@data/mockInquiries';
import { USE_MOCK, apiGet, apiPost } from './apiClient';

export const fetchInquiries = async () => {
  if (USE_MOCK) return mockInquiries;
  return apiGet('/webhook/inquiries');
};

export const triggerRFQ = async (deal) => {
  if (USE_MOCK) return { success: true };
  return apiPost('/webhook/rfq', deal);
};

export const triggerBuyerQuote = async (deal) => {
  if (USE_MOCK) return { success: true };
  return apiPost('/webhook/quote', deal);
};

export const updateDealStatus = async (dealId, status) => {
  if (USE_MOCK) return { success: true };
  return apiPost('/webhook/status', { dealId, status });
};
