const prisma = require('./prisma/client');

async function run() {
  try {
    const roles = await prisma.role.findMany();
    
    let permission = await prisma.permission.findFirst({
      where: { module: 'invoices', action: 'read' }
    });

    if (!permission) {
      permission = await prisma.permission.create({
        data: {
          module: 'invoices',
          action: 'read',
          description: 'Read Invoices'
        }
      });
      console.log('Created invoices:read permission');
    }

    for (const role of roles) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: role.id,
          permissionId: permission.id
        }
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: permission.id
          }
        });
        console.log(`Added invoices:create permission to ${role.name}`);
      }
    }

  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
