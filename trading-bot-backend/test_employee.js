async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@trademind.com', password: 'admin123' })
    });
    const login = await loginRes.json();
    const token = login.data.accessToken || login.data.token;
    
    const payload = {
        fullName: "Test Employee",
        email: "testemployee99@trademind.com",
        phone: "123456",
        department: "IT",
        designation: "Admin",
        status: "ACTIVE",
        joiningDate: "2024-01-01"
    };

    const res = await fetch('http://localhost:5000/api/employees', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log("Response:", res.status, text);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
