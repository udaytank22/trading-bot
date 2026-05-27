import { closedDeals, weeklyTrend } from '@data/mockProfit';
import { USE_MOCK, apiGet, apiPost } from './apiClient';

export const fetchProfitData = async () => {
  if (USE_MOCK) return { closedDeals, weeklyTrend };
  return apiGet('/sheets/profit');
};

export const logQuoteSent = async (deal) => {
  if (USE_MOCK) return { success: true, storedLocally: true };
  return apiPost('/sheets/log-quote', deal);
};
