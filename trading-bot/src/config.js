export const CONFIG = {
  sellerEmail: import.meta.env.VITE_SELLER_EMAIL || "",
  businessName: import.meta.env.VITE_BUSINESS_NAME || "",
  businessEmail: import.meta.env.VITE_BUSINESS_EMAIL || "",
  defaultMargin: import.meta.env.VITE_DEFAULT_MARGIN || "10"
};

export const refreshConfig = async () => {
  const storedStr = localStorage.getItem('settings');
  if (storedStr) {
    try {
      const storedConfig = JSON.parse(storedStr);
      if (storedConfig.sellerEmail) CONFIG.sellerEmail = storedConfig.sellerEmail;
      if (storedConfig.businessName) CONFIG.businessName = storedConfig.businessName;
      if (storedConfig.businessEmail) CONFIG.businessEmail = storedConfig.businessEmail;
      if (storedConfig.defaultMargin) CONFIG.defaultMargin = storedConfig.defaultMargin;
    } catch (e) {
      console.error("Error parsing settings in config", e);
    }
  }
};
