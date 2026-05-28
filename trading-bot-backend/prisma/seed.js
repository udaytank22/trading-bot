const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database started...');

  // 1. Clean existing records (Optional, in order of dependencies)
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
    viewer: await prisma.role.create({ data: { name: 'Viewer' } })
  };

  console.log('Seeded roles.');

  // 3. Create Permissions matrix
  const modules = [
    'dashboard', 'inquiries', 'suppliers', 'clients', 'products',
    'purchaseOrders', 'shipments', 'invoices', 'payments', 'inventory',
    'employees', 'bankAccounts', 'documents', 'notifications', 'reports', 'settings'
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

  console.log(`Seeded ${permissions.length} module-action permissions.`);

  // 4. Map permissions to Roles
  const rolePermissions = [];

  // Super Admin: gets all permissions
  permissions.forEach((perm) => {
    rolePermissions.push({ roleId: roles.superAdmin.id, permissionId: perm.id });
  });

  // Admin: gets all exceptSettings Delete
  permissions.forEach((perm) => {
    if (perm.module === 'settings' && perm.action === 'delete') return;
    rolePermissions.push({ roleId: roles.admin.id, permissionId: perm.id });
  });

  // Team Lead: dashboard read, reports read, inquiries read/create/update/approve, others read
  permissions.forEach((perm) => {
    if (
      perm.module === 'inquiries' || 
      perm.module === 'reports' || 
      perm.module === 'dashboard'
    ) {
      if (perm.action !== 'delete') {
        rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
      }
    } else if (perm.action === 'read' || perm.action === 'export') {
      rolePermissions.push({ roleId: roles.teamLead.id, permissionId: perm.id });
    }
  });

  // Employee: dashboard, inquiries read/create/update, others read/create/update except Settings/Reports
  permissions.forEach((perm) => {
    if (['settings', 'reports'].includes(perm.module)) return;
    if (perm.action === 'read' || perm.action === 'create' || perm.action === 'update') {
      rolePermissions.push({ roleId: roles.employee.id, permissionId: perm.id });
    }
  });

  // Viewer: read-only on everything except settings
  permissions.forEach((perm) => {
    if (perm.module === 'settings') return;
    if (perm.action === 'read' || perm.action === 'export') {
      rolePermissions.push({ roleId: roles.viewer.id, permissionId: perm.id });
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

  console.log('Seeded default users with password: admin123');

  // 6. Seed Clients
  const client1 = await prisma.client.create({
    data: {
      name: 'Marine Shipping Corp',
      email: 'logistics@marineshipping.com',
      phone: '+1 415 555 2671',
      company: 'Marine Shipping International',
      address: 'Pier 39, San Francisco, CA',
      createdById: superAdminUser.id
    }
  });

  const client2 = await prisma.client.create({
    data: {
      name: 'Apex Cargo Logistics',
      email: 'purchasing@apexcargo.in',
      phone: '+91 22 5556 1234',
      company: 'Apex Cargo Logistics Private Ltd',
      address: 'Nariman Point, Mumbai, India',
      createdById: superAdminUser.id
    }
  });

  console.log('Seeded sample clients.');

  // 7. Seed Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Ocean Parts Supply Co',
      email: 'orders@oceanparts.com',
      phone: '+44 20 7946 0192',
      company: 'Ocean Parts Ltd',
      address: 'East India Docks, London, UK',
      createdById: superAdminUser.id
    }
  });

  await prisma.supplier.create({
    data: {
      name: 'Gaskets & Valves Ltd',
      email: 'sales@gasketsvalves.co.kr',
      phone: '+82 2 555 9876',
      company: 'Gaskets & Valves Manufacturing Inc',
      address: 'Gangnam-gu, Seoul, South Korea',
      createdById: superAdminUser.id
    }
  });

  console.log('Seeded sample suppliers.');

  // 8. Seed Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Flange Bolts (High Strength)',
      sku: 'FLG-BLT-001',
      category: 'Fasteners',
      unit: 'Box (100pcs)',
      sellingPrice: 1500.00,
      purchasePrice: 1000.00,
      createdById: superAdminUser.id
    }
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Steel Gate Valve 2-inch',
      sku: 'STL-VLV-002',
      category: 'Valves',
      unit: 'Pcs',
      sellingPrice: 45000.00,
      purchasePrice: 30000.00,
      createdById: superAdminUser.id
    }
  });

  console.log('Seeded sample products.');

  // 9. Seed Bank Accounts
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

  // 10. Seed Warehouses
  const warehouse = await prisma.warehouse.create({
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

  // 11. Initial Warehouse Stock balances & movement ledger entries
  await prisma.stockMovement.create({
    data: {
      inventoryItemId: prod1.id,
      warehouseId: warehouse.id,
      type: 'IN',
      quantity: 100,
      remarks: 'Initial stock intake',
      createdById: superAdminUser.id
    }
  });

  await prisma.warehouseStock.create({
    data: {
      warehouseId: warehouse.id,
      inventoryItemId: prod1.id,
      quantity: 100
    }
  });

  await prisma.stockMovement.create({
    data: {
      inventoryItemId: prod2.id,
      warehouseId: warehouse.id,
      type: 'IN',
      quantity: 50,
      remarks: 'Initial stock intake',
      createdById: superAdminUser.id
    }
  });

  await prisma.warehouseStock.create({
    data: {
      warehouseId: warehouse.id,
      inventoryItemId: prod2.id,
      quantity: 50
    }
  });

  console.log('Seeded initial warehouse stocks and movements.');

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
