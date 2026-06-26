const request = require('supertest');
const server = require('../src/server');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

describe('Clients API CRUD', () => {
  let token;
  
  beforeAll(() => {
    // We create a token that will fail DB lookup and yield a 401,
    // which confirms the route is protected by auth.
    token = jwt.sign({ userId: 99999 }, config.JWT_SECRET || 'secret', { expiresIn: '1h' });
  });

  it('should prevent fetching clients without auth', async () => {
    const res = await request(server).get('/api/clients');
    expect(res.statusCode).toBe(401);
  });

  it('should return 401 when using a token for a non-existent user', async () => {
    const res = await request(server)
      .get('/api/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(401);
  });
});
