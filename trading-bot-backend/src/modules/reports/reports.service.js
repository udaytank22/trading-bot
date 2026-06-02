const prisma = require('../../prisma/client');
const { resolveDocumentStatus } = require('../documents/documents.service');

/**
 * Get dashboard summary stats
 */
const getDashboardStats = async () => {
  const now = new Date();
  const startOfDay = new Date(now.setUTCHours(0, 0, 0, 0));
  const endOfDay = new Date(now.setUTCHours(23, 59, 59, 999));

  // 1. Inquiries today count
  const inquiriesToday = await prisma.inquiry.count({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
      deletedAt: null
    }
  });

  // 2. Quotes sent count
  const quotesSent = await prisma.inquiry.count({
    where: {
      currentStatus: { in: ['QUOTE_SENT', 'CONFIRMED', 'CLOSED'] },
      deletedAt: null
    }
  });

  // 3. Pending replies count
  const pendingReplies = await prisma.inquiry.count({
    where: {
      currentStatus: { in: ['PENDING', 'RFQ_SENT', 'TL_REVIEW'] },
      deletedAt: null
    }
  });

  // 4. Calculate total profit today
  const closedInquiriesToday = await prisma.inquiry.findMany({
    where: {
      currentStatus: { in: ['CONFIRMED', 'CLOSED'] },
      updatedAt: { gte: startOfDay, lte: endOfDay },
      deletedAt: null
    },
    include: {
      supplierQuotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      clientQuotations: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  let profitToday = 0;
  closedInquiriesToday.forEach((inq) => {
    const supplierQuote = inq.supplierQuotes[0];
    const clientQuote = inq.clientQuotations[0];
    if (supplierQuote && clientQuote) {
      profitToday += (clientQuote.finalAmount.toNumber() - supplierQuote.finalAmount.toNumber());
    }
  });

  // 5. Recent inquiries
  const recentInquiries = await prisma.inquiry.findMany({
    where: { deletedAt: null },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      client: true
    }
  });

  // 6. Weekly Profit Trend
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const closedDealsLastWeek = await prisma.inquiry.findMany({
    where: {
      currentStatus: { in: ['CONFIRMED', 'CLOSED'] },
      updatedAt: { gte: weekAgo },
      deletedAt: null
    },
    include: {
      supplierQuotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      clientQuotations: { orderBy: { createdAt: 'desc' }, take: 1 }
    }
  });

  const dailyProfitMap = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    dailyProfitMap[dateStr] = 0;
  }

  closedDealsLastWeek.forEach((inq) => {
    const dateStr = inq.updatedAt.toISOString().split('T')[0];
    const supplierQuote = inq.supplierQuotes[0];
    const clientQuote = inq.clientQuotations[0];
    if (supplierQuote && clientQuote && dailyProfitMap[dateStr] !== undefined) {
      dailyProfitMap[dateStr] += (clientQuote.finalAmount.toNumber() - supplierQuote.finalAmount.toNumber());
    }
  });

  const weeklyTrend = Object.keys(dailyProfitMap).map((date) => ({
    date,
    profit: dailyProfitMap[date]
  })).reverse();

  return {
    inquiriesToday,
    quotesSent,
    pendingReplies,
    profitToday,
    recentInquiries,
    weeklyTrend
  };
};

/**
 * Get inquiry status pipeline counts and turnaround stats
 */
const getInquiryPipelineReport = async () => {
  const inquiries = await prisma.inquiry.findMany({
    where: { deletedAt: null }
  });

  const statusCounts = {};
  inquiries.forEach((inq) => {
    statusCounts[inq.currentStatus] = (statusCounts[inq.currentStatus] || 0) + 1;
  });

  return {
    statusCounts,
    total: inquiries.length
  };
};

/**
 * Calculate net profit and margins for closed deals
 */
const getProfitReport = async (startDate, endDate) => {
  const where = {
    currentStatus: { in: ['CONFIRMED', 'CLOSED'] },
    deletedAt: null
  };

  if (startDate || endDate) {
    where.updatedAt = {};
    if (startDate) where.updatedAt.gte = new Date(startDate);
    if (endDate) where.updatedAt.lte = new Date(endDate);
  }

  const inquiries = await prisma.inquiry.findMany({
    where,
    include: {
      client: true,
      supplierQuotes: { orderBy: { createdAt: 'desc' }, take: 1 },
      clientQuotations: { orderBy: { createdAt: 'desc' }, take: 1 }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const deals = inquiries.map((inq) => {
    const supplierQuote = inq.supplierQuotes[0];
    const clientQuote = inq.clientQuotations[0];
    
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let margin = 0;

    if (clientQuote) {
      revenue = clientQuote.finalAmount.toNumber();
    }
    if (supplierQuote) {
      cost = supplierQuote.finalAmount.toNumber();
    }
    
    profit = revenue - cost;
    margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return {
      inquiryNumber: inq.inquiryNumber,
      clientName: inq.client.name,
      vesselName: inq.vesselName,
      dateClosed: inq.updatedAt,
      revenue,
      cost,
      profit,
      marginPercentage: margin.toFixed(2)
    };
  });

  const summary = deals.reduce(
    (acc, deal) => {
      acc.totalRevenue += deal.revenue;
      acc.totalCost += deal.cost;
      acc.totalProfit += deal.profit;
      return acc;
    },
    { totalRevenue: 0, totalCost: 0, totalProfit: 0 }
  );

  summary.averageMargin = summary.totalRevenue > 0 ? ((summary.totalProfit / summary.totalRevenue) * 100).toFixed(2) : '0.00';

  return {
    summary,
    deals
  };
};

/**
 * Summarize accounts receivable (Invoices pending)
 */
const getInvoiceReport = async (startDate, endDate) => {
  const where = { deletedAt: null };

  if (startDate || endDate) {
    where.invoiceDate = {};
    if (startDate) where.invoiceDate.gte = new Date(startDate);
    if (endDate) where.invoiceDate.lte = new Date(endDate);
  }

  const invoices = await prisma.invoice.findMany({
    where,
    include: {
      client: true
    },
    orderBy: { invoiceDate: 'desc' }
  });

  const summary = invoices.reduce(
    (acc, inv) => {
      acc.totalBilled += inv.total.toNumber();
      acc.totalPaid += inv.paidAmount.toNumber();
      acc.totalPending += inv.pendingAmount.toNumber();
      return acc;
    },
    { totalBilled: 0, totalPaid: 0, totalPending: 0 }
  );

  return {
    summary,
    invoices
  };
};

/**
 * Summarize incoming payments
 */
const getPaymentReport = async (startDate, endDate) => {
  const where = { deletedAt: null };

  if (startDate || endDate) {
    where.paymentDate = {};
    if (startDate) where.paymentDate.gte = new Date(startDate);
    if (endDate) where.paymentDate.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      invoice: {
        include: {
          client: true
        }
      },
      bankAccount: true
    },
    orderBy: { paymentDate: 'desc' }
  });

  const totalReceived = payments.reduce((acc, pay) => acc + pay.amount.toNumber(), 0);

  return {
    totalReceived,
    payments
  };
};

/**
 * Stock levels and warnings
 */
const getInventoryReport = async () => {
  const items = await prisma.inventoryItem.findMany({
    where: { deletedAt: null },
    include: {
      stocks: {
        include: {
          warehouse: true
        }
      }
    }
  });

  const report = items.map((item) => {
    const totalQty = item.stocks.reduce((acc, st) => acc + st.quantity, 0);
    const isLowStock = totalQty <= item.minimumStockLevel;
    
    let status = 'In Stock';
    if (totalQty === 0) {
      status = 'Out of Stock';
    } else if (isLowStock) {
      status = 'Low Stock';
    }

    return {
      id: item.id,
      itemName: item.itemName,
      sku: item.sku,
      category: item.category,
      unit: item.unit,
      sellingPrice: item.sellingPrice.toNumber(),
      purchasePrice: item.purchasePrice.toNumber(),
      totalQty,
      minimumStockLevel: item.minimumStockLevel,
      isLowStock,
      status
    };
  });

  return report;
};

/**
 * Summarize employee attendances
 */
const getEmployeeReport = async () => {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    include: {
      attendance: true
    }
  });

  return employees.map((emp) => {
    const totalRecords = emp.attendance.length;
    const present = emp.attendance.filter(a => a.status === 'PRESENT').length;
    const late = emp.attendance.filter(a => a.status === 'LATE').length;
    const sickLeave = emp.attendance.filter(a => a.status === 'SICK_LEAVE').length;
    const offDay = emp.attendance.filter(a => a.status === 'OFF_DAY').length;

    return {
      id: emp.id,
      fullName: emp.fullName,
      email: emp.email,
      department: emp.department,
      designation: emp.designation,
      status: emp.status,
      attendanceStats: {
        totalRecords,
        present,
        late,
        sickLeave,
        offDay
      }
    };
  });
};

/**
 * Filter expired and expiring compliance documents
 */
const getDocumentExpiryReport = async () => {
  const docs = await prisma.document.findMany({
    where: { deletedAt: null },
    include: {
      employee: true
    }
  });

  return docs
    .map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      entityType: doc.entityType,
      entityId: doc.entityId,
      expiryDate: doc.expiryDate,
      filePath: doc.filePath,
      employeeName: doc.employee ? doc.employee.fullName : null,
      status: resolveDocumentStatus(doc.expiryDate)
    }))
    .filter(doc => doc.status === 'EXPIRED' || doc.status === 'EXPIRING_SOON');
};

module.exports = {
  getDashboardStats,
  getInquiryPipelineReport,
  getProfitReport,
  getInvoiceReport,
  getPaymentReport,
  getInventoryReport,
  getEmployeeReport,
  getDocumentExpiryReport
};
