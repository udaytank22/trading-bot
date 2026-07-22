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
    const { emailId, subject, body, senderEmail } = req.body;
    if (!subject || !body) {
      return res.status(400).json({ message: 'Subject and body are required to run AI analysis' });
    }

    const aiResult = await analyzeEmailWithAI(subject, body, senderEmail);

    let dbRecord = null;
    let actionMessage = '';

    if (aiResult.category === 'TASK') {
      dbRecord = await tasksService.createTask({
        title: aiResult.taskDetails.title,
        description: aiResult.taskDetails.description,
        priority: aiResult.taskDetails.priority,
        suggestedEmployeeName: aiResult.taskDetails.suggestedEmployeeName,
        suggestedDepartment: aiResult.taskDetails.suggestedDepartment,
        emailId: emailId || null
      });
      actionMessage = `Created a new task "${dbRecord.title}" and assigned it to employee "${dbRecord.assignedEmployee ? dbRecord.assignedEmployee.fullName : 'None'}".`;

    } else if (aiResult.category === 'NEW_INQUIRY') {
      dbRecord = await inquiriesService.createPublicInquiry({
        clientEmail: aiResult.inquiryDetails.clientEmail || senderEmail,
        clientName: aiResult.inquiryDetails.clientName || (senderEmail ? senderEmail.split('@')[0] : 'Client'),
        clientPhone: null,
        company: aiResult.inquiryDetails.company || null,
        address: null,
        vesselName: aiResult.inquiryDetails.vesselName || null,
        imoNumber: aiResult.inquiryDetails.imoNumber || null,
        items: aiResult.inquiryDetails.items || []
      });
      actionMessage = `Created new Inquiry ${dbRecord.inquiryNumber} for client "${aiResult.inquiryDetails.clientName}".`;

    } else if (aiResult.category === 'INQUIRY_UPDATE') {
      const inquiryNum = aiResult.inquiryUpdateDetails.inquiryNumber;
      if (!inquiryNum || inquiryNum === 'UNKNOWN') {
        actionMessage = `Email classified as inquiry update, but no valid inquiry number was found.`;
      } else {
        const inquiry = await prisma.inquiry.findFirst({
          where: {
            inquiryNumber: { equals: inquiryNum.trim(), mode: 'insensitive' },
            deletedAt: null
          }
        });

        if (inquiry) {
          // Update remarks and status history
          await prisma.inquiryStatusHistory.create({
            data: {
              inquiryId: inquiry.id,
              fromStatus: inquiry.currentStatus,
              toStatus: inquiry.currentStatus,
              changedById: req.user.id,
              remarks: `[AI Email Update]: ${aiResult.inquiryUpdateDetails.remarks}`
            }
          });

          dbRecord = await prisma.inquiry.update({
            where: { id: inquiry.id },
            data: {
              remarks: inquiry.remarks 
                ? `${inquiry.remarks}\n\n[AI Email Update]: ${aiResult.inquiryUpdateDetails.remarks}` 
                : `[AI Email Update]: ${aiResult.inquiryUpdateDetails.remarks}`
            }
          });
          actionMessage = `Found and updated Inquiry ${inquiryNum} with client updates.`;
        } else {
          actionMessage = `Email classified as update for Inquiry ${inquiryNum}, but it was not found in our system.`;
        }
      }
    } else {
      actionMessage = 'AI determined this email does not require automated workflow actions.';
    }

    return res.status(200).json({
      success: true,
      category: aiResult.category,
      explanation: aiResult.explanation,
      message: actionMessage,
      aiResult,
      dbRecord
    });
  } catch (error) {
    console.error('[Email AI process] Error:', error);
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
};

