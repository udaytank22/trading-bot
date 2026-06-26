const request = require('supertest');
const server = require('../src/server');

describe('Rate Limiter', () => {
  it('should allow valid requests', async () => {
    const res = await request(server).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should enforce 404 cleanly when route missing', async () => {
    const res = await request(server).get('/api/invalid-route');
    expect(res.statusCode).toBe(404);
  });
});
