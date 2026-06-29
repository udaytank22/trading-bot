const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is missing. Cannot generate token for load testing.');
  process.exit(1);
}

// Generate valid mock tokens for 50 distinct users
const NUM_USERS = 50;
const tokens = [];
for (let i = 1; i <= NUM_USERS; i++) {
  tokens.push(
    jwt.sign(
      {
        userId: i,
        email: `user${i}@trademind.com`,
        role: i % 10 === 0 ? 'Super Admin' : 'Sales Representative'
      },
      secret,
      { expiresIn: '1h' }
    )
  );
}

const PORT = process.env.PORT || 5001;
const target = `http://localhost:${PORT}`;

async function runTest(url, connections, amount, title, method = 'GET', body = null) {
  console.log(`\n=== Running Load Test: ${title} ===`);
  console.log(`URL: ${url}`);
  console.log(`Connections: ${connections}, Target Requests: ${amount}`);
  
  return new Promise((resolve, reject) => {
    let tokenIndex = 0;
    
    const instance = autocannon({
      url,
      connections,
      amount,
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        'Content-Type': 'application/json'
      },
      setupClient: (client) => {
        // Rotate through tokens
        const token = tokens[tokenIndex];
        tokenIndex = (tokenIndex + 1) % tokens.length;
        client.setHeaders({
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        });
      }
    }, (err, result) => {
      if (err) return reject(err);
      
      console.log(`\nResults for ${title}:`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`2xx Responses: ${result.2xx}`);
      console.log(`429 Responses: ${result.429}`);
      console.log(`5xx Errors: ${result.5xx}`);
      console.log(`Total Errors: ${result.errors}`);
      console.log(`Time taken: ${result.duration}s`);
      console.log(`Avg Req/sec: ${result.requests.average}`);
      console.log(`Avg Latency: ${result.latency.average}ms`);
      console.log(`P95 Latency: ${result.latency.p95}ms`);
      console.log(`P99 Latency: ${result.latency.p99}ms`);
      
      resolve(result);
    });
    
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  // Simulating real traffic mixing lists and creates
  try {
    await runTest(`${target}/api/clients?page=1&pageSize=50`, 50, 1000, 'Clients List (Pagination)');
    await runTest(`${target}/api/products?page=1&pageSize=50`, 50, 1000, 'Products List (Pagination)');
    await runTest(`${target}/api/inquiries?page=1&pageSize=50`, 50, 1000, 'Inquiries List (Pagination)');
    
    // Mix in some POST requests
    const dummyClient = {
      name: "Load Test Client",
      email: "loadtest@example.com",
      companyName: "Test Co",
      phone: "1234567890",
      address: "123 Test St",
      city: "Test City",
      state: "TS",
      zipCode: "12345",
      country: "Testland",
      status: "ACTIVE"
    };
    await runTest(`${target}/api/clients`, 20, 200, 'Create Client (Write)', 'POST', dummyClient);
    
    console.log('\nAll load tests completed.');
  } catch (err) {
    console.error('Load test failed:', err);
  }
}

main();
