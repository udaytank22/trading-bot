const emailService = require('./email.service');
const { analyzeEmailWithAI } = require('../../utils/ai.service');
const tasksService = require('../tasks/tasks.service');
const inquiriesService = require('../inquiries/inquiries.service');
const prisma = require('../../prisma/client');


/**
 * Get Gmail authentication status
 */
const getAuthStatus = async (req, res, next) => {
  try {
    const config = require('../../config');
    const isConfigured = !!(config.GMAIL_USER && config.GMAIL_APP_PASSWORD);
    
    res.json({
      authenticated: isConfigured,
      email: isConfigured ? config.GMAIL_USER : null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get emails from Gmail inbox via IMAP
 */
const getEmails = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const search = req.query.search || '';
    const folder = req.query.folder || 'inbox';

    const { emails, total } = await emailService.fetchInboxEmails(page, limit, search, folder);
    
    res.setHeader('X-Total-Count', total);
    res.setHeader('Access-Control-Expose-Headers', 'X-Total-Count');
    res.json(emails);
  } catch (error) {
    if (error.message === 'Gmail not configured') {
      return res.status(401).json({ message: 'Gmail not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD in .env' });
    }
    console.error('Fetch Gmail emails error:', error);
    next(error);
  }
};

/**
 * Get a single email by ID
 */
const getEmailById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const email = await emailService.fetchEmailById(decodeURIComponent(id));

    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    res.json(email);
  } catch (error) {
    if (error.message === 'Gmail not configured') {
      return res.status(401).json({ message: 'Gmail not configured' });
    }
    next(error);
  }
};

/**
 * Send a test email to verify Gmail SMTP configuration
 */
const sendTestEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to) {
      return res.status(400).json({ message: 'Recipient email (to) is required' });
    }

    await emailService.sendEmail({
      to,
      subject: 'TradeMind — Gmail SMTP Test',
      html: `
        <div style="font-family:Arial,sans-serif;padding:20px;">
          <h2 style="color:#7c3aed;">✅ Gmail SMTP Working!</h2>
          <p>This is a test email from your TradeMind Trading Bot.</p>
          <p style="color:#6b7280;font-size:12px;">Sent at: ${new Date().toISOString()}</p>
        </div>
      `,
    });

    res.json({ success: true, message: `Test email sent to ${to}` });
  } catch (error) {
    console.error('Send test email error:', error);
    next(error);
  }
};

/**
 * Send custom email (e.g. for compose, reply, forward)
 */
const sendCustomEmail = async (req, res, next) => {
  try {
    const { to, subject, html, text } = req.body;
    if (!to) {
      return res.status(400).json({ message: 'Recipient email (to) is required' });
    }

    await emailService.sendEmail({
      to,
      subject: subject || '(No Subject)',
      html: html || '',
      text: text || '',
    });

    res.json({ success: true, message: `Email sent to ${to}` });
  } catch (error) {
    if (error.message === 'Gmail not configured') {
      return res.status(401).json({ message: 'Gmail not configured' });
    }
    console.error('Send email error:', error);
    next(error);
  }
};

/**
 * Run AI categorization on an email and trigger workflow actions
 */
const processAI = async (req, res, next) => {
  try {
    const { emailId } = req.body;
    if (!emailId) {
      return res.status(400).json({ message: 'Email ID is required to run AI analysis' });
    }

    const { processIncomingEmail } = require('../../utils/ai.emailProcessor');
    const email = await emailService.fetchEmailById(emailId);
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    // Soft delete any existing inquiries associated with this emailId to allow fresh manual reprocessing
    await prisma.inquiry.updateMany({
      where: { emailId: email.id, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false }
    });

    const result = await processIncomingEmail(email);

    return res.status(200).json({
      success: true,
      category: result.category || 'UNKNOWN',
      explanation: result.details?.explanation || '',
      message: result.status === 'created' 
        ? `Created new Inquiry ${result.inquiry.inquiryNumber}.` 
        : result.status === 'updated' 
        ? `Updated Inquiry ${result.inquiry.inquiryNumber}.` 
        : `Email processed: ${result.reason || result.status}`,
      dbRecord: result.inquiry || result.record || null,
      aiResult: result.details || null
    });
  } catch (error) {
    console.error('[Email AI process] Error:', error);
    next(error);
  }
};

/**
 * Download or view email attachment
 */
const getEmailAttachment = async (req, res, next) => {
  try {
    const { id, filename } = req.params;
    const email = await emailService.fetchEmailById(decodeURIComponent(id));
    if (!email) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const attachment = email.attachments?.find(
      att => att.filename === decodeURIComponent(filename)
    );

    if (!attachment || !attachment.content) {
      return res.status(404).json({ message: 'Attachment not found or has no content' });
    }

    res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.filename)}"`);
    return res.send(attachment.content);
  } catch (error) {
    if (error.message === 'Gmail not configured') {
      return res.status(401).json({ message: 'Gmail not configured' });
    }
    next(error);
  }
};

module.exports = {
  getAuthStatus,
  getEmails,
  getEmailById,
  sendTestEmail,
  sendCustomEmail,
  processAI,
  getEmailAttachment,
};

