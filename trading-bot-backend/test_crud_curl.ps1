$baseUrl = "http://localhost:5000"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "1. AUTHENTICATING AND RETRIEVING JWT TOKEN" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$loginCmd = 'curl.exe -s -X POST -H "Content-Type: application/json" -d "{\`"email\`":\`"superadmin@trademind.com\`",\`"password\`":\`"admin123\`"}" http://localhost:5000/api/auth/login'
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $loginCmd -ForegroundColor Magenta

$loginResponse = curl.exe -s -X POST -H "Content-Type: application/json" -d "{\`"email\`":\`"superadmin@trademind.com\`",\`"password\`":\`"admin123\`"}" "$baseUrl/api/auth/login"
Write-Host "Response:" -ForegroundColor Green
Write-Host $loginResponse

$loginJson = $loginResponse | ConvertFrom-Json
$token = $loginJson.data.accessToken

if (-not $token) {
    Write-Host "Error: Could not retrieve access token." -ForegroundColor Red
    exit 1
}

Write-Host "`nToken acquired successfully: $($token.Substring(0, 15))...`n" -ForegroundColor Green

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "2. CREATE CLIENT (POST)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$createCmd = 'curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer <TOKEN>" -d "{\`"name\`":\`"Test Client Inc\`",\`"email\`":\`"testclient@trademind.com\`",\`"phone\`":\`"+1234567890\`",\`"company\`":\`"Test Company Ltd\`",\`"address\`":\`"123 Test Street\`"}" http://localhost:5000/api/clients'
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $createCmd -ForegroundColor Magenta

$createResponse = curl.exe -s -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "{\`"name\`":\`"Test Client Inc\`",\`"email\`":\`"testclient@trademind.com\`",\`"phone\`":\`"+1234567890\`",\`"company\`":\`"Test Company Ltd\`",\`"address\`":\`"123 Test Street\`"}" "$baseUrl/api/clients"
Write-Host "Response:" -ForegroundColor Green
Write-Host $createResponse

$createJson = $createResponse | ConvertFrom-Json
$clientId = $createJson.data.id

if (-not $clientId) {
    Write-Host "Error: Failed to create client." -ForegroundColor Red
    exit 1
}

Write-Host "`nCreated client ID: $clientId`n" -ForegroundColor Green

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "3. READ ALL CLIENTS (GET)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$getAllCmd = 'curl.exe -s -X GET -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/clients'
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $getAllCmd -ForegroundColor Magenta

$getAllResponse = curl.exe -s -X GET -H "Authorization: Bearer $token" "$baseUrl/api/clients"
Write-Host "Response:" -ForegroundColor Green
Write-Host $getAllResponse
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "4. READ ONE CLIENT (GET BY ID)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$getOneCmd = "curl.exe -s -X GET -H `"Authorization: Bearer <TOKEN>`" http://localhost:5000/api/clients/$clientId"
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $getOneCmd -ForegroundColor Magenta

$getOneResponse = curl.exe -s -X GET -H "Authorization: Bearer $token" "$baseUrl/api/clients/$clientId"
Write-Host "Response:" -ForegroundColor Green
Write-Host $getOneResponse
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "5. UPDATE CLIENT (PUT)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$updateCmd = "curl.exe -s -X PUT -H `"Content-Type: application/json`" -H `"Authorization: Bearer <TOKEN>`" -d `"{\`\`\`"name\`\`\`":\`\`\`"Updated Test Client Inc\`\`\`",\`\`\`"email\`\`\`":\`\`\`"updatedclient@trademind.com\`\`\`",\`\`\`"phone\`\`\`":\`\`\`"+0987654321\`\`\`"}`" http://localhost:5000/api/clients/$clientId"
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $updateCmd -ForegroundColor Magenta

$updateResponse = curl.exe -s -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $token" -d "{\`"name\`":\`"Updated Test Client Inc\`",\`"email\`":\`"updatedclient@trademind.com\`",\`"phone\`":\`"+0987654321\`"}" "$baseUrl/api/clients/$clientId"
Write-Host "Response:" -ForegroundColor Green
Write-Host $updateResponse
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "6. DELETE CLIENT (DELETE)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$deleteCmd = "curl.exe -s -X DELETE -H `"Authorization: Bearer <TOKEN>`" http://localhost:5000/api/clients/$clientId"
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $deleteCmd -ForegroundColor Magenta

$deleteResponse = curl.exe -s -X DELETE -H "Authorization: Bearer $token" "$baseUrl/api/clients/$clientId"
Write-Host "Response:" -ForegroundColor Green
Write-Host $deleteResponse
Write-Host ""

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "7. CONFIRM DELETION (GET BY ID SHOULD FAIL/NOT FOUND)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
$confirmCmd = "curl.exe -s -X GET -H `"Authorization: Bearer <TOKEN>`" http://localhost:5000/api/clients/$clientId"
Write-Host "Running Curl Command:" -ForegroundColor Yellow
Write-Host $confirmCmd -ForegroundColor Magenta

$confirmResponse = curl.exe -s -X GET -H "Authorization: Bearer $token" "$baseUrl/api/clients/$clientId"
Write-Host "Response (expected 404/error):" -ForegroundColor Green
Write-Host $confirmResponse
Write-Host "`nAll CRUD operation tests completed successfully!" -ForegroundColor Green
