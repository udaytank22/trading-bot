const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database started...');

  // 1. Clean existing records (in order of dependencies)
  await prisma.attendance.deleteMany({});
  await prisma.employee.deleteMany({});

  await prisma.payment.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.invoice.deleteMany({});

  await prisma.shipment.deleteMany({});
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});

  await prisma.document.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditLog.deleteMany({});

  await prisma.stockMovement.deleteMany({});
  await prisma.warehouseStock.deleteMany({});
  await prisma.inventoryItem.deleteMany({});

  await prisma.supplierQuoteItem.deleteMany({});
  await prisma.supplierQuote.deleteMany({});
  await prisma.clientQuotationItem.deleteMany({});
  await prisma.clientQuotation.deleteMany({});
  await prisma.approvalLog.deleteMany({});

  await prisma.inquiryStatusHistory.deleteMany({});
  await prisma.inquirySupplier.deleteMany({});
  await prisma.inquiryItem.deleteMany({});
  await prisma.inquiry.deleteMany({});

  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.bankAccount.deleteMany({});
  await prisma.warehouse.deleteMany({});

  console.log('Cleaned old records.');

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

  const superAdminUser = await prisma.user.create({
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
      email: 'viewer@trademind.com',   // ✅ added missing viewer user
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

  // 6. Seed Bank Accounts
  await prisma.bankAccount.create({
    data: {
      bankName: 'HDFC Bank',
      accountHolderName: 'TradeMind Sourcing Pvt Ltd',
      accountNumber: '50200012345678',
      routingNumber: 'HDFC0000240',
      swiftCode: 'HDFCINBBAXXX',
      currency: 'INR',
      branch: 'Fort, Mumbai',
      createdById: superAdminUser.id
    }
  });

  await prisma.bankAccount.create({
    data: {
      bankName: 'HSBC Bank',
      accountHolderName: 'TradeMind Sourcing Pvt Ltd',
      accountNumber: '002891726002',
      routingNumber: 'HSBC0001',
      swiftCode: 'HSBCHINBBXXX',
      currency: 'USD',
      branch: 'Hong Kong Central',
      createdById: superAdminUser.id
    }
  });

  console.log('Seeded bank accounts.');

  // 7. Seed Warehouses
  await prisma.warehouse.create({
    data: {
      name: 'Port Warehouse Alpha',
      location: 'JNPT Port Area, Nhava Sheva, Navi Mumbai',
      createdById: superAdminUser.id
    }
  });

  await prisma.warehouse.create({
    data: {
      name: 'Port Warehouse Beta',
      location: 'Chennai Port Trust Logistics Zone, Chennai',
      createdById: superAdminUser.id
    }
  });

  console.log('Seeded warehouses.');

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });