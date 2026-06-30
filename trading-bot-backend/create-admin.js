const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const pass = await bcrypt.hash('admin123', 10);
  
  const existing = await prisma.user.findFirst({ where: { email: 'admin@trademind.com' } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: pass, isActive: true }
    });
  } else {
    await prisma.user.create({
      data: { id: 1000, email: 'admin@trademind.com', password: pass, roleId: 1, isActive: true }
    });
  }
  
  console.log('Admin user created');
}

main().catch(console.error).finally(() => prisma.$disconnect());
