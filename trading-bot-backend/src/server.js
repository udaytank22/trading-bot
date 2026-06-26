const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const config = require('./config');
const errorHandler = require('./middleware/error.middleware');
const { globalLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/response');
const http = require('http');
const { Server } = require('socket.io');
const { verifyAccessToken } = require('./utils/token');
const chatService = require('./modules/chat/chat.service');

const app = express();
const httpServer = http.createServer(app);

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || config.ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      const error = new Error('Not allowed by CORS');
      error.statusCode = 403;
      callback(error);
    }
  },
  credentials: true
};

// Setup Socket.io
const io = new Server(httpServer, {
  cors: {
    ...corsOptions,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Expose io instance to the app and global
app.set('io', io);
global.io = io;

// Socket.io Auth Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = verifyAccessToken(token);
    socket.user = decoded;
    // user joins their own room for direct notifications
    socket.join(`user_${decoded.userId}`);
    next();
  } catch(err) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id} (User: ${socket.user.userId})`);
  
  socket.on('send_message', async (data) => {
    try {
      const { receiverId, content, type, fileName, fileSize, fileUrl } = data;
      const senderId = socket.user.userId;
      
      const savedMessage = await chatService.saveMessage({
        senderId,
        receiverId,
        content,
        type: type || 'text',
        fileName,
        fileSize,
        fileUrl
      });
      
      // Emit to receiver
      io.to(`user_${receiverId}`).emit('receive_message', savedMessage);
      
      // Emit to sender so they get the DB ID and timestamp
      socket.emit('message_sent', savedMessage);
    } catch (error) {
      console.error('[Socket] Error sending message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  socket.on('mark_as_read', async (data) => {
    try {
      const { senderId } = data; // The user whose messages we are reading
      const receiverId = socket.user.userId; // Current user
      await chatService.markAsRead(senderId, receiverId);
    } catch (error) {
      console.error('[Socket] Error marking messages as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// Security and middleware setup
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(cors(corsOptions));
const defaultJson = express.json({ limit: '2mb' });
const defaultUrl = express.urlencoded({ limit: '2mb', extended: true });
const largeJson = express.json({ limit: '50mb' });
const largeUrl = express.urlencoded({ limit: '50mb', extended: true });

app.use((req, res, next) => {
  const isLargePayload = req.originalUrl.includes('/bulk') || req.originalUrl.includes('/documents');
  if (isLargePayload) {
    return largeJson(req, res, (err) => {
      if (err) return next(err);
      largeUrl(req, res, next);
    });
  }
  return defaultJson(req, res, (err) => {
    if (err) return next(err);
    defaultUrl(req, res, next);
  });
});
app.use('/api', globalLimiter);

// Server check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Trading ERP and Trading Bot Backend REST API',
    version: '1.0.0'
  });
});

// Module routes
app.use('/api/auth', require('./modules/auth/auth.routes'));
app.use('/api/users', require('./modules/users/users.routes'));
app.use('/api/roles', require('./modules/roles/roles.routes'));
app.use('/api/permissions', require('./modules/permissions/permissions.routes'));
app.use('/api/clients', require('./modules/clients/clients.routes'));
app.use('/api/suppliers', require('./modules/suppliers/suppliers.routes'));
app.use('/api/products', require('./modules/products/products.routes'));
app.use('/api/inquiries', require('./modules/inquiries/inquiries.routes'));
app.use('/api/quotations', require('./modules/quotations/quotations.routes'));
app.use('/api/purchase-orders', require('./modules/purchaseOrders/purchaseOrders.routes'));
app.use('/api/shipments', require('./modules/shipments/shipments.routes'));
app.use('/api/invoices', require('./modules/invoices/invoices.routes'));
app.use('/api/payments', require('./modules/payments/payments.routes'));
app.use('/api/inventory', require('./modules/inventory/inventory.routes'));
app.use('/api/employees', require('./modules/employees/employees.routes'));
app.use('/api/bank-accounts', require('./modules/bankAccounts/bankAccounts.routes'));
app.use('/api/documents', require('./modules/documents/documents.routes'));
app.use('/api/notifications', require('./modules/notifications/notifications.routes'));
app.use('/api/reports', require('./modules/reports/reports.routes'));
app.use('/api/audit-logs', require('./modules/auditLogs/auditLogs.routes'));
app.use('/api/vehicles', require('./modules/vehicles/vehicles.routes'));
app.use('/api/outlook', require('./modules/outlook/outlook.routes'));
app.use('/api/chat', require('./modules/chat/chat.routes'));

// Catch-all route not found handler
app.use((req, res, next) => {
  return sendError(res, `API route not found: [${req.method}] ${req.originalUrl}`, [], 404);
});

// Global central error handler
app.use(errorHandler);

const server = httpServer.listen(config.PORT, () => {
  console.log(`[Server] running in ${config.NODE_ENV} mode on port ${config.PORT}`);
});

module.exports = server;