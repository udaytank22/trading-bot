const request = require('supertest');
const server = require('../src/server');
const { checkPermission } = require('../src/middleware/permission.middleware');
const { sendError } = require('../src/utils/response');

// Mock a simple express app to test the middleware directly
const express = require('express');
const app = express();

app.get('/test-permission', 
  (req, res, next) => {
    // Fake the auth middleware placing user with permissions
    req.user = {
      role: {
        permissions: [
          { permission: { module: 'dashboard', action: 'view', isActive: true } }
        ]
      }
    };
    next();
  },
  checkPermission('dashboard', 'view'),
  (req, res) => res.json({ success: true })
);

app.get('/test-permission-denied', 
  (req, res, next) => {
    req.user = {
      role: { permissions: [] }
    };
    next();
  },
  checkPermission('dashboard', 'view'),
  (req, res) => res.json({ success: true })
);

describe('Permission Middleware', () => {
  it('should allow access if permission is granted', async () => {
    const res = await request(app).get('/test-permission');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should block access if permission is missing', async () => {
    const res = await request(app).get('/test-permission-denied');
    expect(res.statusCode).toBe(403);
  });
});
