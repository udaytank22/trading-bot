import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatNumberINR(amount) {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

function drawRupeeSymbol(doc, x, y, size = 2.4) {
  const prevLineWidth = doc.getLineWidth();
  const prevDrawColor = doc.getDrawColor();
  
  doc.setDrawColor(0, 0, 0); // Black color
  doc.setLineWidth(0.35); // Clean thin line
  
  // Top horizontal bar
  doc.line(x, y - size, x + size * 1.1, y - size);
  
  // Middle horizontal bar
  doc.line(x, y - size * 0.6, x + size * 0.9, y - size * 0.6);
  
  // Stem (on the left, slightly offset)
  const stemX = x + size * 0.25;
  doc.line(stemX, y - size, stemX, y - size * 0.3);
  
  // Loop curve
  doc.line(stemX, y - size, stemX + size * 0.5, y - size * 0.8);
  doc.line(stemX + size * 0.5, y - size * 0.8, stemX + size * 0.5, y - size * 0.5);
  doc.line(stemX + size * 0.5, y - size * 0.5, stemX, y - size * 0.3);
  
  // Diagonal slash
  doc.line(stemX, y - size * 0.3, x + size * 0.85, y);
  
  doc.setLineWidth(prevLineWidth);
  doc.setDrawColor(prevDrawColor);
}

export function generatePOPDF(po) {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const greenColor = [16, 185, 129]; // #10B981
  const yellowColor = [252, 211, 77]; // #fcd34d
  const borderGray = [229, 231, 235];
  
  const drawBorder = (pageDoc) => {
    pageDoc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
    pageDoc.setLineWidth(1.5);
    pageDoc.rect(5, 5, 200, 287); // A4 page boundaries (210 x 297)
  };

  // 1. Draw outer border
  drawBorder(doc);

  // 2. Logo / Header Info (Top Left)
  // Draw circular logo background
  doc.setFillColor(254, 243, 199); // light orange background
  doc.ellipse(25, 22, 9, 9, 'F');
  
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  // Draw inner document book shape
  doc.rect(21, 18, 8, 8, 'F');
  
  // GimBooks text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.text('GimBooks', 14, 38);
  doc.setFontSize(18);
  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.text('GimBooks', 38, 24);

  // Address under logo
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('[Street Address]', 14, 46);
  doc.text('[City, ST ZIP]', 14, 51);
  doc.text('Phone: (000) 000-0000', 14, 56);
  doc.text('Fax: (000) 000-0000', 14, 61);
  doc.text('Website:', 14, 66);

  // 3. Purchase Order Title (Top Right)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.text('PURCHASE ORDER', 98, 24);

  // Date and PO # values
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('DATE', 148, 38);
  doc.text('PO #', 148, 44);

  const formattedDate = new Date(po.date).toLocaleDateString('en-GB');
  doc.setFont('Helvetica', 'bold');
  doc.text(formattedDate, 172, 38);
  doc.text(po.po_id || '[123456]', 172, 44);

  // 4. Vendor / Ship To boxes
  // VENDOR Header Bar
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(14, 72, 76, 6, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('VENDOR', 18, 76.5);

  // VENDOR Details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('[Company Name]', 14, 83);
  doc.text('[Contact or Department]', 14, 88);
  doc.text('[Street Address]', 14, 93);
  doc.text('[City, ST ZIP]', 14, 98);
  doc.text('Phone: (000) 000-0000', 14, 103);
  doc.text('Fax: (000) 000-0000', 14, 108);

  // SHIP TO Header Bar
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(120, 72, 76, 6, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('SHIP TO', 124, 76.5);

  // SHIP TO Details
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(po.customer || '[Name]', 120, 83);
  doc.text('[Company Name]', 120, 88);
  doc.text('[Street Address]', 120, 93);
  doc.text('[City, ST ZIP]', 120, 98);
  doc.text('[Phone]', 120, 103);

  // 5. Requisitioner Bar
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(14, 116, 182, 6, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('REQUISITIONER', 16, 120.2);
  doc.text('SHIP VIA', 60, 120.2);
  doc.text('F.O.B.', 108, 120.2);
  doc.text('SHIPPING TERMS', 144, 120.2);

  // Requisitioner Values Border Boxes
  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(14, 122, 38, 6);
  doc.rect(52, 122, 42, 6);
  doc.rect(94, 122, 32, 6);
  doc.rect(126, 122, 70, 6);

  // Requisitioner actual text (Mocked/Static)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('TradeMind Team', 16, 126.2);
  doc.text('Sea Freight', 54, 126.2);
  doc.text('Origin Port', 96, 126.2);
  doc.text('Prepaid & Added', 128, 126.2);

  // 6. Items Table
  // Prepare Table Data
  const tableBody = (po.products || []).map((p, idx) => [
    `ITEM-${100 + idx}`,
    p.product_name,
    p.quantity.toString(),
    formatNumberINR(p.unit_price || p.my_unit_price || 0),
    formatNumberINR(p.total_price || 0)
  ]);

  // If table body is short, pad it to make it look like a nice blank PO form
  const minRows = 12;
  while (tableBody.length < minRows) {
    tableBody.push(['', '', '', '', '-']);
  }

  autoTable(doc, {
    startY: 134,
    margin: { left: 14, right: 14 },
    head: [['ITEM #', 'DESCRIPTION', 'QTY', 'UNIT PRICE', 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      lineColor: borderGray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: greenColor,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 84 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 20, halign: 'right' }
    },
    didDrawPage: (data) => {
      drawBorder(doc);
    }
  });

  const finalY = doc.lastAutoTable.finalY;

  let footerStartY = finalY;
  // If the footer elements (approx height 45mm) don't fit on the current page before y=270, add a page
  if (footerStartY + 45 > 270) {
    doc.addPage();
    drawBorder(doc);
    footerStartY = 15;
  }

  const subtotal = po.products?.reduce((sum, item) => sum + (item.total_price || 0), 0) || 0;
  const totalAmount = po.total_amount || po.amount || (subtotal * 1.18);
  const gstAmount = Math.max(0, totalAmount - subtotal);

  // Right block (Financials)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text('SUBTOTAL', 138, footerStartY + 8);
  doc.text('TAX (18%)', 138, footerStartY + 14);
  doc.text('SHIPPING', 138, footerStartY + 20);
  doc.text('OTHER', 138, footerStartY + 26);

  doc.setFont('Helvetica', 'bold');
  doc.text(formatNumberINR(subtotal), 196, footerStartY + 8, { align: 'right' });
  doc.text(formatNumberINR(gstAmount), 196, footerStartY + 14, { align: 'right' });
  doc.text('-', 196, footerStartY + 20, { align: 'right' });
  doc.text('-', 196, footerStartY + 26, { align: 'right' });

  // Total Box
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2]);
  doc.rect(136, footerStartY + 30, 60, 8, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL', 138, footerStartY + 35.5);
  drawRupeeSymbol(doc, 162, footerStartY + 35.5, 2.4);
  doc.text(formatNumberINR(totalAmount), 194, footerStartY + 35.5, { align: 'right' });

  // Left block (Comments Box)
  doc.setFillColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.rect(14, footerStartY + 8, 98, 6, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Comments or Special Instructions', 18, footerStartY + 12.2);

  doc.setDrawColor(greenColor[0], greenColor[1], greenColor[2]);
  doc.setLineWidth(0.3);
  doc.rect(14, footerStartY + 14, 98, 24);

  // Footer text at bottom center (absolute positioning on the final page)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('If you have any questions about this purchase order, please contact', 105, 276, { align: 'center' });
  doc.text('[TradeMind Sourcing, +91 98765 43210, contact@trademind.com]', 105, 281, { align: 'center' });

  return doc;
}
