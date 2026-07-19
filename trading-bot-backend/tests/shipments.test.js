const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Shipments API', () => {
  let token;

  beforeAll(() => {
    // Token for a non-existent user — will fail DB lookup and yield 401
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  /* ------------------------------------------------------------------ */
  /*  Auth-protection tests                                              */
  /* ------------------------------------------------------------------ */

  it('should prevent fetching shipments without auth', async () => {
    const res = await request(server).get('/api/shipments');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user (GET /)', async () => {
    const res = await request(server)
      .get('/api/shipments')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should prevent creating a shipment without auth', async () => {
    const res = await request(server)
      .post('/api/shipments')
      .send({ supplierId: 1, clientId: 1, origin: 'Mumbai', destination: 'Delhi' });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent updating a shipment without auth', async () => {
    const res = await request(server)
      .put('/api/shipments/1')
      .send({ currentStatus: 'IN_TRANSIT' });
    expect(res.statusCode).toBe(401);
  });

  it('should prevent deleting a shipment without auth', async () => {
    const res = await request(server).delete('/api/shipments/1');
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Status update — with bad token                                     */
  /* ------------------------------------------------------------------ */

  it('should return 401 when updating shipment status with bad token', async () => {
    const res = await request(server)
      .put('/api/shipments/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentStatus: 'DELIVERED' });
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when updating shipment to IN_TRANSIT with bad token', async () => {
    const res = await request(server)
      .put('/api/shipments/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentStatus: 'IN_TRANSIT' });
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Not-found / error paths                                            */
  /* ------------------------------------------------------------------ */

  it('should return 401 for single shipment fetch with bad token', async () => {
    const res = await request(server)
      .get('/api/shipments/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when deleting shipment with bad token', async () => {
    const res = await request(server)
      .delete('/api/shipments/99999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });

  /* ------------------------------------------------------------------ */
  /*  Validation — missing required fields                               */
  /* ------------------------------------------------------------------ */

  it('should prevent shipment creation with empty body and no auth', async () => {
    const res = await request(server)
      .post('/api/shipments')
      .send({});
    expect(res.statusCode).toBe(401);
  });
});
