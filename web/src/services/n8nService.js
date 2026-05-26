import { mockInquiries } from '../data/mockInquiries';

export const fetchInquiries = async () => {
  return mockInquiries;
};

export const triggerRFQ = async (deal) => {
  return { success: true };
};

export const triggerBuyerQuote = async (deal) => {
  return { success: true };
};

export const updateDealStatus = async (dealId, status) => {
  return { success: true };
};
