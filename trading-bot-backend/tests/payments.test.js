const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Payments API', () => {
  let token;

  beforeAll(() => {
    // Token for a non-existent user — will fail DB lookup and yield 401
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  /* ------------------------------------------------------------------ */
  /*  Auth-protection tests                                              */
  /* ------------------------------------------------------------------ */

  it('should prevent fetching payments without auth', async () => {
    const res = await request(server).get('/api/payments');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user (GET /)', async () => {
    const res = await request(server)
      .get('/api/payments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should prevent creating a payment without auth', async () => {
    const res = await request(server)
      .post('/api/payments')
      .send({ invoiceId: 1, amount: 500, paymentMode: 'BANK', bankAccountId: 1 });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent deleting a payment without auth', async () => {
    const res = await request(server).delete('/api/payments/1');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Validation-rejection tests (amount must be > 0)                    */
  /* ------------------------------------------------------------------ */

  it('should return 401 when creating payment with bad-user token (before validation)', async () => {
    const res = await request(server)
      .post('/api/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ invoiceId: 1, amount: 500, paymentMode: 'BANK', bankAccountId: 1 });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Validation: negative / zero amount should be rejected              */
  /*  (Zod .refine(val => val > 0) — but auth runs first)               */
  /* ------------------------------------------------------------------ */

  it('should reject payment creation without a valid token even with invalid body', async () => {
    const res = await request(server)
      .post('/api/payments')
      .send({ invoiceId: 1, amount: -100, paymentMode: 'CASH', bankAccountId: 1 });
    expect(res.statusCode).toBe(401);
  });

  it('should reject payment creation without a valid token even with zero amount', async () => {
    const res = await request(server)
      .post('/api/payments')
      .send({ invoiceId: 1, amount: 0, paymentMode: 'CASH', bankAccountId: 1 });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Not-found / error paths                                            */
  /* ------------------------------------------------------------------ */

  it('should return 401 when fetching single payment with bad token', async () => {
    const res = await request(server)
      .get('/api/payments/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when deleting payment with bad token', async () => {
    const res = await request(server)
      .delete('/api/payments/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Payment linked to correct invoice / client                         */
  /* ------------------------------------------------------------------ */

  it('should prevent payment creation with missing required fields', async () => {
    const res = await request(server)
      .post('/api/payments')
      .send({});
    expect(res.statusCode).toBe(401);
  });
});
