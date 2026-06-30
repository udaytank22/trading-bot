const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" RENAME COLUMN "sku" TO "impa";`);
    console.log('Renamed sku to impa in Product');
  } catch(e) {
    console.error('Error on Product:', e.message);
  }
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "InventoryItem" RENAME COLUMN "sku" TO "impa";`);
    console.log('Renamed sku to impa in InventoryItem');
  } catch(e) {
    console.error('Error on InventoryItem:', e.message);
  }
  
  await prisma.$disconnect();
}

run();
