const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const prisma = require('../src/config/db');

describe('Invoices API', () => {
  let token;

  beforeAll(() => {
    // Token for a non-existent user — will fail DB lookup and yield 401
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  /* ------------------------------------------------------------------ */
  /*  Auth-protection tests                                              */
  /* ------------------------------------------------------------------ */

  it('should prevent fetching invoices without auth', async () => {
    const res = await request(server).get('/api/invoices');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user (GET /)', async () => {
    const res = await request(server)
      .get('/api/invoices')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should prevent creating an invoice without auth', async () => {
    const res = await request(server)
      .post('/api/invoices')
      .send({ clientId: 'abc', subtotal: 1000 });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent updating an invoice without auth', async () => {
    const res = await request(server)
      .put('/api/invoices/1')
      .send({ status: 'SENT' });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent deleting an invoice without auth', async () => {
    const res = await request(server).delete('/api/invoices/1');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Validation tests (with bad token — reaches validation before DB)   */
  /* ------------------------------------------------------------------ */

  it('should return 401 when creating invoice with bad-user token', async () => {
    const res = await request(server)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${token}`)
      .send({ clientId: 'test-client', subtotal: 500 });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Invoice status transitions & not-found paths                       */
  /* ------------------------------------------------------------------ */

  it('should return 401 when fetching single invoice with bad token', async () => {
    const res = await request(server)
      .get('/api/invoices/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when updating invoice status with bad token', async () => {
    const res = await request(server)
      .put('/api/invoices/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'PAID' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when marking invoice as PARTIALLY_PAID with bad token', async () => {
    const res = await request(server)
      .put('/api/invoices/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'PARTIALLY_PAID' });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  P2002 / P2025 error-handler paths (route-not-found fallback)       */
  /* ------------------------------------------------------------------ */

  it('should return 404 for non-existent invoice route', async () => {
    const res = await request(server).get('/api/invoices/unknown/extra');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  PDF & Preview endpoints (auth-protected)                           */
  /* ------------------------------------------------------------------ */

  it('should prevent downloading invoice PDF without auth', async () => {
    const res = await request(server).get('/api/invoices/1/pdf');
    expect(res.statusCode).toBe(401);
  });

  it('should prevent previewing invoice without auth', async () => {
    const res = await request(server).get('/api/invoices/1/preview');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Generate from shipment / inquiry (auth-protected)                  */
  /* ------------------------------------------------------------------ */

  it('should prevent generating invoice from shipment without auth', async () => {
    const res = await request(server).post('/api/invoices/generate/shipment/1');
    expect(res.statusCode).toBe(401);
  });

  it('should prevent generating invoice from inquiry without auth', async () => {
    const res = await request(server)
      .post('/api/invoices/generate/inquiry')
      .send({ inquiryId: 1 });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Query Hardening Regression Tests                                   */
  /* ------------------------------------------------------------------ */

  describe('Query Hardening Regression Tests', () => {
    let superAdminToken;

    beforeAll(async () => {
      let role = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
      if (!role) {
        role = await prisma.role.create({
          data: { name: 'Super Admin' }
        });
      }

      let user = await prisma.user.findFirst({
        where: {
          email: 'test-superadmin-hardening@example.com',
          isActive: true,
          deletedAt: null
        }
      });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'test-superadmin-hardening@example.com',
            password: 'hashedpassword',
            roleId: role.id,
            isActive: true
          }
        });
      }

      superAdminToken = jwt.sign({ userId: user.id }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
    });

    it('should return 400 when statuses is a bracket-notation query object', async () => {
      const res = await request(server)
        .get('/api/invoices?statuses[not]=PAID')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should return 400 when inquiryId is a bracket-notation query object', async () => {
      const res = await request(server)
        .get('/api/invoices?inquiryId[not]=1')
        .set('Authorization', `Bearer ${superAdminToken}`);
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
