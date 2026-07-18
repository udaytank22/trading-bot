const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('../../config');

/**
 * Gmail SMTP transporter using Nodemailer
 * Uses App Password authentication (not OAuth2)
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: config.GMAIL_USER,
      pass: config.GMAIL_APP_PASSWORD,
    },
  });
};

/**
 * Send a generic email via Gmail SMTP
 * @param {Object} options - { to, subject, html, text, attachments }
 * @returns {Promise<Object>} Nodemailer send result
 */
const sendEmail = async ({ to, subject, html, text, attachments = [] }) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"TradeMind" <${config.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
    attachments,
  };

  const result = await transporter.sendMail(mailOptions);
  console.log(`✅ Email sent to ${to} — MessageId: ${result.messageId}`);
  return result;
};

/**
 * Send RFQ emails to suppliers for an inquiry
 * @param {Object} inquiry - Full inquiry object (with items, supplierQuotes, client)
 */
const sendRFQEmail = async (inquiry) => {
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ Gmail not configured. Skipping RFQ email dispatch.');
    return;
  }

  // Collect unique suppliers who have quotes for this inquiry
  const suppliers = [];
  const seenEmails = new Set();

  if (inquiry.supplierQuotes && inquiry.supplierQuotes.length > 0) {
    for (const quote of inquiry.supplierQuotes) {
      const email = quote.supplier?.email;
      if (email && !seenEmails.has(email)) {
        seenEmails.add(email);
        suppliers.push({
          name: quote.supplier?.name || 'Valued Supplier',
          email,
          items: (quote.items || []).map(item => {
            const inquiryItem = (inquiry.items || []).find(ii => ii.id === item.inquiryItemId);
            return {
              description: inquiryItem?.description || 'Product',
              quantity: inquiryItem?.quantity || item.quantity,
              unit: inquiryItem?.unit || 'MT',
              specs: inquiryItem?.specs || '',
            };
          }),
        });
      }
    }
  }

  // If no supplier quotes yet, send to all items as a generic RFQ
  if (suppliers.length === 0) {
    console.log('ℹ️ No supplier quotes found. No RFQ emails to send.');
    return;
  }

  // Send an email to each supplier
  for (const supplier of suppliers) {
    const itemsTableRows = supplier.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:10px;border:1px solid #e5e7eb;">${item.description}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;text-align:center;">${item.quantity} ${item.unit}</td>
            <td style="padding:10px;border:1px solid #e5e7eb;">${item.specs || '—'}</td>
          </tr>`
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
        <div style="background:#7c3aed;padding:20px;border-radius:8px 8px 0 0;">
          <h2 style="color:white;margin:0;">Request for Quotation</h2>
          <p style="color:#e9d5ff;margin:4px 0 0;">Ref: ${inquiry.inquiryNumber}</p>
        </div>
        <div style="padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
          <p>Dear ${supplier.name},</p>
          <p>We are currently sourcing products for an upcoming requirement. Please review the items below and provide your best wholesale quotation including unit prices, minimum order quantities, and estimated lead times.</p>
          
          <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Product</th>
                <th style="padding:10px;border:1px solid #e5e7eb;text-align:center;">Qty</th>
                <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Specs</th>
              </tr>
            </thead>
            <tbody>${itemsTableRows}</tbody>
          </table>

          <p>Looking forward to receiving your prompt response.</p>
          <br/>
          <p style="font-weight:bold;">TradeMind Sourcing Team</p>
          <p style="color:#6b7280;font-size:12px;">contact@trademind.com | +91-9876543210</p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: supplier.email,
        subject: `Request for Quotation - Ref: ${inquiry.inquiryNumber}`,
        html,
      });
    } catch (err) {
      console.error(`❌ Failed to send RFQ email to ${supplier.email}:`, err.message);
    }
  }
};

/**
 * Send quotation email to the client for an inquiry
 * @param {Object} inquiry - Full inquiry object (with items, clientQuotations, client)
 */
const sendQuoteEmail = async (inquiry) => {
  if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ Gmail not configured. Skipping quote email dispatch.');
    return;
  }

  const clientEmail = inquiry.client?.email;
  const clientName = inquiry.client?.name || 'Valued Customer';

  if (!clientEmail) {
    console.warn('⚠️ No client email found for inquiry', inquiry.inquiryNumber);
    return;
  }

  // Build product rows from client quotation items
  const latestQuotation = inquiry.clientQuotations?.[0];
  const items = latestQuotation?.items || [];

  const itemsTableRows = items
    .map((item) => {
      const inquiryItem = (inquiry.items || []).find(ii => ii.id === item.inquiryItemId);
      return `<tr>
        <td style="padding:10px;border:1px solid #e5e7eb;">${inquiryItem?.description || 'Product'}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;">₹${parseFloat(item.sellingPrice || 0).toLocaleString('en-IN')}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:center;">${item.quantity} ${inquiryItem?.unit || 'MT'}</td>
        <td style="padding:10px;border:1px solid #e5e7eb;text-align:right;font-family:monospace;font-weight:bold;">₹${parseFloat(item.totalPrice || 0).toLocaleString('en-IN')}</td>
      </tr>`;
    })
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;">
      <div style="background:#7c3aed;padding:20px;border-radius:8px 8px 0 0;">
        <h2 style="color:white;margin:0;">Quotation Details</h2>
        <p style="color:#e9d5ff;margin:4px 0 0;">Ref: ${inquiry.inquiryNumber}</p>
      </div>
      <div style="padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;">
        <p>Dear ${clientName.split(' ')[0]},</p>
        <p>Thank you for your recent inquiry! We are pleased to offer the following quotation for the requested items.</p>
        
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          <thead>
            <tr style="background:#f3f4f6;">
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:left;">Product</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:right;">Unit Price</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:center;">Qty</th>
              <th style="padding:10px;border:1px solid #e5e7eb;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>${itemsTableRows}</tbody>
        </table>

        <div style="background:#f8f9fa;padding:16px;border-left:3px solid #7c3aed;border-radius:0 4px 4px 0;margin:20px 0;">
          <p style="font-weight:bold;margin:0 0 8px;">Payment Terms</p>
          <ul style="margin:0;padding-left:20px;color:#6b7280;font-size:13px;">
            <li>50% advance along with confirmed formal PO.</li>
            <li>Balance 50% prior to dispatch from our warehouse.</li>
            <li>Price validity: 15 days from date of quotation.</li>
          </ul>
        </div>

        <p>We look forward to serving you. Please let us know if you need any clarifications.</p>
        <br/>
        <p style="font-weight:bold;">TradeMind Sourcing Team</p>
        <p style="color:#6b7280;font-size:12px;">contact@trademind.com | +91-9876543210</p>
      </div>
    </div>
  `;

  try {
    await sendEmail({
      to: clientEmail,
      subject: `Quotation Details - Ref: ${inquiry.inquiryNumber}`,
      html,
    });
  } catch (err) {
    console.error(`❌ Failed to send quote email to ${clientEmail}:`, err.message);
  }
};

/**
 * Fetch emails from Gmail inbox via IMAP
 * @param {number} maxResults - Maximum number of emails to fetch
 * @returns {Promise<Array>} Array of parsed email objects
 */
const fetchInboxEmails = (maxResults = 50) => {
  return new Promise((resolve, reject) => {
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      return reject(new Error('Gmail not configured'));
    }

    const imap = new Imap({
      user: config.GMAIL_USER,
      password: config.GMAIL_APP_PASSWORD,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    const emails = [];

    imap.once('ready', () => {
      imap.openBox('INBOX', true, (err, box) => {
        if (err) {
          imap.end();
          return reject(err);
        }

        const totalMessages = box.messages.total;
        if (totalMessages === 0) {
          imap.end();
          return resolve([]);
        }

        const startSeq = Math.max(1, totalMessages - maxResults + 1);
        const fetchRange = `${startSeq}:${totalMessages}`;

        const f = imap.seq.fetch(fetchRange, {
          bodies: '',
          struct: true,
        });

        f.on('message', (msg) => {
          msg.on('body', (stream) => {
            simpleParser(stream, (err, parsed) => {
              if (err) {
                console.error('Parse error:', err);
                return;
              }
              emails.push({
                id: parsed.messageId || `msg-${Date.now()}-${Math.random()}`,
                subject: parsed.subject || '(No Subject)',
                sender: {
                  emailAddress: {
                    name: parsed.from?.value?.[0]?.name || '',
                    address: parsed.from?.value?.[0]?.address || '',
                  },
                },
                bodyPreview: (parsed.text || '').substring(0, 200),
                body: {
                  contentType: parsed.html ? 'html' : 'text',
                  content: parsed.html || parsed.text || '',
                },
                receivedDateTime: parsed.date?.toISOString() || new Date().toISOString(),
                isRead: false,
              });
            });
          });
        });

        f.once('error', (err) => {
          imap.end();
          reject(err);
        });

        f.once('end', () => {
          imap.end();
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('end', () => {
      // Sort newest first
      emails.sort((a, b) => new Date(b.receivedDateTime) - new Date(a.receivedDateTime));
      resolve(emails);
    });

    imap.connect();
  });
};

/**
 * Fetch a single email by its messageId
 * @param {string} messageId - The email message ID
 * @returns {Promise<Object|null>} The parsed email or null
 */
const fetchEmailById = async (messageId) => {
  // For simplicity, fetch all and find by ID
  // In production, you'd search by Message-ID header
  const emails = await fetchInboxEmails(100);
  return emails.find(e => e.id === messageId) || null;
};

module.exports = {
  sendEmail,
  sendRFQEmail,
  sendQuoteEmail,
  fetchInboxEmails,
  fetchEmailById,
};
