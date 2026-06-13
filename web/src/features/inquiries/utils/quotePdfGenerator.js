import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatINR } from '../../../services/marginEngine';

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

export function generateQuotePDF(deal) {
  const doc = new jsPDF('p', 'mm', 'a4');
  
  const purpleColor = [124, 58, 237]; // #7c3aed (TradeMind theme)
  const yellowColor = [252, 211, 77]; // #fcd34d
  const borderGray = [229, 231, 235];
  
  const drawBorder = (pageDoc) => {
    pageDoc.setDrawColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    pageDoc.setLineWidth(1.5);
    pageDoc.rect(5, 5, 200, 287); // A4 page boundaries (210 x 297)
  };

  // 1. Draw outer border
  drawBorder(doc);

  // 2. Logo / Header Info (Top Left)
  // Draw circular logo background
  doc.setFillColor(243, 232, 255); // light purple background
  doc.ellipse(25, 22, 9, 9, 'F');
  
  doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  // Draw inner document book shape
  doc.rect(21, 18, 8, 8, 'F');
  
  // TradeMind text
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.text('TradeMind', 14, 38);
  doc.setFontSize(18);
  doc.text('TradeMind', 38, 24);

  // Address under logo
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('123 Sourcing Hub', 14, 46);
  doc.text('Mumbai, MH 400001', 14, 51);
  doc.text('Phone: +91 98765 43210', 14, 56);
  doc.text('Email: contact@trademind.com', 14, 61);

  // 3. Quotation Title (Top Right)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.text('QUOTATION', 125, 24);

  // Date and Quote # values
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('DATE', 148, 38);
  doc.text('REF #', 148, 44);

  const formattedDate = new Date().toLocaleDateString('en-GB');
  doc.setFont('Helvetica', 'bold');
  doc.text(formattedDate, 172, 38);
  doc.text(deal.inquiry_id || '[REF]', 172, 44);

  // 4. Customer Box
  doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.rect(14, 72, 86, 6, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text('CUSTOMER', 18, 76.5);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(deal.buyer_name || '[Customer Name]', 14, 83);
  doc.text(deal.buyer_email || '[Email]', 14, 88);
  doc.text(deal.vessel_name || '[Vessel Name]', 14, 93);

  // 5. Items Table
  const itemsList = deal.products || [];
  
  // Prepare Table Data
  const tableBody = itemsList.map((p, idx) => {
    let myQuoteProd = deal.my_quote?.products?.find(mqp => mqp.product_name === p.product_name) || deal.calculated_my_quote?.products?.find(mqp => mqp.product_name === p.product_name);
    
    return [
      p.product_name || '—',
      `${p.quantity} ${p.unit || ''}`,
      myQuoteProd ? formatNumberINR(myQuoteProd.my_unit_price) : 'TBD',
      myQuoteProd ? formatNumberINR(myQuoteProd.total_my_price || myQuoteProd.total_price) : 'TBD'
    ];
  });

  autoTable(doc, {
    startY: 104,
    margin: { left: 14, right: 14 },
    head: [['PRODUCT', 'QTY', 'UNIT PRICE', 'TOTAL']],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      lineColor: borderGray,
      lineWidth: 0.1
    },
    headStyles: {
      fillColor: purpleColor,
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 32, halign: 'right' }
    },
    didDrawPage: (data) => {
      drawBorder(doc);
    }
  });

  const finalY = doc.lastAutoTable.finalY;

  let footerStartY = finalY;
  if (footerStartY + 55 > 270) {
    doc.addPage();
    drawBorder(doc);
    footerStartY = 15;
  }

  // Calculate totals
  const subtotal = itemsList.reduce((sum, p) => {
    let myQuoteProd = deal.my_quote?.products?.find(mqp => mqp.product_name === p.product_name) || deal.calculated_my_quote?.products?.find(mqp => mqp.product_name === p.product_name);
    return sum + (myQuoteProd ? parseFloat(myQuoteProd.total_my_price || myQuoteProd.total_price || 0) : 0);
  }, 0);
  
  const totalAmount = subtotal * 1.18;
  const gstAmount = totalAmount - subtotal;

  // Right block (Financials)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);

  doc.text('SUBTOTAL', 138, footerStartY + 8);
  doc.text('TAX (18%)', 138, footerStartY + 14);

  doc.setFont('Helvetica', 'bold');
  doc.text(formatNumberINR(subtotal), 196, footerStartY + 8, { align: 'right' });
  doc.text(formatNumberINR(gstAmount), 196, footerStartY + 14, { align: 'right' });

  // Total Box
  doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.rect(136, footerStartY + 20, 60, 8, 'F');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL', 138, footerStartY + 25.5);
  // Using INR text if Rupee symbol is tricky with white color, but let's try white color
  doc.text('INR', 162, footerStartY + 25.5);
  doc.text(formatNumberINR(totalAmount), 194, footerStartY + 25.5, { align: 'right' });

  // Left block (Terms Box)
  doc.setFillColor(243, 244, 246);
  doc.rect(14, footerStartY + 8, 110, 26, 'F');
  doc.setDrawColor(purpleColor[0], purpleColor[1], purpleColor[2]);
  doc.setLineWidth(0.8);
  doc.line(14, footerStartY + 8, 14, footerStartY + 34); // left border

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(50, 50, 50);
  doc.text('Payment Terms & Notes', 18, footerStartY + 13);
  
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text('• 50% advance along with confirmed formal PO.', 18, footerStartY + 18);
  doc.text('• Balance 50% prior to dispatch from our warehouse.', 18, footerStartY + 23);
  doc.text('• Price validity runs strictly 15 days from the date of quotation.', 18, footerStartY + 28);

  // Footer text at bottom center (absolute positioning on the final page)
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text('Thank you for your business!', 105, 276, { align: 'center' });
  doc.text('[TradeMind Sourcing, +91 98765 43210, contact@trademind.com]', 105, 281, { align: 'center' });

  return doc;
}
