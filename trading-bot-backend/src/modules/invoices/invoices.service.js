const prisma = require('../../prisma/client');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const { sendInvoiceEmail } = require('../../utils/email.service');

/**
 * Get all invoices (filtered for clients)
 */
const getAllInvoices = async (user, query = {}) => {
  const { page, pageSize, paginate, search, statuses, excludeStatuses, inquiryId } = query;
  const whereClause = { deletedAt: null };
  if (user && user.role === 'Client') {
    whereClause.clientId = user.id;
  }
  if (inquiryId) {
    const parsedInquiryId = parseInt(inquiryId, 10);
    if (whereClause.OR) {
        whereClause.AND = [
            { OR: whereClause.OR },
            { OR: [{ inquiryId: parsedInquiryId }, { shipment: { purchaseOrder: { inquiryId: parsedInquiryId } } }] }
        ];
        delete whereClause.OR;
    } else {
        whereClause.OR = [
          { inquiryId: parsedInquiryId },
          { shipment: { purchaseOrder: { inquiryId: parsedInquiryId } } }
        ];
    }
  }

  if (search) {
    const searchOr = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { shipment: { cargoDetails: { contains: search, mode: 'insensitive' } } }
    ];
    if (whereClause.OR) {
        whereClause.AND = whereClause.AND || [];
        whereClause.AND.push({ OR: whereClause.OR });
        whereClause.AND.push({ OR: searchOr });
        delete whereClause.OR;
    } else {
        whereClause.OR = searchOr;
    }
  }

  if (statuses) {
    whereClause.status = { in: statuses.split(',') };
  }

  if (excludeStatuses) {
    if (whereClause.status) {
      whereClause.status.notIn = excludeStatuses.split(',');
    } else {
      whereClause.status = { notIn: excludeStatuses.split(',') };
    }
  }

  if (paginate === 'false') {
    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: true,
        inquiry: true,
        shipment: { include: { supplier: true, purchaseOrder: true } },
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { data: invoices, total: invoices.length };
  }

  const skip = page && pageSize ? (parseInt(page) - 1) * parseInt(pageSize) : undefined;
  const take = pageSize ? parseInt(pageSize) : undefined;

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where: whereClause,
      include: {
        client: true,
        inquiry: true,
        shipment: { include: { supplier: true, purchaseOrder: true } },
        items: true,
        payments: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take
    }),
    prisma.invoice.count({ where: whereClause })
  ]);

  return { data: invoices, total };
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (id) => {
  return await prisma.invoice.findFirst({
    where: { id, deletedAt: null },
    include: {
      client: true,
      inquiry: true,
      shipment: { include: { supplier: true } },
      items: true,
      payments: {
        include: {
          bankAccount: true
        }
      }
    }
  });
};

/**
 * Create a new invoice
 */
const createInvoice = async (data, creatorId) => {
  return await prisma.$transaction(async (tx) => {
    const invCount = await tx.invoice.count();
    const invoiceNumber = `INV-${1000 + invCount + 1}`;

    const subtotal = parseFloat(data.subtotal);
    const tax = parseFloat(data.tax || 0);
    const discount = parseFloat(data.discount || 0);
    const total = subtotal + tax - discount;

    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        inquiryId: data.inquiryId || null,
        shipmentId: data.shipmentId || null,
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        subtotal,
        tax,
        discount,
        total,
        paidAmount: 0,
        pendingAmount: total,
        status: data.status || 'DRAFT',
        createdById: creatorId
      }
    });

    if (data.items && data.items.length > 0) {
      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: invoice.id,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      });
    }

    return await tx.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        client: true,
        items: true
      }
    });
  });
};

/**
 * Update invoice details
 */
const updateInvoice = async (id, data, updaterId) => {
  return await prisma.$transaction(async (tx) => {
    const old = await tx.invoice.findUnique({
      where: { id: parseInt(id) }
    });

    if (!old) {
      throw new Error('Invoice not found');
    }

    const updateData = {
      updatedById: updaterId
    };

    if (data.status) updateData.status = data.status;
    if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
    if (data.invoiceDate) updateData.invoiceDate = new Date(data.invoiceDate);
    if (data.paymentDetails !== undefined) updateData.paymentDetails = data.paymentDetails;

    const sub = data.subtotal !== undefined ? parseFloat(data.subtotal) : old.subtotal.toNumber();
    const txVal = data.tax !== undefined ? parseFloat(data.tax) : old.tax.toNumber();
    const disc = data.discount !== undefined ? parseFloat(data.discount) : old.discount.toNumber();

    if (data.subtotal !== undefined) updateData.subtotal = sub;
    if (data.tax !== undefined) updateData.tax = txVal;
    if (data.discount !== undefined) updateData.discount = disc;

    const total = sub + txVal - disc;
    updateData.total = total;
    updateData.pendingAmount = total - old.paidAmount.toNumber();

    const invoice = await tx.invoice.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    if (data.items && data.items.length > 0) {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: parseInt(id) }
      });

      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: parseInt(id),
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      });
    }

    // Check if we should close the inquiry
    if (data.status === 'PAID') {
      let relatedInquiryId = old.inquiryId;
      if (!relatedInquiryId && old.shipmentId) {
        const shipment = await tx.shipment.findUnique({ where: { id: old.shipmentId } });
        if (shipment) relatedInquiryId = shipment.inquiryId;
      }
      
      if (relatedInquiryId) {
        const allInvoices = await tx.invoice.findMany({
          where: {
            OR: [
              { inquiryId: relatedInquiryId },
              { shipment: { inquiryId: relatedInquiryId } }
            ],
            isActive: true
          }
        });
        
        const allPaid = allInvoices.length > 0 && allInvoices.every(inv => inv.status === 'PAID');
        if (allPaid) {
          await tx.inquiry.update({
            where: { id: relatedInquiryId },
            data: { currentStatus: 'CLOSED' }
          });
        }
      }
    }

    return await tx.invoice.findUnique({
      where: { id: parseInt(id) },
      include: {
        client: true,
        items: true
      }
    });
  });
};

/**
 * Soft delete invoice
 */
// Restart server to load new prisma client
const deleteInvoice = async (id, updaterId) => {
  return await prisma.invoice.update({
    where: { id: parseInt(id) },
    data: {
      deletedAt: new Date(),
      isActive: false,
      updatedById: updaterId
    }
  });
};

/**
 * Generate invoice from shipment, create PDF, and email it
 */
const generateInvoiceFromShipment = async (shipmentId, creatorId) => {
  // 1. Fetch shipment and PO data
  const shipment = await prisma.shipment.findUnique({
    where: { id: shipmentId },
    include: {
      client: true,
      purchaseOrder: {
        include: { items: true }
      }
    }
  });

  if (!shipment) throw new Error('Shipment not found');
  if (!shipment.purchaseOrder) throw new Error('No purchase order linked to this shipment');

  // 2. Calculate totals
  let subtotal = 0;
  const items = shipment.purchaseOrder.items.map(poItem => {
    const total = parseFloat(poItem.totalPrice);
    subtotal += total;
    return {
      description: poItem.description || 'Product Item',
      quantity: poItem.quantity,
      unitPrice: poItem.unitPrice,
      totalPrice: poItem.totalPrice
    };
  });

  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  // 3. Create or fetch invoice in DB
  let invoice = await prisma.invoice.findFirst({
    where: { shipmentId: shipment.id },
    include: { items: true, client: true }
  });

  if (!invoice) {
    const invoiceData = {
      clientId: shipment.clientId,
      shipmentId: shipment.id,
      inquiryId: shipment.purchaseOrder?.inquiryId || shipment.inquiryId,
      subtotal,
      tax,
      total,
      status: 'DRAFT', // Saved as DRAFT for preview
      items
    };
    invoice = await createInvoice(invoiceData, creatorId);
  }

  // 4. Generate PDF
  const templatePath = path.join(__dirname, '../../utils/templates/invoice.ejs');

  // Convert Decimals to numbers for rendering
  const renderData = {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      poNumber: shipment.purchaseOrder.poNumber,
      subtotal: parseFloat(invoice.subtotal),
      tax: parseFloat(invoice.tax),
      total: parseFloat(invoice.total)
    },
    client: shipment.client,
    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), totalPrice: parseFloat(i.totalPrice) }))
  };

  const html = await ejs.renderFile(templatePath, renderData);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  const pdfBase64 = Buffer.from(pdfUint8Array).toString('base64');

  const defaultEmailSubject = `Your Invoice ${invoice.invoiceNumber}`;
  const defaultEmailBody = `Dear Client,\n\nPlease find attached the invoice ${invoice.invoiceNumber} for your recent order.\n\nThank you for your business!`;

  return {
    invoice,
    pdfBase64,
    defaultEmailSubject,
    defaultEmailBody
  };
};

/**
 * Generate invoice from inquiry (for grouped orders / full deals)
 */
const generateInvoiceFromInquiry = async (inquiryId, creatorId) => {
  // 1. Fetch inquiry with client quotation
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      client: true,
      clientQuotations: {
        include: { 
          items: {
            include: {
              inquiryItem: true
            }
          } 
        }
      }
    }
  });

  if (!inquiry) throw new Error('Inquiry not found');
  if (!inquiry.clientQuotations || inquiry.clientQuotations.length === 0) {
    throw new Error('No client quotation linked to this inquiry');
  }

  const quotation = inquiry.clientQuotations[0];

  // 2. Calculate totals
  let subtotal = 0;
  const items = quotation.items.map(qItem => {
    const total = parseFloat(qItem.totalPrice);
    subtotal += total;
    return {
      description: qItem.inquiryItem?.description || `Product from Inquiry ${inquiry.inquiryNumber}`,
      quantity: qItem.quantity,
      unitPrice: qItem.sellingPrice,
      totalPrice: qItem.totalPrice
    };
  });

  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + tax;

  // 3. Create or fetch invoice in DB
  let invoice = await prisma.invoice.findFirst({
    where: { inquiryId: inquiry.id, shipmentId: null },
    include: { items: true, client: true }
  });

  if (!invoice) {
    const invoiceData = {
      clientId: inquiry.clientId,
      inquiryId: inquiry.id,
      subtotal,
      tax,
      total,
      status: 'DRAFT',
      items
    };
    invoice = await createInvoice(invoiceData, creatorId);
  } else if (invoice.status === 'DRAFT') {
    // Update the draft invoice with the latest items to ensure it matches the quotation
    invoice = await updateInvoice(invoice.id, { subtotal, tax, total, items }, creatorId);
  }

  // 4. Generate PDF
  const templatePath = path.join(__dirname, '../../utils/templates/invoice.ejs');

  // Convert Decimals to numbers for rendering
  const renderData = {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      poNumber: inquiry.referenceNumber || inquiry.inquiryNumber || 'N/A',
      subtotal: parseFloat(invoice.subtotal),
      tax: parseFloat(invoice.tax),
      total: parseFloat(invoice.total)
    },
    client: inquiry.client,
    items: invoice.items ? invoice.items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), totalPrice: parseFloat(i.totalPrice) })) : items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), totalPrice: parseFloat(i.totalPrice) }))
  };

  const html = await ejs.renderFile(templatePath, renderData);

  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  const pdfBase64 = Buffer.from(pdfUint8Array).toString('base64');

  const defaultEmailSubject = `Your Invoice ${invoice.invoiceNumber}`;
  const defaultEmailBody = `Dear Client,\n\nPlease find attached the invoice ${invoice.invoiceNumber} for your recent order.\n\nThank you for your business!`;

  return { 
    invoice,
    pdfBase64,
    defaultEmailSubject,
    defaultEmailBody
  };
};

/**
 * Helper to generate PDF buffer for an invoice
 */
const generateInvoicePdfBuffer = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      items: true,
      inquiry: true,
      shipment: {
        include: { purchaseOrder: true }
      }
    }
  });

  if (!invoice) throw new Error('Invoice not found');

  const templatePath = path.join(__dirname, '../../utils/templates/invoice.ejs');
  const renderData = {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: new Date(invoice.invoiceDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      poNumber: invoice.shipment?.purchaseOrder?.poNumber || invoice.inquiry?.referenceNumber || invoice.inquiry?.inquiryNumber || 'N/A',
      subtotal: parseFloat(invoice.subtotal),
      tax: parseFloat(invoice.tax),
      total: parseFloat(invoice.total)
    },
    client: invoice.client,
    items: invoice.items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice), totalPrice: parseFloat(i.totalPrice) }))
  };

  const html = await ejs.renderFile(templatePath, renderData);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  await browser.close();

  return { pdfBuffer, invoice };
};

/**
 * Send the drafted invoice to the client via email
 */
const sendInvoiceEmailAPI = async (invoiceId, emailSubject, emailBody, updaterId, toEmail) => {
  const { pdfBuffer, invoice } = await generateInvoicePdfBuffer(invoiceId);

  // Send Email with custom body if provided
  let emailPreviewUrl = null;
  if (invoice.client.email) {
    // Modify email service to accept custom body if needed, but for now we'll send it directly here
    const nodemailer = require('nodemailer');
    const { createTransporter } = require('../../utils/email.service');

    // Fallback if the helper doesn't export createTransporter
    let testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await transporter.sendMail({
      from: '"TradeMind ERP" <billing@trademind.com>',
      to: toEmail || invoice.client.email,
      subject: emailSubject || `Your Invoice ${invoice.invoiceNumber}`,
      text: emailBody || `Please find attached the invoice ${invoice.invoiceNumber} for your recent order.`,
      html: `<p>${(emailBody || '').replace(/\n/g, '<br/>')}</p>`,
      attachments: [
        {
          filename: `Invoice_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    });
    emailPreviewUrl = nodemailer.getTestMessageUrl(info);
  }

  // Update status to SENT
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'SENT',
      updatedById: updaterId
    }
  });

  return { invoice: updatedInvoice, emailPreviewUrl };
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  generateInvoiceFromShipment,
  generateInvoiceFromInquiry,
  sendInvoiceEmailAPI,
  generateInvoicePdfBuffer
};
