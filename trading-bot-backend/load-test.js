const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
require('dotenv').config();

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is missing. Cannot generate token for load testing.');
  process.exit(1);
}

const PORT = process.env.PORT || 5001;
const target = `http://localhost:${PORT}`;

async function seedAndGetTestData() {
  const prisma = new PrismaClient();
  try {
    console.log('Seeding or reusing load test users...');
    let adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
      adminRole = await prisma.role.create({ data: { name: 'Admin' } });
    }
    let employeeRole = await prisma.role.findFirst({ where: { name: 'Employee' } });
    if (!employeeRole) {
      employeeRole = await prisma.role.create({ data: { name: 'Employee' } });
    }

    const seededUsers = [];
    for (let i = 1; i <= 100; i++) {
      const email = `loadtest_user_${i}@example.com`;
      let user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: 'dummy_password_hash',
            roleId: i % 2 === 0 ? adminRole.id : employeeRole.id,
            isActive: true
          }
        });
      }
      seededUsers.push({
        id: user.id,
        email: user.email,
        role: i % 2 === 0 ? 'Admin' : 'Employee'
      });
    }

    // Fetch existing entity IDs for realistic detail fetches
    const clients = await prisma.client.findMany({ take: 10, select: { id: true } });
    const products = await prisma.product.findMany({ take: 10, select: { id: true } });
    const inquiries = await prisma.inquiry.findMany({ take: 10, select: { id: true } });
    const invoices = await prisma.invoice.findMany({ take: 10, select: { id: true } });
    const purchaseOrders = await prisma.purchaseOrder.findMany({ take: 10, select: { id: true } });

    return {
      users: seededUsers,
      clientIds: clients.map(c => c.id),
      productIds: products.map(p => p.id),
      inquiryIds: inquiries.map(i => i.id),
      invoiceIds: invoices.map(i => i.id),
      purchaseOrderIds: purchaseOrders.map(p => p.id)
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function runLoadTest() {
  const testData = await seedAndGetTestData();
  const tokens = testData.users.map(u => 
    jwt.sign({ userId: u.id, email: u.email, role: u.role }, secret, { expiresIn: '2h' })
  );

  console.log(`\n=== Starting Realistic Multi-User Load Test ===`);
  console.log(`Target: ${target}`);
  console.log(`Connections: 50, Duration: 20 seconds, Rate Limit: 200 req/sec`);
  console.log(`Rotating across ${tokens.length} authenticated users.`);

  return new Promise((resolve, reject) => {
    let tokenIndex = 0;
    
    const instance = autocannon({
      url: target,
      connections: 50,
      duration: 20,
      overallRate: 200, // Limit overall rate to 200 req/sec to stay safely under per-user rate limits
      requests: [
        {
          method: 'GET',
          path: '/api/clients?page=1&pageSize=10',
          setupRequest: (req) => {
            // 1. Rotate through tokens
            const token = tokens[tokenIndex];
            tokenIndex = (tokenIndex + 1) % tokens.length;
            req.headers = req.headers || {};
            req.headers['Authorization'] = `Bearer ${token}`;
            req.headers['X-Forwarded-For'] = `192.168.1.${tokenIndex + 1}`;

            // 2. Select realistic traffic:
            // - 50% list reads
            // - 30% detail/specific record reads
            // - 20% writes (creates)
            const rand = Math.random();
            if (rand < 0.50) {
              const lists = [
                '/api/clients?page=1&pageSize=10',
                '/api/products?page=1&pageSize=10',
                '/api/inquiries?page=1&pageSize=10',
                '/api/invoices?page=1&pageSize=10',
                '/api/payments?page=1&pageSize=10',
                '/api/purchase-orders?page=1&pageSize=10',
                '/api/shipments?page=1&pageSize=10'
              ];
              req.path = lists[Math.floor(Math.random() * lists.length)];
              req.method = 'GET';
              req.body = undefined;
              delete req.headers['content-type'];
              delete req.headers['Content-Type'];
              delete req.headers['content-length'];
              delete req.headers['Content-Length'];
            } else if (rand < 0.80) {
              const details = [];
              if (testData.clientIds.length > 0) details.push(`/api/clients/${testData.clientIds[Math.floor(Math.random() * testData.clientIds.length)]}`);
              if (testData.productIds.length > 0) details.push(`/api/products/${testData.productIds[Math.floor(Math.random() * testData.productIds.length)]}`);
              if (testData.inquiryIds.length > 0) details.push(`/api/inquiries/${testData.inquiryIds[Math.floor(Math.random() * testData.inquiryIds.length)]}`);
              if (testData.invoiceIds.length > 0) details.push(`/api/invoices/${testData.invoiceIds[Math.floor(Math.random() * testData.invoiceIds.length)]}`);
              if (testData.purchaseOrderIds.length > 0) details.push(`/api/purchase-orders/${testData.purchaseOrderIds[Math.floor(Math.random() * testData.purchaseOrderIds.length)]}`);

              req.path = details.length > 0 ? details[Math.floor(Math.random() * details.length)] : '/api/clients';
              req.method = 'GET';
              req.body = undefined;
              delete req.headers['content-type'];
              delete req.headers['Content-Type'];
              delete req.headers['content-length'];
              delete req.headers['Content-Length'];
            } else {
              const writes = [
                {
                  method: 'POST',
                  path: '/api/clients',
                  body: JSON.stringify({
                    name: `LT Client ${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    email: `lt_client_${Date.now()}_${Math.floor(Math.random()*1000)}@example.com`,
                    companyName: "Test Co",
                    phone: "1234567890",
                    status: "ACTIVE"
                  })
                },
                {
                  method: 'POST',
                  path: '/api/products',
                  body: JSON.stringify({
                    name: `LT Product ${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    sku: `LT-SKU-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    impa: `LT-IMPA-${Date.now()}-${Math.floor(Math.random()*1000)}`,
                    sellingPrice: 49.99,
                    purchasePrice: 29.99
                  })
                }
              ];
              const writeReq = writes[Math.floor(Math.random() * writes.length)];
              req.method = writeReq.method;
              req.path = writeReq.path;
              req.body = writeReq.body;
              req.headers['Content-Type'] = 'application/json';
              delete req.headers['content-length'];
              delete req.headers['Content-Length'];
            }
            return req;
          }
        }
      ],
      setupClient: (client) => {
        client.on('response', (statusCode, resBytes, responseHeaders) => {
          if (statusCode >= 400) {
            console.log(`[Autocannon Client Error] Status: ${statusCode}`);
          }
        });
      }
    }, (err, result) => {
      if (err) return reject(err);
      
      console.log(`\n=== Load Test Results ===`);
      console.log(`Requests/sec: ${result.requests.average}`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`2xx Responses: ${result['2xx']}`);
      console.log(`429 Responses: ${result.statusCodeStats['429'] ? result.statusCodeStats['429'].count : 0}`);
      console.log(`5xx Errors: ${result['5xx']}`);
      console.log(`Total Errors: ${result.errors}`);
      console.log(`Time taken: ${result.duration}s`);
      console.log(`p50 Latency: ${result.latency.p50}ms`);
      console.log(`p97.5 Latency: ${result.latency.p97_5}ms`);
      console.log(`p99 Latency: ${result.latency.p99}ms`);
      
      const outputText = `=== Load Test Results ===
Requests/sec: ${result.requests.average}
Total Requests: ${result.requests.total}
2xx Responses: ${result['2xx']}
429 Responses: ${result.statusCodeStats['429'] ? result.statusCodeStats['429'].count : 0}
5xx Errors: ${result['5xx']}
Total Errors: ${result.errors}
Time taken: ${result.duration}s
p50 Latency: ${result.latency.p50}ms
p97.5 Latency: ${result.latency.p97_5}ms
p99 Latency: ${result.latency.p99}ms
`;
      fs.writeFileSync('load_test_results_v2.txt', outputText);
      console.log('\nResults written to load_test_results_v2.txt');
      
      resolve(result);
    });
    
    autocannon.track(instance, { renderProgressBar: true });
  });
}

runLoadTest().catch(console.error);
