const prisma = require('./prisma/client');

async function run() {
  try {
    const roles = await prisma.role.findMany();
    
    // Find or create 'invoices:create' permission
    let createPerm = await prisma.permission.findFirst({
      where: { module: 'invoices', action: 'create' }
    });

    if (!createPerm) {
      createPerm = await prisma.permission.create({
        data: {
          module: 'invoices',
          action: 'create',
          description: 'Create Invoices'
        }
      });
      console.log('Created invoices:create permission');
    }

    // Add to all roles, or specifically Client role
    for (const role of roles) {
      const existing = await prisma.rolePermission.findFirst({
        where: {
          roleId: role.id,
          permissionId: createPerm.id
        }
      });

      if (!existing) {
        await prisma.rolePermission.create({
          data: {
            roleId: role.id,
            permissionId: createPerm.id
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
