const server = require('../src/server');
const prisma = require('../src/config/db');

afterAll(async () => {
  server.close();
  await prisma.$disconnect();
});
