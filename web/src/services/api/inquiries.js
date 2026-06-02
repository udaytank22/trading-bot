import apiClient from '../apiClient';

const normalizeInquiry = (inq) => {
  if (!inq) return null;

  const latestQuote = inq.supplierQuotes && inq.supplierQuotes.length > 0
    ? inq.supplierQuotes[0]
    : null;

  const seller_quote = latestQuote ? {
    id: latestQuote.id,
    seller_name: latestQuote.supplier?.name || 'N/A',
    seller_email: latestQuote.supplier?.email || 'N/A',
    products: latestQuote.items ? latestQuote.items.map(item => {
      const inquiryItem = inq.items?.find(ii => ii.id === item.inquiryItemId);
      return {
        product_name: inquiryItem ? inquiryItem.description : 'Unknown Product',
        seller_unit_price: parseFloat(item.unitPrice) || 0,
        moq: item.quantity,
        lead_time: 'Ready'
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
    seller_quote,
    products: inq.items ? inq.items.map(item => {
      const quoteItem = latestQuote?.items?.find(qi => qi.inquiryItemId === item.id);
      return {
        product_name: item.description,
        quantity: item.quantity,
        unit: item.unit || 'MT',
        specs: item.specs || '',
        seller_unit_price: quoteItem ? parseFloat(quoteItem.unitPrice) : 0
      };
    }) : []
  };
};

export const getInquiries = async () => {
  const response = await apiClient.get('/inquiries');
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

export const teamLeadApprove = async (id, approved) => {
  const response = await apiClient.post(`/inquiries/${id}/team-lead-approve`, { approved });
  if (response.data && response.data.success && response.data.data) {
    response.data.data = normalizeInquiry(response.data.data);
  }
  return response.data;
};

export const adminApprove = async (id, approved) => {
  const response = await apiClient.post(`/inquiries/${id}/admin-approve`, { approved });
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
