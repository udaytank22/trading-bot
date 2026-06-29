/**
 * seed-inquiries.js
 * -----------------
 * 1. Cleans all inquiry-related tables (cascade-safe order).
 * 2. Fetches existing clients and a creator user from the DB.
 * 3. Inserts one inquiry entry per second until N inquiries are created.
 *
 * Usage:
 *   node scripts/seed-inquiries.js [count]
 *
 * Examples:
 *   node scripts/seed-inquiries.js        -> creates 10 inquiries (default)
 *   node scripts/seed-inquiries.js 25     -> creates 25 inquiries
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Configurable
// ---------------------------------------------------------------------------

/** Number of inquiries to create (override with CLI arg). */
const TOTAL = parseInt(process.argv[2] ?? '10', 10);

/** Delay between each insert (ms). */
const DELAY_MS = 1000;

// ---------------------------------------------------------------------------
// Sample data pools
// ---------------------------------------------------------------------------

const VESSEL_NAMES = [
  'MV Horizon Star', 'SS Oceanic Dream', 'MV Pacific Breeze',
  'MV Atlantic Voyager', 'SS Northern Light', 'MV Southern Cross',
  'MV Global Trader', 'SS Silver Mariner', 'MV Blue Horizon',
  'MV Iron Falcon', 'SS Coastal Wind', 'MV Eastern Promise'
];

const ITEM_SETS = [
  ['Marine Diesel Engine Filter', 'Ship Anchor Chain (50m)', 'Navigation Radar Unit'],
  ['Hydraulic Pump Assembly', 'Bilge Water Separator', 'Fire Suppression System'],
  ['Propeller Shaft Bearing', 'Marine Communication Radio', 'Lifeboat Equipment Set'],
  ['Diesel Generator Set 100kW', 'Cooling Water Pump', 'Fuel Injection Nozzle'],
  ['Ballast Water Treatment Unit', 'Mooring Winch Motor', 'Emergency Life Raft'],
  ['Alternator Assembly 24V', 'Engine Room Ventilator', 'Turbocharger Kit'],
  ['Rudder Control System', 'Anchor Windlass Motor', 'Marine Paint (500L)'],
  ['Cargo Hold Hatch Cover', 'Bridge Navigation Console', 'GPS Tracking Module'],
];

const UNITS = ['pcs', 'kg', 'litre', 'set', 'box'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

let inquiryCounter = 1000;

async function generateInquiryNumber() {
  inquiryCounter += 1;
  return `INQ-${inquiryCounter}`;
}

// ---------------------------------------------------------------------------
// Step 1: Clean inquiry-related tables
// ---------------------------------------------------------------------------

async function cleanInquiryTables() {
  console.log('\n  Cleaning inquiry-related tables...\n');

  // Order: children before parents to satisfy FK constraints
  const steps = [
    { name: 'StockMovement',         fn: () => prisma.stockMovement.deleteMany({}) },
    { name: 'Payment',               fn: () => prisma.payment.deleteMany({}) },
    { name: 'InvoiceItem',           fn: () => prisma.invoiceItem.deleteMany({}) },
    { name: 'Invoice',               fn: () => prisma.invoice.deleteMany({}) },
    { name: 'Shipment',              fn: () => prisma.shipment.deleteMany({}) },
    { name: 'PurchaseOrderItem',     fn: () => prisma.purchaseOrderItem.deleteMany({}) },
    { name: 'PurchaseOrder',         fn: () => prisma.purchaseOrder.deleteMany({}) },
    { name: 'SupplierQuoteItem',     fn: () => prisma.supplierQuoteItem.deleteMany({}) },
    { name: 'SupplierQuote',         fn: () => prisma.supplierQuote.deleteMany({}) },
    { name: 'ClientQuotationItem',   fn: () => prisma.clientQuotationItem.deleteMany({}) },
    { name: 'ClientQuotation',       fn: () => prisma.clientQuotation.deleteMany({}) },
    { name: 'ApprovalLog',           fn: () => prisma.approvalLog.deleteMany({}) },
    { name: 'InquiryStatusHistory',  fn: () => prisma.inquiryStatusHistory.deleteMany({}) },
    { name: 'InquirySupplier',       fn: () => prisma.inquirySupplier.deleteMany({}) },
    { name: 'InquiryItem',           fn: () => prisma.inquiryItem.deleteMany({}) },
    { name: 'Inquiry',               fn: () => prisma.inquiry.deleteMany({}) },
  ];

  for (const step of steps) {
    try {
      const result = await step.fn();
      console.log(`   [OK] ${step.name.padEnd(25)} deleted ${result.count} record(s)`);
    } catch (err) {
      console.warn(`   [SKIP] ${step.name.padEnd(23)} ${err.message.split('\n')[0]}`);
    }
  }

  // Reset PostgreSQL auto-increment sequences so id starts from 1 again
  const sequences = [
    { name: 'Inquiry id',              sql: `ALTER SEQUENCE "Inquiry_id_seq" RESTART WITH 1` },
    { name: 'InquiryItem id',          sql: `ALTER SEQUENCE "InquiryItem_id_seq" RESTART WITH 1` },
    { name: 'InquiryStatusHistory id', sql: `ALTER SEQUENCE "InquiryStatusHistory_id_seq" RESTART WITH 1` },
    { name: 'InquirySupplier id',      sql: `ALTER SEQUENCE "InquirySupplier_id_seq" RESTART WITH 1` },
    { name: 'SupplierQuote id',        sql: `ALTER SEQUENCE "SupplierQuote_id_seq" RESTART WITH 1` },
    { name: 'SupplierQuoteItem id',    sql: `ALTER SEQUENCE "SupplierQuoteItem_id_seq" RESTART WITH 1` },
    { name: 'ClientQuotation id',      sql: `ALTER SEQUENCE "ClientQuotation_id_seq" RESTART WITH 1` },
    { name: 'ClientQuotationItem id',  sql: `ALTER SEQUENCE "ClientQuotationItem_id_seq" RESTART WITH 1` },
    { name: 'ApprovalLog id',          sql: `ALTER SEQUENCE "ApprovalLog_id_seq" RESTART WITH 1` },
  ];

  console.log('\n  Resetting auto-increment sequences...\n');
  for (const seq of sequences) {
    try {
      await prisma.$executeRawUnsafe(seq.sql);
      console.log(`   [OK] ${seq.name.padEnd(25)} reset to 1`);
    } catch (err) {
      console.warn(`   [SKIP] ${seq.name.padEnd(23)} ${err.message.split('\n')[0]}`);
    }
  }

  console.log('\n  All inquiry-related tables are now empty and sequences reset.\n');
}

// ---------------------------------------------------------------------------
// Step 2: Fetch prerequisite records from DB
// ---------------------------------------------------------------------------

async function fetchPrerequisites() {
  const clients = await prisma.client.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
    take: 20
  });

  if (clients.length === 0) {
    throw new Error(
      'No active clients found. Run the main seed (npm run prisma:seed) first.'
    );
  }

  const creator = await prisma.user.findFirst({
    where: { deletedAt: null, isActive: true },
    select: { id: true, email: true, role: { select: { name: true } } },
    orderBy: { id: 'asc' }
  });

  if (!creator) {
    throw new Error(
      'No active user found. Run the main seed (npm run prisma:seed) first.'
    );
  }

  // Generate a valid JWT token so the seeder can hit the API
  const token = jwt.sign(
    { userId: creator.id, email: creator.email, role: creator.role?.name || '' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Always start fresh from INQ-1001 (table was just wiped + sequences reset)
  inquiryCounter = 1000;

  console.log(`  Found ${clients.length} client(s).`);
  console.log(`  Creator user  : ${creator.email} (id=${creator.id})`);
  console.log(`  Starting from : INQ-1001 (id=1)\n`);

  return { clients, creator, token };
}

// ---------------------------------------------------------------------------
// Step 3: Insert inquiries one by one with a 1-second gap
// ---------------------------------------------------------------------------

async function insertInquiries(clients, creator, token) {
  console.log(
    `  Inserting ${TOTAL} inquiries with a ${DELAY_MS}ms gap between each...\n`
  );
  console.log(
    '  #'.padEnd(6) +
    'Inquiry No.'.padEnd(14) +
    'Client'.padEnd(22) +
    'Items'.padEnd(8) +
    'API Time'
  );
  console.log('  ' + '-'.repeat(56));

  const PORT = process.env.PORT || 5001;

  for (let i = 1; i <= TOTAL; i++) {
    const client = pick(clients);
    const itemDescriptions = pick(ITEM_SETS);
    const inquiryNumber = await generateInquiryNumber();
    const vessel = Math.random() > 0.3 ? pick(VESSEL_NAMES) : null;

    const t0 = Date.now();

    const itemsData = itemDescriptions.map((desc) => ({
      description: desc,
      quantity: Math.floor(1 + Math.random() * 50),
      unit: pick(UNITS)
    }));

    const payload = {
      clientId: client.id,
      vesselName: vessel,
      imoNumber: vessel ? `IMO${Math.floor(1_000_000 + Math.random() * 9_000_000)}` : null,
      referenceNumber: `REF-${Date.now()}`,
      remarks: `Auto-seeded inquiry ${i}/${TOTAL}`,
      expectedDeliveryDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
      items: itemsData
    };

    try {
      const response = await fetch(`http://localhost:${PORT}/api/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.text();
        console.error(`\n  ❌ Error inserting INQ-${inquiryCounter}:`, errData);
      }
    } catch (err) {
      console.error(`\n  ❌ Fetch error for INQ-${inquiryCounter}:`, err.message);
    }

    const elapsed = Date.now() - t0;
    const clientDisplay = client.name.substring(0, 20).padEnd(22);
    console.log(
      `  ${String(i).padStart(3)}/${TOTAL}  ` +
      `${inquiryNumber.padEnd(14)}` +
      `${clientDisplay}` +
      `${String(itemDescriptions.length).padEnd(8)}` +
      `${elapsed}ms`
    );

    // 1-second gap (skip after last entry)
    if (i < TOTAL) {
      await sleep(DELAY_MS);
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('  INQUIRY SEEDER');
  console.log(`  Target count : ${TOTAL} inquiries`);
  console.log(`  Insert delay : ${DELAY_MS}ms between each entry`);
  console.log('='.repeat(60));

  try {
    await cleanInquiryTables();
    const { clients, creator, token } = await fetchPrerequisites();
    await insertInquiries(clients, creator, token);

    const finalCount = await prisma.inquiry.count();
    console.log('\n' + '='.repeat(60));
    console.log(`  DONE — Total inquiries in DB: ${finalCount}`);
    console.log('='.repeat(60) + '\n');
  } catch (err) {
    console.error('\n  FATAL:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
