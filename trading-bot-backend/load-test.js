const autocannon = require('autocannon');
const jwt = require('jsonwebtoken');
require('dotenv').config(); 

const secret = process.env.JWT_SECRET;
if (!secret) {
  console.error('JWT_SECRET is missing. Cannot generate token for load testing.');
  process.exit(1);
}

// Generate a valid mock admin token
const token = jwt.sign(
  {
    userId: 1, // assuming Super Admin is userId 1
    email: 'admin@trademind.com',
    role: 'Super Admin'
  },
  secret,
  { expiresIn: '1h' }
);

const PORT = process.env.PORT || 5001;
const target = `http://localhost:${PORT}`;

async function runTest(url, connections, amount, title) {
  console.log(`\n=== Running Load Test: ${title} ===`);
  console.log(`URL: ${url}`);
  console.log(`Connections: ${connections}, Target Requests: ${amount}`);
  
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      url,
      connections,
      amount, 
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }, (err, result) => {
      if (err) return reject(err);
      
      console.log(`\nResults for ${title}:`);
      console.log(`Total Requests: ${result.requests.total}`);
      console.log(`Total Errors: ${result.errors}`);
      console.log(`Time taken: ${result.duration}s`);
      console.log(`Avg Req/sec: ${result.requests.average}`);
      console.log(`Avg Latency: ${result.latency.average}ms`);
      console.log(`P99 Latency: ${result.latency.p99}ms`);
      
      resolve(result);
    });
    
    autocannon.track(instance, { renderProgressBar: true });
  });
}

async function main() {
  // We want to simulate a target of 1,000 req/min which is ~16.6 req/sec
  // We'll run a test for 500 requests over 50 connections
  
  try {
    await runTest(`${target}/api/clients?page=1&pageSize=50`, 50, 500, 'Clients List (Pagination)');
    await runTest(`${target}/api/products?page=1&pageSize=50`, 50, 500, 'Products List (Pagination)');
    await runTest(`${target}/api/inquiries?page=1&pageSize=50`, 50, 500, 'Inquiries List (Pagination)');
    
    console.log('\nAll load tests completed.');
  } catch (err) {
    console.error('Load test failed:', err);
  }
}

main();
