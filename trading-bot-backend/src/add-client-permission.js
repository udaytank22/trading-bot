const prisma = require('./prisma/client');

async function run() {
  try {
    const role = await prisma.role.findFirst({
      where: { name: 'Client' }
    });
    
    if (!role) {
      console.error('Role Client not found');
      return;
    }

    const permission = await prisma.permission.findFirst({
      where: { module: 'shipments', action: 'update' }
    });

    if (!permission) {
      console.error('Permission shipments:update not found');
      return;
    }

    const existing = await prisma.rolePermission.findFirst({
      where: {
        roleId: role.id,
        permissionId: permission.id
      }
    });

    if (existing) {
      console.log('RolePermission already exists!');
      return;
    }

    await prisma.rolePermission.create({
      data: {
        roleId: role.id,
        permissionId: permission.id
      }
    });

    console.log('Successfully added shipments:update permission to Client role!');
  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
