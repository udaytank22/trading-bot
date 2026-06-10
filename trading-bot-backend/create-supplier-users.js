const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('Supplier user account synchronization started...');

  // 1. Get Client Role
  const clientRole = await prisma.role.findFirst({
    where: { name: 'Client' }
  });

  if (!clientRole) {
    console.error('Error: "Client" role not found in the database. Please seed the database first.');
    process.exit(1);
  }
  console.log(`Found Client role (ID: ${clientRole.id})`);

  // 2. Fetch all suppliers
  const suppliers = await prisma.supplier.findMany({
    where: { deletedAt: null }
  });
  console.log(`Found ${suppliers.length} active suppliers in the database.`);

  // 3. Fetch all existing users
  const users = await prisma.user.findMany();
  const existingUserEmails = new Set(users.map(u => u.email.toLowerCase()));

  // 4. Generate hashed password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  let createdCount = 0;
  let skippedCount = 0;

  for (const supplier of suppliers) {
    const emailLower = supplier.email.toLowerCase();
    if (existingUserEmails.has(emailLower)) {
      skippedCount++;
      continue;
    }

    try {
      await prisma.user.create({
        data: {
          email: supplier.email,
          password: passwordHash,
          roleId: clientRole.id,
          isActive: true
        }
      });
      createdCount++;
      console.log(`Created user account for supplier: ${supplier.name} (${supplier.email})`);
    } catch (err) {
      console.error(`Failed to create user account for ${supplier.name} (${supplier.email}):`, err.message);
    }
  }

  console.log(`Synchronization completed! Created: ${createdCount}, Skipped: ${skippedCount}`);
}

main()
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
