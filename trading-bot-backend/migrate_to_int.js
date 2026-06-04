const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace primary keys
schema = schema.replace(/id\s+String\s+@id\s+@default\(uuid\(\)\)/g, 'id Int @id @default(autoincrement())');

// Now we need to find all relation fields that end with Id, like clientId String, inquiryId String? etc.
// We'll use a regex to match: [propertyName]Id String[?]
// Examples: clientId String, inquiryId String?, employeeProfileId String? @unique

schema = schema.replace(/(\w+Id)\s+String(\??)(.*)/g, '$1 Int$2$3');

fs.writeFileSync(schemaPath, schema);
console.log('schema.prisma updated.');
