const config = require('../config');
const logger = require('./logger');

/**
 * Classify and extract data from email using Google Gemini API
 * @param {string} subject - Email subject
 * @param {string} body - Email body
 * @param {string} senderEmail - Sender's email address
 * @returns {Promise<Object>} Categorized email structure
 */
const analyzeEmailWithAI = async (subject, body, senderEmail) => {
  const apiKey = config.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('[AI Service] GEMINI_API_KEY is not configured. Falling back to rule-based classification.');
    return fallbackClassification(subject, body, senderEmail);
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

  const prompt = `
You are an intelligent email analyzer and workflow automation agent for TradeMind, a maritime shipping/trading ERP system.
Analyze the following email from a sender:
Sender: ${senderEmail || 'Unknown'}
Subject: ${subject}
Body:
${body}

Classify this email into exactly one of these categories:
1. "TASK" - A request or action item that needs to be done by our team/employees (e.g. vessel arrival tasks, document requests, maintenance, logistics scheduling, meeting requests).
2. "NEW_INQUIRY" - A client or prospective client requesting a new quotation, RFQ, pricing inquiry, or order details for goods/services.
3. "INQUIRY_UPDATE" - An update, reply, or status inquiry regarding an *existing* inquiry or quotation. Typically references an inquiry number (e.g., INQ-XXXXXX) or refers to a previous discussion.
4. "UNKNOWN" - Spam, automated out-of-office notifications, or general chatter.

You MUST respond in strict JSON format. Do not put markdown code block formatting (like \`\`\`json) or any other text. Only valid JSON.
The JSON object must have the following structure:
{
  "category": "TASK" | "NEW_INQUIRY" | "INQUIRY_UPDATE" | "UNKNOWN",
  "explanation": "Brief explanation of the classification rationale",
  "taskDetails": {
    "title": "Short descriptive title for the task (if TASK)",
    "description": "Clean, formatted description of the task requirements (if TASK)",
    "priority": "LOW" | "MEDIUM" | "HIGH",
    "suggestedDepartment": "Suggested department to assign (e.g., Logistics, Support, Admin, Sourcing)",
    "suggestedEmployeeName": "Name of employee suggested to assign (if mentioned)"
  },
  "inquiryDetails": {
    "clientName": "Name of the client/sender",
    "clientEmail": "Email of the client/sender",
    "company": "Company name if mentioned",
    "vesselName": "Vessel name if mentioned",
    "imoNumber": "IMO number of the vessel if mentioned",
    "items": [
      {
        "description": "Product or service description",
        "quantity": 1,
        "unit": "MT" | "PCS" | "LTR" | "KG" | "UNIT"
      }
    ]
  },
  "inquiryUpdateDetails": {
    "inquiryNumber": "The inquiry ID/number referenced (e.g., INQ-177986)",
    "remarks": "Summary of the update or client notes",
    "status": "PENDING" | "CONFIRMED" | "CANCELLED"
  }
}
`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
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

    return JSON.parse(textResponse.trim());
  } catch (error) {
    logger.error(error, '[AI Service] Error calling Gemini API.');
    return fallbackClassification(subject, body, senderEmail);
  }
};

/**
 * Basic keyword parsing fallback when API key is not present
 */
const fallbackClassification = (subject, body, senderEmail) => {
  logger.info('[AI Service] Using fallback rule-based classification.');
  const lowerSubject = (subject || '').toLowerCase();
  const lowerBody = (body || '').toLowerCase();

  // Check for existing inquiry number (e.g., INQ-123456)
  const inqRegex = /inq-\d+/i;
  const match = lowerSubject.match(inqRegex) || lowerBody.match(inqRegex);
  if (match) {
    return {
      category: 'INQUIRY_UPDATE',
      explanation: 'Detected existing Inquiry reference number in subject or body (Rule-based Fallback).',
      inquiryUpdateDetails: {
        inquiryNumber: match[0].toUpperCase(),
        remarks: `Auto-extracted update from email: "${subject}"`
      }
    };
  }

  // Check for RFQ / quote requests
  if (
    lowerSubject.includes('quote') ||
    lowerSubject.includes('rfq') ||
    lowerSubject.includes('pricing') ||
    lowerBody.includes('please quote') ||
    lowerBody.includes('rfq')
  ) {
    return {
      category: 'NEW_INQUIRY',
      explanation: 'Detected request for pricing, quote, or RFQ keyword (Rule-based Fallback).',
      inquiryDetails: {
        clientName: senderEmail ? senderEmail.split('@')[0] : 'Client',
        clientEmail: senderEmail || 'client@example.com',
        company: 'Extracted Co.',
        items: [
          {
            description: subject || 'Inquired Items',
            quantity: 1,
            unit: 'UNIT'
          }
        ]
      }
    };
  }

  // Check for tasks
  if (
    lowerSubject.includes('task') ||
    lowerSubject.includes('todo') ||
    lowerSubject.includes('urgent') ||
    lowerSubject.includes('assign') ||
    lowerSubject.includes('deliver') ||
    lowerSubject.includes('arrival') ||
    lowerBody.includes('please look into')
  ) {
    return {
      category: 'TASK',
      explanation: 'Detected directive or task keywords (Rule-based Fallback).',
      taskDetails: {
        title: subject || 'Action Item',
        description: (body || '').substring(0, 500),
        priority: lowerSubject.includes('urgent') ? 'HIGH' : 'MEDIUM'
      }
    };
  }

  return {
    category: 'UNKNOWN',
    explanation: 'No recognizable workflow patterns matched (Rule-based Fallback).'
  };
};

module.exports = {
  analyzeEmailWithAI
};
