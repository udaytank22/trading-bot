import { closedDeals, weeklyTrend } from '../data/mockProfit';

export const fetchProfitData = async () => {
  return { closedDeals, weeklyTrend };
};

export const logQuoteSent = async (deal) => {
  return { success: true, storedLocally: true };
};
