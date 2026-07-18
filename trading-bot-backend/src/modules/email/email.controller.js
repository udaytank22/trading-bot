const emailService = require('./email.service');

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
    const emails = await emailService.fetchInboxEmails(50);
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

module.exports = {
  getAuthStatus,
  getEmails,
  getEmailById,
  sendTestEmail,
};
