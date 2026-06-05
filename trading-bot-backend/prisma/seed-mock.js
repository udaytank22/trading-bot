const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const COUNT = 1000;

async function main() {
  console.log('Seeding mock data for load testing...');

  // Clients
  const clientsData = Array.from({ length: COUNT }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    address: faker.location.streetAddress(),
  }));
  await prisma.client.createMany({ data: clientsData });
  const clients = await prisma.client.findMany();
  console.log(`Seeded ${COUNT} clients`);

  // Suppliers
  const suppliersData = Array.from({ length: COUNT }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    company: faker.company.name(),
    address: faker.location.streetAddress(),
    categories: [faker.commerce.department(), faker.commerce.department()],
  }));
  await prisma.supplier.createMany({ data: suppliersData });
  const suppliers = await prisma.supplier.findMany();
  console.log(`Seeded ${COUNT} suppliers`);

  // Employees
  const employeesData = Array.from({ length: COUNT }).map(() => ({
    fullName: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    department: faker.commerce.department(),
    designation: faker.person.jobTitle(),
    salary: faker.number.float({ min: 30000, max: 150000, fractionDigits: 2 }),
    joiningDate: faker.date.past(),
    status: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE', 'ON_LEAVE']),
  }));
  await prisma.employee.createMany({ data: employeesData });
  const employees = await prisma.employee.findMany();
  console.log(`Seeded ${COUNT} employees`);

  // Users
  let roles = await prisma.role.findMany();
  let employeeRole = roles.find(r => r.name === 'Employee');
  if (!employeeRole) {
    try {
       employeeRole = await prisma.role.create({ data: { name: 'Employee' } });
    } catch(e) {
       // if it fails due to id constraint, pass explicit id
       employeeRole = await prisma.role.create({ data: { id: 1000, name: 'Employee' } });
    }
  }
  
  const passwordHash = await bcrypt.hash('password123', 10);
  const usersData = Array.from({ length: COUNT }).map((_, i) => ({
    email: faker.internet.email(),
    password: passwordHash,
    roleId: employeeRole.id,
    employeeProfileId: employees[i].id,
    isActive: true,
  }));
  await prisma.user.createMany({ data: usersData, skipDuplicates: true });
  const users = await prisma.user.findMany();
  console.log(`Seeded ${COUNT} users`);

  // BankAccounts
  const bankData = Array.from({ length: COUNT }).map(() => ({
    bankName: faker.company.name() + ' Bank',
    accountHolderName: faker.person.fullName(),
    accountNumber: faker.finance.accountNumber(),
    routingNumber: faker.finance.routingNumber(),
    swiftCode: faker.finance.bic(),
    currency: faker.finance.currencyCode(),
    branch: faker.location.city(),
  }));
  await prisma.bankAccount.createMany({ data: bankData, skipDuplicates: true });
  const banks = await prisma.bankAccount.findMany();
  console.log(`Seeded ${COUNT} bank accounts`);

  // Warehouses
  const warehouseData = Array.from({ length: COUNT }).map(() => ({
    name: faker.company.name() + ' Warehouse',
    location: faker.location.streetAddress(),
  }));
  await prisma.warehouse.createMany({ data: warehouseData });
  const warehouses = await prisma.warehouse.findMany();
  console.log(`Seeded ${COUNT} warehouses`);

  // Vehicles
  const vehiclesData = Array.from({ length: COUNT }).map(() => ({
    vehicle_no: faker.vehicle.vrm(),
    type: faker.vehicle.type(),
    capacity: faker.number.int({ min: 1000, max: 5000 }) + ' kg',
    driver_name: faker.person.fullName(),
    phone: faker.phone.number(),
    status: faker.helpers.arrayElement(['Active', 'Inactive', 'Maintenance']),
  }));
  await prisma.vehicle.createMany({ data: vehiclesData, skipDuplicates: true });
  console.log(`Seeded ${COUNT} vehicles`);

  // Products
  const productsData = Array.from({ length: COUNT }).map(() => ({
    name: faker.commerce.productName(),
    sku: faker.string.alphanumeric(10),
    category: faker.commerce.department(),
    unit: 'pcs',
    sellingPrice: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    purchasePrice: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
  }));
  await prisma.product.createMany({ data: productsData, skipDuplicates: true });
  const products = await prisma.product.findMany();
  console.log(`Seeded ${COUNT} products`);

  // InventoryItems
  const inventoryData = Array.from({ length: COUNT }).map(() => ({
    itemName: faker.commerce.productName(),
    sku: faker.string.alphanumeric(10),
    category: faker.commerce.department(),
    unit: 'pcs',
    sellingPrice: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    purchasePrice: faker.number.float({ min: 5, max: 500, fractionDigits: 2 }),
    minimumStockLevel: faker.number.int({ min: 5, max: 50 }),
  }));
  await prisma.inventoryItem.createMany({ data: inventoryData, skipDuplicates: true });
  const inventoryItems = await prisma.inventoryItem.findMany();
  console.log(`Seeded ${COUNT} inventory items`);

  // WarehouseStocks
  const stockData = Array.from({ length: COUNT }).map((_, i) => ({
    warehouseId: faker.helpers.arrayElement(warehouses).id,
    inventoryItemId: inventoryItems[i].id,
    quantity: faker.number.int({ min: 0, max: 1000 }),
  }));
  for (const st of stockData) {
    try {
      await prisma.warehouseStock.create({ data: st });
    } catch(e) {}
  }
  console.log(`Seeded warehouse stocks`);

  // StockMovements
  const movementData = Array.from({ length: COUNT }).map(() => ({
    inventoryItemId: faker.helpers.arrayElement(inventoryItems).id,
    warehouseId: faker.helpers.arrayElement(warehouses).id,
    type: faker.helpers.arrayElement(['IN', 'OUT']),
    quantity: faker.number.int({ min: 1, max: 100 }),
    remarks: faker.lorem.sentence(),
  }));
  await prisma.stockMovement.createMany({ data: movementData });
  console.log(`Seeded ${COUNT} stock movements`);

  // Inquiries
  const inquiryData = Array.from({ length: COUNT }).map((_, i) => ({
    inquiryNumber: 'INQ-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    clientId: faker.helpers.arrayElement(clients).id,
    vesselName: faker.vehicle.vehicle(),
    imoNumber: faker.string.numeric(7),
    currentStatus: faker.helpers.arrayElement(['PENDING', 'QUOTED', 'APPROVED', 'REJECTED', 'COMPLETED']),
    expectedDeliveryDate: faker.date.future(),
    remarks: faker.lorem.sentence(),
  }));
  await prisma.inquiry.createMany({ data: inquiryData, skipDuplicates: true });
  const inquiries = await prisma.inquiry.findMany();
  console.log(`Seeded ${COUNT} inquiries`);

  // InquiryItems
  const inquiryItemsData = Array.from({ length: COUNT }).map(() => {
    const product = faker.helpers.arrayElement(products);
    return {
      inquiryId: faker.helpers.arrayElement(inquiries).id,
      productId: product.id,
      description: product.name,
      quantity: faker.number.int({ min: 1, max: 100 }),
      unit: product.unit || 'pcs',
    };
  });
  await prisma.inquiryItem.createMany({ data: inquiryItemsData });
  const inquiryItems = await prisma.inquiryItem.findMany();
  console.log(`Seeded ${COUNT} inquiry items`);

  // InquirySuppliers
  const inquirySuppliersData = Array.from({ length: COUNT }).map(() => ({
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    supplierId: faker.helpers.arrayElement(suppliers).id,
  }));
  await prisma.inquirySupplier.createMany({ data: inquirySuppliersData });
  console.log(`Seeded ${COUNT} inquiry suppliers`);

  // SupplierQuotes
  const sqData = Array.from({ length: COUNT }).map(() => ({
    supplierId: faker.helpers.arrayElement(suppliers).id,
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    quoteAmount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    taxAmount: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    finalAmount: faker.number.float({ min: 110, max: 11000, fractionDigits: 2 }),
  }));
  await prisma.supplierQuote.createMany({ data: sqData });
  console.log(`Seeded ${COUNT} supplier quotes`);

  // ClientQuotations
  const cqData = Array.from({ length: COUNT }).map((_, i) => ({
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    quotationNumber: 'QTN-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    marginPercentage: faker.number.float({ min: 5, max: 30, fractionDigits: 2 }),
    discountPercentage: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
    taxPercentage: faker.number.float({ min: 5, max: 20, fractionDigits: 2 }),
    totalAmount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    finalAmount: faker.number.float({ min: 110, max: 11000, fractionDigits: 2 }),
    status: faker.helpers.arrayElement(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED']),
  }));
  await prisma.clientQuotation.createMany({ data: cqData, skipDuplicates: true });
  console.log(`Seeded ${COUNT} client quotations`);

  // PurchaseOrders
  const poData = Array.from({ length: COUNT }).map((_, i) => ({
    poNumber: 'PO-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    supplierId: faker.helpers.arrayElement(suppliers).id,
    clientId: faker.helpers.arrayElement(clients).id,
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED']),
    amount: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    expectedDeliveryDate: faker.date.future(),
  }));
  await prisma.purchaseOrder.createMany({ data: poData, skipDuplicates: true });
  const purchaseOrders = await prisma.purchaseOrder.findMany();
  console.log(`Seeded ${COUNT} purchase orders`);

  // Shipments
  const shipmentData = Array.from({ length: COUNT }).map((_, i) => ({
    shipmentNumber: 'SHP-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    purchaseOrderId: faker.helpers.arrayElement(purchaseOrders).id,
    supplierId: faker.helpers.arrayElement(suppliers).id,
    clientId: faker.helpers.arrayElement(clients).id,
    cargoDetails: faker.lorem.words(3),
    vehicleDetails: faker.vehicle.vrm(),
    driverDetails: faker.person.fullName(),
    currentStatus: faker.helpers.arrayElement(['PENDING', 'IN_TRANSIT', 'DELIVERED']),
  }));
  await prisma.shipment.createMany({ data: shipmentData, skipDuplicates: true });
  const shipments = await prisma.shipment.findMany();
  console.log(`Seeded ${COUNT} shipments`);

  // Invoices
  const invoiceData = Array.from({ length: COUNT }).map((_, i) => ({
    invoiceNumber: 'INV-' + faker.string.alphanumeric(8).toUpperCase() + '-' + i,
    clientId: faker.helpers.arrayElement(clients).id,
    inquiryId: faker.helpers.arrayElement(inquiries).id,
    shipmentId: faker.helpers.arrayElement(shipments).id,
    dueDate: faker.date.future(),
    subtotal: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
    tax: faker.number.float({ min: 10, max: 1000, fractionDigits: 2 }),
    total: faker.number.float({ min: 110, max: 11000, fractionDigits: 2 }),
    pendingAmount: faker.number.float({ min: 110, max: 11000, fractionDigits: 2 }),
    status: faker.helpers.arrayElement(['DRAFT', 'SENT', 'PAID', 'OVERDUE']),
  }));
  await prisma.invoice.createMany({ data: invoiceData, skipDuplicates: true });
  const invoices = await prisma.invoice.findMany();
  console.log(`Seeded ${COUNT} invoices`);

  // Payments
  const paymentData = Array.from({ length: COUNT }).map(() => ({
    invoiceId: faker.helpers.arrayElement(invoices).id,
    amount: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
    paymentMode: faker.helpers.arrayElement(['BANK_TRANSFER', 'CASH', 'CREDIT_CARD']),
    bankAccountId: faker.helpers.arrayElement(banks).id,
    transactionReference: faker.string.alphanumeric(10),
  }));
  await prisma.payment.createMany({ data: paymentData });
  console.log(`Seeded ${COUNT} payments`);

  // Notifications
  const notifData = Array.from({ length: COUNT }).map(() => ({
    userId: faker.helpers.arrayElement(users).id,
    title: faker.lorem.words(3),
    message: faker.lorem.sentence(),
    type: faker.helpers.arrayElement(['INFO', 'WARNING', 'SUCCESS', 'ERROR']),
  }));
  await prisma.notification.createMany({ data: notifData });
  console.log(`Seeded ${COUNT} notifications`);

  // AuditLogs
  const auditData = Array.from({ length: COUNT }).map(() => ({
    userId: faker.helpers.arrayElement(users).id,
    module: faker.helpers.arrayElement(['Clients', 'Inquiries', 'Invoices', 'Shipments']),
    action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'APPROVE']),
    ipAddress: faker.internet.ipv4(),
  }));
  await prisma.auditLog.createMany({ data: auditData });
  console.log(`Seeded ${COUNT} audit logs`);

  console.log('Mock seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
