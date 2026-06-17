const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  try {
    await prisma.$executeRawUnsafe(`INSERT INTO "Warehouse" ("id", "name", "location", "isActive", "createdAt", "updatedAt") VALUES (1, 'Port Warehouse Alpha', 'Port Road, Kandla', true, NOW(), NOW())`);
    await prisma.$executeRawUnsafe(`INSERT INTO "Warehouse" ("id", "name", "location", "isActive", "createdAt", "updatedAt") VALUES (2, 'Secondary Transit Hub', 'Mumbai Highway', true, NOW(), NOW())`);
    console.log("Warehouses restored successfully.");
  } catch (e) {
    console.error("Error restoring warehouses:", e);
  }
}

restore().finally(() => prisma.$disconnect());
