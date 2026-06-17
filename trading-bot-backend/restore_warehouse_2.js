const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function restore() {
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Warehouse" WHERE id IN (1, 2)`);
    await prisma.$executeRawUnsafe(`INSERT INTO "Warehouse" ("id", "name", "location", "isActive", "createdAt", "updatedAt") VALUES (1001, 'Port Warehouse Alpha', 'Port Road, Kandla', true, NOW(), NOW())`);
    await prisma.$executeRawUnsafe(`INSERT INTO "Warehouse" ("id", "name", "location", "isActive", "createdAt", "updatedAt") VALUES (1002, 'Port Warehouse Beta', 'Mumbai Highway', true, NOW(), NOW())`);
    console.log("Warehouses restored successfully with correct IDs.");
  } catch (e) {
    console.error("Error restoring warehouses:", e);
  }
}

restore().finally(() => prisma.$disconnect());
