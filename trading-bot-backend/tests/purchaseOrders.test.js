const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Purchase Orders API', () => {
  let token;

  beforeAll(() => {
    // Token for a non-existent user — will fail DB lookup and yield 401
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  /* ------------------------------------------------------------------ */
  /*  Auth-protection tests                                              */
  /* ------------------------------------------------------------------ */

  it('should prevent fetching purchase orders without auth', async () => {
    const res = await request(server).get('/api/purchase-orders');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user (GET /)', async () => {
    const res = await request(server)
      .get('/api/purchase-orders')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should prevent creating a purchase order without auth', async () => {
    const res = await request(server)
      .post('/api/purchase-orders')
      .send({ supplierId: 1, clientId: 1, amount: 5000 });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent updating a purchase order without auth', async () => {
    const res = await request(server)
      .put('/api/purchase-orders/1')
      .send({ status: 'ORDERED' });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent deleting a purchase order without auth', async () => {
    const res = await request(server).delete('/api/purchase-orders/1');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Status update — with bad token                                     */
  /* ------------------------------------------------------------------ */

  it('should return 401 when updating PO status with bad token', async () => {
    const res = await request(server)
      .put('/api/purchase-orders/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'ORDERED' });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Not-found / error paths                                            */
  /* ------------------------------------------------------------------ */

  it('should return 401 for single PO fetch with bad token', async () => {
    const res = await request(server)
      .get('/api/purchase-orders/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when deleting PO with bad token', async () => {
    const res = await request(server)
      .delete('/api/purchase-orders/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Send email endpoint — auth-protected                               */
  /* ------------------------------------------------------------------ */

  it('should prevent sending PO email without auth', async () => {
    const res = await request(server).post('/api/purchase-orders/1/send-email');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when sending PO email with bad token', async () => {
    const res = await request(server)
      .post('/api/purchase-orders/1/send-email')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });
});
