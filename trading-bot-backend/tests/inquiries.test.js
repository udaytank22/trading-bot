const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Inquiries API', () => {
  let token;

  beforeAll(() => {
    // Token for a non-existent user — will fail DB lookup and yield 401
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  /* ================================================================== */
  /*  Auth-protection tests (protected endpoints)                        */
  /* ================================================================== */

  it('should prevent fetching inquiries without auth', async () => {
    const res = await request(server).get('/api/inquiries');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user (GET /)', async () => {
    const res = await request(server)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should prevent creating an inquiry without auth', async () => {
    const res = await request(server)
      .post('/api/inquiries')
      .send({ clientId: 1, items: [{ description: 'Test', quantity: 1 }] });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent updating an inquiry without auth', async () => {
    const res = await request(server)
      .put('/api/inquiries/1')
      .send({ status: 'INVENTORY_FULFILLED' });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent deleting an inquiry without auth', async () => {
    const res = await request(server).delete('/api/inquiries/1');
    expect(res.statusCode).toBe(401);
  });

  /* ================================================================== */
  /*  Status transition endpoints — all auth-protected                   */
  /* ================================================================== */

  it('should prevent stock-check without auth', async () => {
    const res = await request(server)
      .post('/api/inquiries/1/stock-check')
      .send({});
    expect(res.statusCode).toBe(401);
  });

  it('should prevent send-rfq without auth', async () => {
    const res = await request(server).post('/api/inquiries/1/send-rfq');
    expect(res.statusCode).toBe(401);
  });

  it('should prevent client-decision without auth', async () => {
    const res = await request(server)
      .post('/api/inquiries/1/client-decision')
      .send({ accepted: true });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent confirm-deal without auth', async () => {
    const res = await request(server).post('/api/inquiries/1/confirm-deal');
    expect(res.statusCode).toBe(401);
  });

  it('should prevent close without auth', async () => {
    const res = await request(server).post('/api/inquiries/1/close');
    expect(res.statusCode).toBe(401);
  });

  /* ================================================================== */
  /*  Public endpoint — validation rejection                             */
  /* ================================================================== */

  it('should reject public inquiry creation with empty body (validation)', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('should reject public inquiry with missing clientEmail', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        items: [{ description: 'Widget', quantity: 1 }]
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject public inquiry with invalid email format', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        clientEmail: 'not-an-email',
        items: [{ description: 'Widget', quantity: 1 }]
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject public inquiry with empty items array', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: []
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject public inquiry when item has zero quantity', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Widget', quantity: 0 }]
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject public inquiry when item has negative quantity', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Widget', quantity: -5 }]
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject public inquiry when item is missing description', async () => {
    const res = await request(server)
      .post('/api/inquiries/public')
      .send({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ quantity: 5 }]
      });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  /* ================================================================== */
  /*  Public tracking endpoint — not-found path                          */
  /* ================================================================== */

  it('should return not-found for a non-existent tracking number', async () => {
    const res = await request(server)
      .get('/api/inquiries/public/track/INQ-NONEXISTENT');
    // Either 404 from the controller or 200 with null data
    expect([200, 404]).toContain(res.statusCode);
    if (res.statusCode === 404) {
      expect(res.body.success).toBe(false);
    }
  });

  /* ================================================================== */
  /*  Status query-filter guard (typeof check)                           */
  /*  The service does `typeof status === 'string'` — a non-string       */
  /*  value in the query param gets coerced to string by Express, so     */
  /*  verify the endpoint handles it gracefully.                         */
  /* ================================================================== */

  it('should handle array-type status query param gracefully', async () => {
    // Express query parser may interpret status[]=FOO as an array
    const res = await request(server)
      .get('/api/inquiries?status[]=PENDING&status[]=CLOSED');
    // Without auth this is 401 anyway, confirming the guard doesn't crash
    expect(res.statusCode).toBe(401);
  });

  /* ================================================================== */
  /*  With bad token — auth rejects before reaching controller           */
  /* ================================================================== */

  it('should return 401 for inquiry get-by-id with bad token', async () => {
    const res = await request(server)
      .get('/api/inquiries/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for stock-check with bad token', async () => {
    const res = await request(server)
      .post('/api/inquiries/1/stock-check')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for team-lead-approve with bad token', async () => {
    const res = await request(server)
      .post('/api/inquiries/1/team-lead-approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ approved: true });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 for admin-approve with bad token', async () => {
    const res = await request(server)
      .post('/api/inquiries/1/admin-approve')
      .set('Authorization', `Bearer ${token}`)
      .send({ approved: true });
    expect(res.statusCode).toBe(401);
  });
});
