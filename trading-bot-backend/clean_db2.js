const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean2() {
  try {
    await prisma.stockMovement.deleteMany({});
    await prisma.warehouseStock.deleteMany({});
    await prisma.inventoryItem.deleteMany({});
    await prisma.warehouse.deleteMany({});
    console.log("Inventory cleaned successfully.");
  } catch (e) {
    console.error("Error cleaning inventory:", e);
  }
}

clean2().finally(() => prisma.$disconnect());
