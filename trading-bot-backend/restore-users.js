require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Restoring Users, Roles, and Permissions...');

  // Clean them first just in case
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});

  // 2. Create Roles
  const roles = {
    superAdmin: await prisma.role.create({ data: { name: 'Super Admin' } }),
    admin: await prisma.role.create({ data: { name: 'Admin' } }),
    teamLead: await prisma.role.create({ data: { name: 'Team Lead' } }),
    employee: await prisma.role.create({ data: { name: 'Employee' } }),
    viewer: await prisma.role.create({ data: { name: 'Viewer' } }),
    client: await prisma.role.create({ data: { name: 'Client' } })
  };

  console.log('Seeded roles.');

  // 3. Create Permissions matrix
  const modules = [
    'dashboard', 'inquiries', 'suppliers', 'clients', 'products',
    'purchaseOrders', 'shipments', 'invoices', 'payments', 'inventory',
    'employees', 'bankAccounts', 'documents', 'notifications', 'reports',
    'settings', 'vehicles', 'chat'
  ];
  const actions = ['create', 'read', 'update', 'delete', 'approve', 'export'];

  const permissions = [];
  for (const mod of modules) {
    for (const act of actions) {
      const perm = await prisma.permission.create({
        data: { module: mod, action: act }
      });
      permissions.push(perm);
    }
  }

  // 4. Map permissions to Roles
  const rolePermissions = [];

  // Super Admin: all permissions
  permissions.forEach((perm) => {
    rolePermissions.push({ roleId: roles.superAdmin.id, permissionId: perm.id });
  });

  // Admin: all except settings:delete
  permissions.forEach((perm) => {
    if (perm.module === 'settings' && perm.action === 'delete') return;
    rolePermissions.push({ roleId: roles.admin.id, permissionId: perm.id });
  });

  // Team Lead:
  //   - inquiries, reports, dashboard: all except delete
  //   - vehicles: read/create/update (no delete)
  //   - chat: read only
  //   - everything else: read and export only
  permissions.forEach((perm) => {
    if (
      perm.module === 'inquiries' ||
      perm.module === 'reports' ||
      perm.module === 'dashboard'
    ) {
      if (perm.action !== 'delete') {
        rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
      }
    } else if (perm.module === 'vehicles') {
      if (['read', 'create', 'update'].includes(perm.action)) {
        rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
      }
    } else if (perm.module === 'chat') {
      if (perm.action === 'read') {
        rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
      }
    } else if (perm.action === 'read' || perm.action === 'export') {
      rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
    }
  });

  // Employee:
  //   - settings, reports: no access
  //   - vehicles: read/create/update (no delete)
  //   - chat: read only
  //   - inquiries: read/create/update/approve
  //   - everything else: read/create/update
  permissions.forEach((perm) => {
    if (['settings', 'reports'].includes(perm.module)) return;
    if (perm.module === 'vehicles') {
      if (['read', 'create', 'update'].includes(perm.action)) {
        rolePermissions.push({ roleId: roles.employee.id, permissionId: perm.id });
      }
      return;
    }
    if (perm.module === 'chat') {
      if (perm.action === 'read') {
        rolePermissions.push({ roleId: roles.employee.id, permissionId: perm.id });
      }
      return;
    }
    if (
      perm.action === 'read' ||
      perm.action === 'create' ||
      perm.action === 'update' ||
      (perm.module === 'inquiries' && perm.action === 'approve')
    ) {
      rolePermissions.push({ roleId: roles.employee.id, permissionId: perm.id });
    }
  });

  // Viewer: read and export on everything except settings and chat
  permissions.forEach((perm) => {
    if (perm.module === 'settings') return;
    if (perm.module === 'chat') return;
    if (perm.action === 'read' || perm.action === 'export') {
      rolePermissions.push({ roleId: roles.viewer.id, permissionId: perm.id });
    }
  });

  // Client: limited access to relevant modules only
  permissions.forEach((perm) => {
    if (
      (perm.module === 'inquiries' && ['read', 'approve'].includes(perm.action)) ||
      (perm.module === 'suppliers' && perm.action === 'read') ||
      (perm.module === 'shipments' && ['read', 'update'].includes(perm.action)) ||
      (perm.module === 'invoices' && perm.action === 'read') ||
      (perm.module === 'payments' && perm.action === 'read')
    ) {
      rolePermissions.push({ roleId: roles.client.id, permissionId: perm.id });
    }
  });

  await prisma.rolePermission.createMany({
    data: rolePermissions
  });

  console.log('Mapped role permissions.');

  // 5. Seed Users
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('admin123', salt);

  await prisma.user.create({
    data: {
      email: 'superadmin@trademind.com',
      password: passwordHash,
      roleId: roles.superAdmin.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'admin@trademind.com',
      password: passwordHash,
      roleId: roles.admin.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'teamlead@trademind.com',
      password: passwordHash,
      roleId: roles.teamLead.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'employee@trademind.com',
      password: passwordHash,
      roleId: roles.employee.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'viewer@trademind.com',
      password: passwordHash,
      roleId: roles.viewer.id,
      isActive: true
    }
  });

  await prisma.user.create({
    data: {
      email: 'client@trademind.com',
      password: passwordHash,
      roleId: roles.client.id,
      isActive: true
    }
  });

  console.log('Seeded default users with password: admin123');
  console.log('Restoration complete!');
}

main()
  .catch((e) => {
    console.error('Restoration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
