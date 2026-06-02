# API Testing with Curl on Windows (JSON Responses)

This guide provides the exact `curl` commands to test the **Authentication** and **Clients CRUD** endpoints, along with the expected **JSON responses** and how to format/pretty-print them.

---

## 1. Authentication (Login)

Retrieves your JWT `accessToken`. Replace `<TOKEN>` in subsequent commands with the token value returned in the response.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X POST -H "Content-Type: application/json" -d "{\`"email\`":\`"superadmin@trademind.com\`",\`"password\`":\`"admin123\`"}" http://localhost:5000/api/auth/login | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X POST -H "Content-Type: application/json" -d "{\"email\":\"superadmin@trademind.com\",\"password\":\"admin123\"}" http://localhost:5000/api/auth/login | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "b2e7db44-5a47-4f9d-878a-499d93901d71",
      "email": "superadmin@trademind.com",
      "roleId": "306bf8b3-197c-4194-bf4e-f1666fd85132",
      "createdAt": "2026-05-30T07:19:01.447Z",
      "updatedAt": "2026-05-30T07:19:01.447Z",
      "deletedAt": null,
      "createdById": null,
      "updatedById": null,
      "isActive": true,
      "employeeProfileId": null,
      "role": {
        "id": "306bf8b3-197c-4194-bf4e-f1666fd85132",
        "name": "Super Admin",
        "createdAt": "2026-05-30T07:19:01.148Z",
        "updatedAt": "2026-05-30T07:19:01.148Z",
        "deletedAt": null,
        "isActive": true
      }
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 2. Create Client (POST)

Creates a new CRM client. Save the `"id"` value from the response to use in the Read, Update, and Delete steps.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\`"name\`":\`"Test Client Inc\`",\`"email\`":\`"testclient@trademind.com\`",\`"phone\`":\`"+1234567890\`",\`"company\`":\`"Test Company Ltd\`",\`"address\`":\`"123 Test Street\`"}" http://localhost:5000/api/clients | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"name\":\"Test Client Inc\",\"email\":\"testclient@trademind.com\",\"phone\":\"+1234567890\",\"company\":\"Test Company Ltd\",\"address\":\"123 Test Street\"}" http://localhost:5000/api/clients | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": "b6a19f56-6f77-44bc-a887-f823a07a1bb2",
    "name": "Test Client Inc",
    "email": "testclient@trademind.com",
    "phone": "+1234567890",
    "company": "Test Company Ltd",
    "address": "123 Test Street",
    "createdById": "b2e7db44-5a47-4f9d-878a-499d93901d71",
    "isActive": true,
    "updatedAt": "2026-05-30T07:35:30.123Z",
    "createdAt": "2026-05-30T07:35:30.123Z"
  }
}
```

---

## 3. Read All Clients (GET)

Retrieves a list of all clients in the system.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X GET -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X GET -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Clients retrieved successfully",
  "data": [
    {
      "id": "b6a19f56-6f77-44bc-a887-f823a07a1bb2",
      "name": "Test Client Inc",
      "email": "testclient@trademind.com",
      "phone": "+1234567890",
      "company": "Test Company Ltd",
      "address": "123 Test Street",
      "createdAt": "2026-05-30T07:35:30.123Z",
      "updatedAt": "2026-05-30T07:35:30.123Z",
      "deletedAt": null,
      "createdById": "b2e7db44-5a47-4f9d-878a-499d93901d71",
      "updatedById": null,
      "isActive": true
    }
  ]
}
```

---

## 4. Read One Client (GET by ID)

Retrieves details for a specific client. Replace `<CLIENT_ID>` with the ID obtained during creation.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X GET -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients/<CLIENT_ID> | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X GET -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients/<CLIENT_ID> | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Client retrieved successfully",
  "data": {
    "id": "b6a19f56-6f77-44bc-a887-f823a07a1bb2",
    "name": "Test Client Inc",
    "email": "testclient@trademind.com",
    "phone": "+1234567890",
    "company": "Test Company Ltd",
    "address": "123 Test Street",
    "createdAt": "2026-05-30T07:35:30.123Z",
    "updatedAt": "2026-05-30T07:35:30.123Z",
    "deletedAt": null,
    "createdById": "b2e7db44-5a47-4f9d-878a-499d93901d71",
    "updatedById": null,
    "isActive": true
  }
}
```

---

## 5. Update Client (PUT)

Updates details of a client. Replace `<CLIENT_ID>` with the ID of the client to update.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\`"name\`":\`"Updated Test Client Inc\`",\`"email\`":\`"updatedclient@trademind.com\`",\`"phone\`":\`"+0987654321\`"}" http://localhost:5000/api/clients/<CLIENT_ID> | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\"name\":\"Updated Test Client Inc\",\"email\":\"updatedclient@trademind.com\",\"phone\":\"+0987654321\"}" http://localhost:5000/api/clients/<CLIENT_ID> | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": {
    "id": "b6a19f56-6f77-44bc-a887-f823a07a1bb2",
    "name": "Updated Test Client Inc",
    "email": "updatedclient@trademind.com",
    "phone": "+0987654321",
    "company": "Test Company Ltd",
    "address": "123 Test Street",
    "createdAt": "2026-05-30T07:35:30.123Z",
    "updatedAt": "2026-05-30T07:36:12.456Z",
    "deletedAt": null,
    "createdById": "b2e7db44-5a47-4f9d-878a-499d93901d71",
    "updatedById": "b2e7db44-5a47-4f9d-878a-499d93901d71",
    "isActive": true
  }
}
```

---

## 6. Delete Client (DELETE)

Deletes a specific client. Replace `<CLIENT_ID>` with the ID of the client to delete.

### 💻 PowerShell (Pretty Print)
```powershell
curl.exe -s -X DELETE -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients/<CLIENT_ID> | ConvertFrom-Json | ConvertTo-Json -Depth 5
```

### 🪟 Windows CMD (Pretty Print)
```cmd
curl -s -X DELETE -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients/<CLIENT_ID> | python -m json.tool
```

### 📋 Expected JSON Response
```json
{
  "success": true,
  "message": "Client deleted successfully",
  "data": {}
}
```
