const msal = require('@azure/msal-node');
const { Client } = require('@microsoft/microsoft-graph-client');
const config = require('../../config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const msalConfig = {
  auth: {
    clientId: config.OUTLOOK_CLIENT_ID || 'dummy-client-id',
    clientSecret: config.OUTLOOK_CLIENT_SECRET || 'dummy-client-secret',
    authority: 'https://login.microsoftonline.com/common',
  }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

const getAuthUrl = async (req, res, next) => {
  try {
    const authCodeUrlParameters = {
      scopes: ['user.read', 'mail.read', 'mail.send', 'offline_access'],
      redirectUri: config.OUTLOOK_REDIRECT_URI,
      state: req.user.id.toString(), // pass user id in state to link account later
    };

    const url = await pca.getAuthCodeUrl(authCodeUrlParameters);
    res.json({ url });
  } catch (error) {
    next(error);
  }
};

const callback = async (req, res, next) => {
  try {
    const tokenRequest = {
      code: req.query.code,
      scopes: ['user.read', 'mail.read', 'mail.send', 'offline_access'],
      redirectUri: config.OUTLOOK_REDIRECT_URI,
    };

    const response = await pca.acquireTokenByCode(tokenRequest);
    const userId = parseInt(req.query.state, 10);

    if (userId && response.accessToken) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          outlookAccessToken: response.accessToken,
          outlookRefreshToken: response.refreshToken || null,
          outlookAccountId: response.account?.homeAccountId || null
        }
      });
    }

    // Redirect back to frontend
    res.redirect('http://localhost:5173/inbox?auth=success');
  } catch (error) {
    console.error('Outlook callback error:', error);
    res.redirect('http://localhost:5173/inbox?auth=error');
  }
};

const getEmails = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.outlookAccessToken) {
      return res.status(401).json({ message: 'Outlook not authenticated' });
    }

    // Initialize Graph client
    const client = Client.init({
      authProvider: (done) => {
        done(null, user.outlookAccessToken);
      }
    });

    // Fetch emails
    const messages = await client.api('/me/messages')
      .top(50)
      .select('id,subject,sender,bodyPreview,receivedDateTime,isRead,body')
      .orderby('receivedDateTime DESC')
      .get();

    res.json(messages.value);
  } catch (error) {
    console.error('Fetch emails error:', error);
    // If token expired, we could handle refresh logic here
    next(error);
  }
};

const getEmailById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user || !user.outlookAccessToken) {
      return res.status(401).json({ message: 'Outlook not authenticated' });
    }

    const { id } = req.params;

    const client = Client.init({
      authProvider: (done) => {
        done(null, user.outlookAccessToken);
      }
    });

    const message = await client.api(`/me/messages/${id}`).get();
    
    // Mark as read optionally
    if (!message.isRead) {
      await client.api(`/me/messages/${id}`).patch({ isRead: true });
    }

    res.json(message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAuthUrl,
  callback,
  getEmails,
  getEmailById
};
