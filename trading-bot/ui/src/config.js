export const CONFIG = {
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  n8nBaseUrl: process.env.N8N_WEBHOOK_BASE_URL,
  n8nSecret: process.env.N8N_WEBHOOK_SECRET,
  sheetId: process.env.GOOGLE_SHEET_ID,
  sellerEmail: process.env.SELLER_EMAIL,
  businessName: process.env.BUSINESS_NAME,
  businessEmail: process.env.BUSINESS_EMAIL,
  defaultMargin: process.env.DEFAULT_MARGIN
};

export const refreshConfig = async () => {
  if (window.electronStore) {
    const storedConfig = await window.electronStore.get('settings');
    if (storedConfig) {
      if (storedConfig.geminiApiKey) CONFIG.geminiApiKey = storedConfig.geminiApiKey;
      if (storedConfig.geminiModel) CONFIG.geminiModel = storedConfig.geminiModel;
      if (storedConfig.n8nBaseUrl) CONFIG.n8nBaseUrl = storedConfig.n8nBaseUrl;
      if (storedConfig.n8nSecret) CONFIG.n8nSecret = storedConfig.n8nSecret;
      if (storedConfig.sheetId) CONFIG.sheetId = storedConfig.sheetId;
      if (storedConfig.sellerEmail) CONFIG.sellerEmail = storedConfig.sellerEmail;
      if (storedConfig.businessName) CONFIG.businessName = storedConfig.businessName;
      if (storedConfig.businessEmail) CONFIG.businessEmail = storedConfig.businessEmail;
      if (storedConfig.defaultMargin) CONFIG.defaultMargin = storedConfig.defaultMargin;
    }
  }
};
