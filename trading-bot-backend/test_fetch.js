const axios = require('axios');

async function main() {
  try {
    console.log("Logging in...");
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@trademind.com',
      password: 'admin123'
    });

    const token = loginRes.data.data.token || loginRes.data.data.accessToken;
    console.log("Logged in successfully. Token length:", token.length);

    console.log("Fetching suppliers...");
    const suppliersRes = await axios.get('http://localhost:5000/api/suppliers', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log("Suppliers status:", suppliersRes.status);
    const alex = suppliersRes.data.data.find(s => s.name === "Alexander Hamilton");
    console.log("Supplier Alexander Hamilton details:", JSON.stringify(alex, null, 2));

  } catch (err) {
    console.error("Error in test_fetch:", err.message);
    if (err.response) {
      console.error("Response data:", err.response.data);
    }
  }
}

main();
