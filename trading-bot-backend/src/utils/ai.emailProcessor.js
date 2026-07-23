const path = require('path');
const config = require('../config');
const logger = require('./logger');
const prisma = require('../prisma/client');

/**
 * Helper to generate a unique sequential inquiry number
 */
const generateInquiryNumber = async () => {
  const last = await prisma.inquiry.findFirst({
    orderBy: { id: 'desc' },
    select: { inquiryNumber: true }
  });

  let nextNum = 1001;
  if (last?.inquiryNumber) {
    const match = last.inquiryNumber.match(/INQ-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }

  let candidate = `INQ-${nextNum}`;
  while (true) {
    const exists = await prisma.inquiry.findFirst({ where: { inquiryNumber: candidate } });
    if (!exists) break;
    nextNum += 1;
    candidate = `INQ-${nextNum}`;
  }
  return candidate;
};

/**
 * AI Email Processing pipeline
 * @param {Object} email - The email object parsed by mailparser
 * @returns {Promise<Object>} Ingestion results
 */
const processIncomingEmail = async (email) => {
  const messageId = email.id || `msg-${Date.now()}-${Math.random()}`;
  const subject = email.subject || '';
  const body = email.body?.content || email.bodyPreview || '';
  const senderEmail = email.sender?.emailAddress?.address || '';
  const senderName = email.sender?.emailAddress?.name || '';
  
  logger.info(`[AI EmailProcessor] Ingesting email: "${subject}" from <${senderEmail}>`);

  // 1. Duplicate Ingestion Check (by messageId)
  const existingInquiryByEmail = await prisma.inquiry.findFirst({
    where: { emailId: messageId, deletedAt: null }
  });
  if (existingInquiryByEmail) {
    logger.warn(`[AI EmailProcessor] Email ID ${messageId} already processed. Skipping to avoid duplication.`);
    return { status: 'skipped', reason: 'Duplicate Email ID', record: existingInquiryByEmail };
  }

  // 2. Prepare Attachments for Gemini Multimodal API & local parsing
  const XLSX = require('xlsx');
  let extractedExcelText = '';
  const inlineParts = [];
  const attachments = email.attachments || [];
  
  // Supported Mime Types for Gemini Multimodal API (Excluding Excel since Gemini rejects inline excel binaries)
  const supportedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'text/plain',
    'text/csv'
  ];

  for (const att of attachments) {
    if (!att.content) continue;

    // Limit inline size to 5MB per file to avoid request overload
    if (att.content.length > 5 * 1024 * 1024) {
      logger.warn(`[AI EmailProcessor] Skipping attachment ${att.filename} as it exceeds 5MB.`);
      continue;
    }

    const isExcel = att.contentType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                    att.contentType === 'application/vnd.ms-excel' ||
                    att.filename?.endsWith('.xlsx') ||
                    att.filename?.endsWith('.xls');

    if (isExcel) {
      try {
        const workbook = XLSX.read(att.content, { type: 'buffer' });
        let excelText = '';
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const csv = XLSX.utils.sheet_to_csv(sheet);
          if (csv && csv.trim()) {
            excelText += `--- Sheet: ${sheetName} ---\n${csv}\n\n`;
          }
        });
        if (excelText) {
          extractedExcelText += `[Excel Attachment Contents for: ${att.filename}]\n${excelText}\n`;
          logger.info(`[AI EmailProcessor] Locally parsed Excel spreadsheet: ${att.filename}`);
        }
      } catch (excelErr) {
        logger.error(excelErr, `[AI EmailProcessor] Failed to parse Excel attachment ${att.filename}`);
      }
    } else if (supportedTypes.includes(att.contentType)) {
      inlineParts.push({
        inlineData: {
          mimeType: att.contentType,
          data: att.content.toString('base64')
        }
      });
      logger.info(`[AI EmailProcessor] Attached to inlineParts: ${att.filename} (${att.contentType})`);
    }
  }

  // 3. Multimodal Prompt Construction
  const prompt = `
You are an advanced maritime ERP agent. You receive inquiry emails from ship owners, managers, and agents, sometimes containing attachments like Excel requisitions, PDF tables, or Word documents.

Please analyze the email details below and extract all structured fields for creating/updating shipping inquiries.
Subject: ${subject}
Body:
${body}

${extractedExcelText ? `Additionally, the following Excel attachment tabular data was parsed and extracted from the email:\n${extractedExcelText}` : ''}

If attachments are provided (PDF, Excel, Word, Images), read and parse their tabular rows or item details, and merge the requested items into the inquiry.

Identify the Vessel Name (Highest Priority) from any location in the email (subject, body, tables, forwarded threads, signatures).

Respond with a strictly formatted JSON object (no markdown formatting like \`\`\`json). The JSON must look like:
{
  "category": "NEW_INQUIRY" | "INQUIRY_UPDATE" | "UNKNOWN",
  "explanation": "Brief explanation of your classification reasoning.",
  "confidenceScore": 0.95,
  "confidenceDetails": {
    "vesselName": 0.95,
    "imoNumber": 0.9,
    "port": 0.9,
    "deliveryLocation": 0.8,
    "eta": 0.95,
    "etd": 0.8,
    "requiredDeliveryDate": 0.8,
    "clientName": 0.95,
    "companyName": 0.95,
    "rfqNumber": 0.9,
    "currency": 0.9,
    "paymentTerms": 0.5,
    "items": 0.95
  },
  "inquiryDetails": {
    "vesselName": "Extracted Vessel Name",
    "imoNumber": "IMO Number if found",
    "port": "Port location if specified",
    "deliveryLocation": "Specific delivery location or berth if specified",
    "eta": "ETA information",
    "etd": "ETD information",
    "requiredDeliveryDate": "ISO date string or null",
    "clientName": "Extracted sender contact name",
    "clientEmail": "${senderEmail}",
    "companyName": "Extracted client company name",
    "rfqNumber": "Customer's RFQ or Reference number",
    "currency": "USD" | "EUR" | "INR" | "SGD" | etc,
    "paymentTerms": "Extracted payment terms",
    "specialInstructions": "Any remarks, delivery urgency, or instructions",
    "items": [
      {
        "impaCode": "IMPA code if available",
        "issaCode": "ISSA code if available",
        "partNumber": "Article/Part Number",
        "description": "Item description (Required)",
        "quantity": 1,
        "unit": "PC" | "PCS" | "UNIT" | "KG" | "SET" | etc,
        "brand": "Suggested brand if any",
        "manufacturer": "Suggested manufacturer if any",
        "remarks": "Item comments or specifications"
      }
    ]
  },
  "inquiryUpdateDetails": {
    "inquiryNumber": "Ref Inquiry number (e.g. INQ-1002)",
    "remarks": "Short summary of the update to apply"
  }
}
`;

  // 4. Invoke Google Gemini API
  let aiResult;
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('[AI EmailProcessor] GEMINI_API_KEY is not configured. Falling back to rule-based parser.');
    aiResult = fallbackParser(subject, body, senderEmail, senderName);
  } else {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [
          {
            parts: [
              { text: prompt },
              ...inlineParts
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textResponse) {
        throw new Error('Invalid response structure from Gemini API');
      }
      aiResult = JSON.parse(textResponse.trim());
    } catch (error) {
      logger.error(error, '[AI EmailProcessor] Error calling Gemini API. Falling back.');
      aiResult = fallbackParser(subject, body, senderEmail, senderName);
    }
  }

  // 5. Ingestion Execution based on Category
  try {
    if (aiResult.category === 'NEW_INQUIRY') {
      const details = aiResult.inquiryDetails || {};
      
      // 5.1 Client Matching (Find by Email, Company, Name, or Auto-Create)
      let client = await prisma.client.findFirst({
        where: { email: { equals: details.clientEmail || senderEmail, mode: 'insensitive' }, deletedAt: null }
      });
      if (!client && details.companyName) {
        client = await prisma.client.findFirst({
          where: { company: { equals: details.companyName, mode: 'insensitive' }, deletedAt: null }
        });
      }
      if (!client) {
        // Auto-create missing client
        client = await prisma.client.create({
          data: {
            name: details.clientName || senderName || 'Auto Client',
            email: details.clientEmail || senderEmail,
            company: details.companyName || 'Auto Marine Company'
          }
        });
        logger.info(`[AI EmailProcessor] Auto-created client: ${client.name} for ${client.company}`);
      }

      // 5.2 Vessel Identification & ClientVessel Creation
      let vesselId = null;
      if (details.vesselName) {
        let vessel = await prisma.clientVessel.findFirst({
          where: {
            name: { equals: details.vesselName.trim(), mode: 'insensitive' },
            clientId: client.id
          }
        });
        if (!vessel) {
          vessel = await prisma.clientVessel.create({
            data: {
              clientId: client.id,
              name: details.vesselName.trim(),
              imoNumber: details.imoNumber || null
            }
          });
          logger.info(`[AI EmailProcessor] Auto-created vessel: ${vessel.name} under client ${client.name}`);
        }
        vesselId = vessel.id;
      }

      // 5.3 Duplicate Inquiry Prevention (Check for same RFQ number and client in last 24 hours)
      if (details.rfqNumber) {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const duplicateInq = await prisma.inquiry.findFirst({
          where: {
            clientId: client.id,
            rfqNumber: details.rfqNumber,
            createdAt: { gte: oneDayAgo },
            deletedAt: null
          }
        });
        if (duplicateInq) {
          logger.warn(`[AI EmailProcessor] Duplicate Inquiry detected with RFQ: ${details.rfqNumber}. Ingestion skipped.`);
          return { status: 'skipped', reason: 'Duplicate RFQ Number', record: duplicateInq };
        }
      }

      // 5.4 Check if low confidence to trigger manual review
      const lowConfidence = aiResult.confidenceScore < 0.8 || !details.vesselName || !details.items || details.items.length === 0;

      // 5.5 Generate Sequential Inquiry Number & Ingest
      const inquiryNumber = await generateInquiryNumber();
      const newInquiry = await prisma.$transaction(async (tx) => {
        const inq = await tx.inquiry.create({
          data: {
            inquiryNumber,
            clientId: client.id,
            vesselName: details.vesselName || null,
            imoNumber: details.imoNumber || null,
            referenceNumber: details.rfqNumber || null,
            currentStatus: lowConfidence ? 'PENDING' : 'PENDING', // Keep pending or review status
            remarks: details.specialInstructions || null,
            isAiGenerated: true,
            needsReview: lowConfidence,
            aiConfidence: {
              overall: aiResult.confidenceScore,
              details: aiResult.confidenceDetails,
              explanation: aiResult.explanation
            },
            port: details.port || null,
            deliveryLocation: details.deliveryLocation || null,
            eta: details.eta || null,
            etd: details.etd || null,
            specialInstructions: details.specialInstructions || null,
            rfqNumber: details.rfqNumber || null,
            currency: details.currency || 'USD',
            paymentTerms: details.paymentTerms || null,
            emailId: messageId
          }
        });

        // Add line items
        if (details.items && details.items.length > 0) {
          const itemsToCreate = [];
          for (const item of details.items) {
            // Match with existing product IMPA or description if possible
            let pId = null;
            if (item.impaCode) {
              const match = await tx.product.findFirst({ where: { impa: item.impaCode, deletedAt: null } });
              if (match) pId = match.id;
            }
            if (!pId && item.description) {
              const match = await tx.product.findFirst({ where: { name: { equals: item.description, mode: 'insensitive' }, deletedAt: null } });
              if (match) pId = match.id;
            }

            itemsToCreate.push({
              inquiryId: inq.id,
              productId: pId,
              description: item.description,
              quantity: parseInt(item.quantity, 10) || 1,
              unit: item.unit || 'UNIT'
            });
          }
          await tx.inquiryItem.createMany({ data: itemsToCreate });
        }

        // Logs status history
        await tx.inquiryStatusHistory.create({
          data: {
            inquiryId: inq.id,
            fromStatus: 'NONE',
            toStatus: 'PENDING',
            changedById: 1, // Attributed to system admin
            remarks: `Auto-ingested via AI Sourcing Agent. Confidence: ${Math.round(aiResult.confidenceScore * 100)}%. Review Required: ${lowConfidence}`
          }
        });

        return inq;
      });

      logger.info(`[AI EmailProcessor] Successfully auto-created Inquiry ${newInquiry.inquiryNumber}`);
      return { status: 'created', category: 'NEW_INQUIRY', inquiry: newInquiry, details: aiResult };

    } else if (aiResult.category === 'INQUIRY_UPDATE') {
      const update = aiResult.inquiryUpdateDetails || {};
      const refNum = update.inquiryNumber;
      
      if (!refNum || refNum === 'UNKNOWN') {
        return { status: 'failed', reason: 'Unrecognized Inquiry number for update request' };
      }

      const inquiry = await prisma.inquiry.findFirst({
        where: { inquiryNumber: { equals: refNum.trim(), mode: 'insensitive' }, deletedAt: null }
      });

      if (!inquiry) {
        logger.warn(`[AI EmailProcessor] Update referenced Inquiry ${refNum} but it was not found.`);
        return { status: 'failed', reason: `Inquiry ${refNum} not found` };
      }

      // Record status log and update remarks
      const updatedInq = await prisma.$transaction(async (tx) => {
        await tx.inquiryStatusHistory.create({
          data: {
            inquiryId: inquiry.id,
            fromStatus: inquiry.currentStatus,
            toStatus: inquiry.currentStatus,
            changedById: 1,
            remarks: `[AI Email Update]: ${update.remarks}`
          }
        });

        return await tx.inquiry.update({
          where: { id: inquiry.id },
          data: {
            remarks: inquiry.remarks 
              ? `${inquiry.remarks}\n\n[AI Email Update]: ${update.remarks}` 
              : `[AI Email Update]: ${update.remarks}`
          }
        });
      });

      logger.info(`[AI EmailProcessor] Successfully updated Inquiry ${updatedInq.inquiryNumber}`);
      return { status: 'updated', category: 'INQUIRY_UPDATE', inquiry: updatedInq, details: aiResult };
    }

    return { status: 'ignored', category: 'UNKNOWN', details: aiResult };
  } catch (err) {
    logger.error('[AI EmailProcessor] Error executing ingestion database steps:', err);
    throw err;
  }
};

/**
 * Fallback parser using local regex/keywords
 */
const fallbackParser = (subject, body, senderEmail, senderName) => {
  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();
  
  // 1. Determine category
  let category = 'UNKNOWN';
  let explanation = 'Rule-based fallback execution';
  
  const inqRegex = /inq-\d+/i;
  const matchInq = lowerSubject.match(inqRegex) || lowerBody.match(inqRegex);
  
  if (matchInq) {
    category = 'INQUIRY_UPDATE';
    explanation = 'Detected inquiry code in text (fallback mode).';
  } else if (
    lowerSubject.includes('rfq') || 
    lowerSubject.includes('quote') || 
    lowerSubject.includes('inquiry') ||
    lowerBody.includes('please quote')
  ) {
    category = 'NEW_INQUIRY';
    explanation = 'Detected RFQ/quote keywords in text (fallback mode).';
  }

  // 2. Extract Vessel Name
  let vesselName = null;
  const vesselKeywords = ['vessel name:', 'vessel:', 'mv ', 'm/v ', 'm.v.'];
  for (const kw of vesselKeywords) {
    const idx = lowerBody.indexOf(kw);
    if (idx !== -1) {
      const line = body.substring(idx + kw.length).split('\n')[0].trim();
      vesselName = line.replace(/['"“”]/g, '').trim();
      break;
    }
  }
  if (!vesselName) {
    // Subject matching
    const mvMatch = subject.match(/m\/v\s+([a-zA-Z0-9\s]+)/i) || subject.match(/mv\s+([a-zA-Z0-9\s]+)/i);
    if (mvMatch) vesselName = mvMatch[1].trim();
  }

  // 3. Extract items (Line items parsing)
  const items = [];
  // Quick parse of lines starting with numbers or list formats
  const lines = body.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const itemMatch = trimmed.match(/^(\d+)[\.\s]+([a-zA-Z\s]+)\s*-\s*(\d+)\s*([a-zA-Z]+)/);
    if (itemMatch) {
      items.push({
        description: itemMatch[2].trim(),
        quantity: parseInt(itemMatch[3], 10),
        unit: itemMatch[4].toUpperCase()
      });
    }
  }

  if (items.length === 0 && category === 'NEW_INQUIRY') {
    items.push({
      description: subject || 'Requisition items',
      quantity: 1,
      unit: 'UNIT'
    });
  }

  return {
    category,
    explanation,
    confidenceScore: 0.5,
    confidenceDetails: {
      vesselName: vesselName ? 0.7 : 0.0,
      items: items.length > 0 ? 0.6 : 0.1
    },
    inquiryDetails: {
      vesselName,
      clientEmail: senderEmail,
      clientName: senderName,
      items
    },
    inquiryUpdateDetails: {
      inquiryNumber: matchInq ? matchInq[0].toUpperCase() : 'UNKNOWN',
      remarks: `Extracted fallback remarks: "${subject}"`
    }
  };
};

module.exports = {
  processIncomingEmail
};
