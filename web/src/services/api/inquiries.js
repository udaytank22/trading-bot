import apiClient from '../apiClient';

const normalizeInquiry = (inq) => {
  if (!inq) return null;

  // --- Build per-product selected items (multi-supplier) ---
  // Collect all SupplierQuoteItems that are isSelected=true, keyed by inquiryItemId
  const selectedItemMap = {}; // inquiryItemId -> { item, quote }
  if (inq.supplierQuotes && inq.supplierQuotes.length > 0) {
    for (const quote of inq.supplierQuotes) {
      for (const item of (quote.items || [])) {
        if (item.isSelected) {
          selectedItemMap[item.inquiryItemId] = { item, quote };
        }
      }
    }
  }

  const hasPerItemSelections = Object.keys(selectedItemMap).length > 0;

  // Fallback: pick the (old-style) single selected quote for backward compatibility
  const latestQuote = inq.supplierQuotes && inq.supplierQuotes.length > 0
    ? (inq.supplierQuotes.find(q => q.isSelected) || null)
    : null;

  // Build seller_quote — now per-product aware
  let seller_quote = null;
  if (hasPerItemSelections) {
    // Multi-supplier mode: each product tracks its own supplier
    const products = (inq.items || []).map(inquiryItem => {
      const sel = selectedItemMap[inquiryItem.id];
      return {
        product_name: inquiryItem.description,
        seller_unit_price: sel ? (parseFloat(sel.item.unitPrice) || 0) : 0,
        supplier_name: sel ? (sel.quote.supplier?.name || 'N/A') : null,
        moq: sel ? sel.item.quantity : (inquiryItem.quantity || 1),
        lead_time: 'Ready'
      };
    }).filter(p => p.supplier_name !== null); // only show products that have a selection

    seller_quote = {
      id: 'multi',
      seller_name: 'Multiple Suppliers',
      seller_email: '',
      is_multi_supplier: true,
      products
    };
  } else if (latestQuote) {
    // Legacy single-quote mode
    seller_quote = {
      id: latestQuote.id,
      seller_name: latestQuote.supplier?.name || 'N/A',
      seller_email: latestQuote.supplier?.email || 'N/A',
      is_multi_supplier: false,
      products: (latestQuote.items || []).map(item => {
        const inquiryItem = inq.items?.find(ii => ii.id === item.inquiryItemId);
        return {
          product_name: inquiryItem ? inquiryItem.description : 'Unknown Product',
          seller_unit_price: parseFloat(item.unitPrice) || 0,
          supplier_name: latestQuote.supplier?.name || 'N/A',
          moq: item.quantity,
          lead_time: 'Ready'
        };
      })
    };
  }

  const latestClientQuote = inq.clientQuotations && inq.clientQuotations.length > 0
    ? inq.clientQuotations[0]
    : null;

  const my_quote = latestClientQuote ? {
    id: latestClientQuote.id,
    margin_percent: parseFloat(latestClientQuote.marginPercentage) || 0,
    discount_percent: parseFloat(latestClientQuote.discountPercentage) || 0,
    products: latestClientQuote.items ? latestClientQuote.items.map(item => {
      const inquiryItem = inq.items?.find(ii => ii.id === item.inquiryItemId);
      // Find the selected supplier quote item for this product
      const sel = selectedItemMap[item.inquiryItemId];
      const sellerPrice = sel
        ? parseFloat(sel.item.unitPrice)
        : (latestQuote?.items?.find(qi => qi.inquiryItemId === item.inquiryItemId)
          ? parseFloat(latestQuote.items.find(qi => qi.inquiryItemId === item.inquiryItemId).unitPrice)
          : 0);
      return {
        product_name: inquiryItem ? inquiryItem.description : 'Unknown Product',
        quantity: item.quantity,
        unit: inquiryItem?.unit || 'MT',
        seller_unit_price: sellerPrice,
        supplier_name: sel ? (sel.quote.supplier?.name || 'N/A') : (latestQuote?.supplier?.name || 'N/A'),
        my_unit_price: parseFloat(item.sellingPrice) || 0,
        total_price: parseFloat(item.totalPrice) || 0,
        margin_percent: parseFloat(latestClientQuote.marginPercentage) || 0,
        discount_percent: parseFloat(latestClientQuote.discountPercentage) || 0
      };
    }) : []
  } : null;

  return {
    ...inq,
    inquiry_id: inq.inquiryNumber || inq.id,
    buyer_name: inq.client ? inq.client.name : (inq.buyer_name || 'N/A'),
    buyer_email: inq.client ? inq.client.email : (inq.buyer_email || 'N/A'),
    status: inq.currentStatus || inq.status,
    date_received: inq.createdAt || inq.date_received,
    // Inventory auto-fulfillment fields
    inventoryFulfilled: inq.inventoryFulfilled || false,
    supplyStatus: inq.supplyStatus || null,
    dispatchStatus: inq.dispatchStatus || null,
    seller_quote,
    my_quote,
    margin_percent: my_quote ? my_quote.margin_percent : (inq.margin_percent || 0),
    discount_percent: my_quote ? my_quote.discount_percent : (inq.discount_percent || 0),
    products: inq.items ? inq.items.map(item => {
      const sel = selectedItemMap[item.id];
      const fallbackItem = latestQuote?.items?.find(qi => qi.inquiryItemId === item.id);
      return {
        product_name: item.description,
        quantity: item.quantity,
        unit: item.unit || 'MT',
        specs: item.specs || '',
        seller_unit_price: sel
          ? parseFloat(sel.item.unitPrice)
          : (fallbackItem ? parseFloat(fallbackItem.unitPrice) : 0),
        supplier_name: sel
          ? (sel.quote.supplier?.name || 'N/A')
          : (latestQuote?.supplier?.name || null),
        category: item.product ? item.product.category : null
      };
    }) : []
  };
};

export const getInquiries = async (params = {}) => {
  const response = await apiClient.get('/inquiries', { params });
  if (response.data && response.data.success && Array.isArray(response.data.data)) {
    response.data.data = response.data.data.map(normalizeInquiry);
  }
  return response.data;
};

export const getInquiry = async (id) => {
  const response = await apiClient.get(`/inquiries/${id}`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const createInquiry = async (data) => {
  const response = await apiClient.post('/inquiries', data);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const updateInquiry = async (id, data) => {
  const response = await apiClient.put(`/inquiries/${id}`, data);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const deleteInquiry = async (id) => {
  const response = await apiClient.delete(`/inquiries/${id}`);
  return response.data;
};

export const stockCheck = async (id, supplierIds) => {
  const response = await apiClient.post(`/inquiries/${id}/stock-check`, { supplierIds });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const sendRFQ = async (id) => {
  const response = await apiClient.post(`/inquiries/${id}/send-rfq`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const supplierQuote = async (id, data) => {
  const response = await apiClient.post(`/inquiries/${id}/supplier-quote`, data);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const clientQuote = async (id, data) => {
  const response = await apiClient.post(`/inquiries/${id}/client-quote`, data);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const teamLeadApprove = async (id, data) => {
  const payload = typeof data === 'object' ? data : { approved: data };
  const response = await apiClient.post(`/inquiries/${id}/team-lead-approve`, payload);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const adminApprove = async (id, data) => {
  const response = await apiClient.post(`/inquiries/${id}/admin-approve`, data);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const finalVerify = async (id) => {
  const response = await apiClient.post(`/inquiries/${id}/final-verify`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const clientDecision = async (id, accepted) => {
  const response = await apiClient.post(`/inquiries/${id}/client-decision`, { accepted });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const confirmDeal = async (id) => {
  const response = await apiClient.post(`/inquiries/${id}/confirm-deal`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const closeInquiry = async (id) => {
  const response = await apiClient.post(`/inquiries/${id}/close`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const closeRFQ = async (id) => {
  const response = await apiClient.post(`/inquiries/${id}/close-rfq`);
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const selectSupplierQuote = async (id, quoteId) => {
  const response = await apiClient.post(`/inquiries/${id}/select-supplier-quote`, { quoteId });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const selectSupplierQuoteItem = async (id, quoteItemId) => {
  const response = await apiClient.post(`/inquiries/${id}/select-supplier-quote-item`, { quoteItemId });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const selectSupplierQuoteItems = async (id, selections) => {
  const response = await apiClient.post(`/inquiries/${id}/select-supplier-quote-items`, { selections });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};
