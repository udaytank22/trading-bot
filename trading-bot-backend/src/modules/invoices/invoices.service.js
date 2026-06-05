const prisma = require('../../prisma/client');
const ejs = require('ejs');
const path = require('path');
const puppeteer = require('puppeteer');
const { sendInvoiceEmail } = require('../../utils/email.service');

/**
 * Get all invoices (filtered for clients)
 */
const getAllInvoices = async (user) => {
  const whereClause = { deletedAt: null };
  if (user && user.role === 'Client') {
    whereClause.clientId = user.id;
  }

  return await prisma.invoice.findMany({
    where: whereClause,
    include: {
      client: true,
      inquiry: true,
      shipment: true,
      items: true,
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  });
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
      shipment: true,
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
      where: { id }
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
      where: { id },
      data: updateData
    });

    if (data.items && data.items.length > 0) {
      await tx.invoiceItem.deleteMany({
        where: { invoiceId: id }
      });

      await tx.invoiceItem.createMany({
        data: data.items.map((item) => ({
          invoiceId: id,
          description: item.description || '',
          quantity: parseInt(item.quantity, 10),
          unitPrice: parseFloat(item.unitPrice),
          totalPrice: parseFloat(item.totalPrice)
        }))
      });
    }

    return await tx.invoice.findUnique({
      where: { id },
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
const deleteInvoice = async (id, updaterId) => {
  return await prisma.invoice.update({
    where: { id },
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
    where: { shipmentId: shipment.id }
  });

  if (!invoice) {
    const invoiceData = {
      clientId: shipment.clientId,
      shipmentId: shipment.id,
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
 * Helper to generate PDF buffer for an invoice
 */
const generateInvoicePdfBuffer = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      client: true,
      items: true,
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
      poNumber: invoice.shipment?.purchaseOrder?.poNumber,
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
const sendInvoiceEmailAPI = async (invoiceId, emailSubject, emailBody, updaterId) => {
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
      to: invoice.client.email,
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
  sendInvoiceEmailAPI,
  generateInvoicePdfBuffer
};
