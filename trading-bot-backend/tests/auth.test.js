const request = require('supertest');
const server = require('../src/server');

describe('Auth API', () => {
  it('should reject login without credentials', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject login with wrong credentials', async () => {
    const res = await request(server)
      .post('/api/auth/login')
      .send({ email: 'fake@example.com', password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
