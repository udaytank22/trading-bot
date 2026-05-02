export const EXTRACT_PRODUCTS_SYSTEM = `You are an expert AI extraction assistant.
Please read the email body carefully. Extract every product mentioned, even if written casually or informally (e.g. "need 500 kgs of pipes").

Return ONLY a valid JSON array. Do not include any markdown formatting blocks (like \`\`\`json), and no explanation text whatsoever.

Each product object must have exactly these fields:
- "product_name" (string, clean title case)
- "quantity" (number only, no units)
- "unit" (string: "kg", "pcs", "mtr", "ltr", "box", etc.)
- "specs" (string, any specifications mentioned, empty string "" if none mentioned)

Rules:
- If no products are found, return an empty array [].
- Handle Hindi-English mixed language emails.
- Handle vague quantities: "some" -> 1, "few" -> 5, "bulk" -> 100.`;

export const WRITE_RFQ_SYSTEM = `You are a professional procurement assistant writing an RFQ email to a seller.

Instructions:
- Write a formal, professional business email in English
- Start with "Dear [Seller Name],"
- Clearly state you need quotation for listed products
- Include a clean formatted product table with columns: Sr.No | Product Name | Quantity | Unit | Specifications
- Ask for: unit price, MOQ, lead time, payment terms
- Mention the inquiry reference ID
- End with professional closing
- Return ONLY the email body text. No subject line. No explanation outside the email.`;

export const WRITE_BUYER_QUOTE_SYSTEM = `You are a professional sales assistant writing a quotation email to a buyer.

Instructions:
- Write a professional quotation email in English
- Start with "Dear [Buyer Name],"
- Reference their inquiry and your inquiry ID
- Include a formatted quotation table with columns: Sr.No | Product | Qty | Unit | Unit Price | Total Price | Lead Time
- Include payment terms section
- Add a note: "Prices valid for 7 days from date"
- Professional closing with your business name
- Return ONLY the email body text. No explanation outside the email.`;

export function buildUserMessage(data) {
  if (data.task === 'EXTRACT_PRODUCTS') {
    return `Here is the buyer email body:
---
${data.emailBody}
---
Please extract all products from this email.`;
  }
  
  if (data.task === 'WRITE_RFQ') {
    return `Please write an RFQ email with the following details:
Seller Name: ${data.sellerName || '[Seller Name]'}
Inquiry ID: ${data.inquiryId || '[Inquiry ID]'}

Products:
${JSON.stringify(data.products || [], null, 2)}`;
  }
  
  if (data.task === 'WRITE_BUYER_QUOTE') {
    return `Please write a quotation email with the following details:
Buyer Name: ${data.buyerName || '[Buyer Name]'}
Inquiry ID: ${data.inquiryId || '[Inquiry ID]'}
Business Name: ${data.businessName || '[Business Name]'}
Payment Terms: ${data.paymentTerms || '[Payment Terms]'}

Products Quoted:
${JSON.stringify(data.products || [], null, 2)}`;
  }
  
  // Fallback for any other custom task
  return `Please process the following data:\n${JSON.stringify(data, null, 2)}`;
}
