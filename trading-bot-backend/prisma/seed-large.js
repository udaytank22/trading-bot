const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data (except roles/permissions/users)...');
  // Delete in correct order to respect foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.clientQuotationItem.deleteMany();
  await prisma.clientQuotation.deleteMany();
  await prisma.supplierQuoteItem.deleteMany();
  await prisma.supplierQuote.deleteMany();
  await prisma.inquirySupplier.deleteMany();
  await prisma.inquiryStatusHistory.deleteMany();
  await prisma.inquiryItem.deleteMany();
  await prisma.inquiry.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.warehouseStock.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.product.deleteMany();
  await prisma.clientVessel.deleteMany();
  await prisma.client.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.bankAccount.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.document.deleteMany();
  
  console.log('Seeding load test users (IDs 1-50)...');
  let salesRepRole = await prisma.role.findFirst({ where: { name: 'Sales Representative' } });
  if (!salesRepRole) {
    salesRepRole = await prisma.role.create({ data: { name: 'Sales Representative' } });
  }
  const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });

  // Grant read permissions for clients, products, inquiries, and create for clients
  const permsToGrant = [
    { module: 'CLIENT', action: 'READ' },
    { module: 'CLIENT', action: 'CREATE' },
    { module: 'PRODUCT', action: 'READ' },
    { module: 'INQUIRY', action: 'READ' }
  ];
  
  for (const p of permsToGrant) {
    let perm = await prisma.permission.findFirst({ where: { module: p.module, action: p.action } });
    if (!perm) {
      perm = await prisma.permission.create({ data: { module: p.module, action: p.action } });
    }
    const hasRolePerm = await prisma.rolePermission.findFirst({ where: { roleId: salesRepRole.id, permissionId: perm.id } });
    if (!hasRolePerm) {
      await prisma.rolePermission.create({ data: { roleId: salesRepRole.id, permissionId: perm.id } });
    }
  }

  const usersData = Array.from({ length: 50 }).map((_, i) => {
    const id = i + 101;
    return {
      id,
      email: `user${id}@trademind.com`,
      password: 'password123', // In real app it should be hashed, but mock is fine if login uses this or bypasses it
      roleId: id % 10 === 0 ? superAdminRole.id : salesRepRole.id,
      isActive: true,
    };
  });
  
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: { email: u.email, roleId: u.roleId },
      create: u
    });
  }
  
  console.log('Seeding Large Dataset...');

  // 1. Clients (5000)
  console.log('Creating 5,000 clients...');
  const clientsData = Array.from({ length: 5000 }).map(() => ({
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    company: faker.company.name()
  }));
  await prisma.client.createMany({ data: clientsData });
  const allClients = await prisma.client.findMany({ select: { id: true } });
  
  // 2. Suppliers (500)
  console.log('Creating 500 suppliers...');
  const suppliersData = Array.from({ length: 500 }).map(() => ({
    name: faker.company.name(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    company: faker.company.name()
  }));
  await prisma.supplier.createMany({ data: suppliersData });
  
  // 3. Products (2000)
  console.log('Creating 2,000 products...');
  const productsData = Array.from({ length: 2000 }).map((_, i) => ({
    name: faker.commerce.productName(),
    sku: 'SKU-' + faker.string.alphanumeric(6).toUpperCase() + '-' + i,
    category: faker.commerce.department(),
    sellingPrice: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
    purchasePrice: parseFloat(faker.commerce.price({ min: 5, max: 800 })),
    unit: 'pcs'
  }));
  await prisma.product.createMany({ data: productsData });
  
  // 4. Inquiries (5000)
  console.log('Creating 5,000 inquiries...');
  const inquiriesData = Array.from({ length: 5000 }).map((_, i) => ({
    inquiryNumber: 'INQ-L-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    clientId: faker.helpers.arrayElement(allClients).id,
    currentStatus: faker.helpers.arrayElement(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED'])
  }));
  
  // Create inquiries in chunks to avoid SQLite limits
  const chunkSize = 1000;
  for (let i = 0; i < inquiriesData.length; i += chunkSize) {
    const chunk = inquiriesData.slice(i, i + chunkSize);
    await prisma.inquiry.createMany({ data: chunk });
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
