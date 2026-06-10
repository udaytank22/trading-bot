import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a Delivery Challan PDF and returns a Blob URL.
 *
 * @param {object} deal       - Shipment deal object
 * @param {object} vehicle    - Allotted vehicle object
 * @param {string} challanNo  - e.g. "DC-001"
 * @returns {string}          - Object URL of the generated PDF blob
 */
export function generateDeliveryChallanPDF(deal, vehicle, challanNo) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const GREEN = [34, 139, 34];
  const GOLD  = [255, 193, 7];
  const DARK  = [30, 30, 30];
  const GRAY  = [100, 100, 100];
  const WHITE = [255, 255, 255];

  const today = new Date();
  const fmtDate = (d) =>
    `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  const todayStr = fmtDate(today);

  // ── Outer border ──────────────────────────────────────────────────────────────
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(2);
  doc.rect(14, 14, pageW - 28, pageH - 28);

  // ── Header: Logo placeholder + Title ─────────────────────────────────────────
  // Logo circle (gold)
  doc.setFillColor(...GOLD);
  doc.circle(50, 58, 26, 'F');
  doc.setFillColor(255, 255, 255);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('TRADE', 50, 54, { align: 'center' });
  doc.text('MIND', 50, 63, { align: 'center' });

  // "TradeMind" below logo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('TradeMind', 50, 93, { align: 'center' });

  // "DELIVERY CHALLAN" title
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...GREEN);
  doc.text('DELIVERY CHALLAN', pageW - 30, 55, { align: 'right' });

  // Challan number subtitle
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(`Delivery Challan# - ${challanNo}`, pageW - 30, 75, { align: 'right' });

  // ── Divider ───────────────────────────────────────────────────────────────────
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.8);
  doc.line(24, 104, pageW - 24, 104);

  // ── Company Info (Supplier / From) ───────────────────────────────────────────
  const supplierName  = deal?.supplier?.company || deal?.supplier?.name || 'TradeMind Pvt. Ltd.';
  const supplierAddr  = deal?.supplier?.address || '—';
  const supplierPhone = deal?.supplier?.phone   || '—';

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.text(`Company Name: ${supplierName}`, 24, 122);
  doc.text(`Address: ${supplierAddr}`, 24, 137);
  doc.text(`Phone: ${supplierPhone}`, 24, 152);

  // ── Green header row ─────────────────────────────────────────────────────────
  const headerY = 172;
  doc.setFillColor(...GREEN);
  doc.rect(24, headerY, pageW - 48, 22, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...WHITE);
  doc.text('Delivery Challan #', 30, headerY + 14);
  doc.text('Order Date #', pageW / 2, headerY + 14, { align: 'center' });
  doc.text('Dispatch Date #', pageW - 30, headerY + 14, { align: 'right' });

  // Data row below header
  doc.setFillColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...DARK);
  doc.setFontSize(9);
  doc.text(challanNo,  30, headerY + 34);
  doc.text(todayStr,   pageW / 2, headerY + 34, { align: 'center' });
  doc.text(todayStr,   pageW - 30, headerY + 34, { align: 'right' });

  // Thin divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.4);
  doc.line(24, headerY + 42, pageW - 24, headerY + 42);

  // ── Bill To / Challan Details ─────────────────────────────────────────────────
  const billY = headerY + 60;

  // Left: Bill To
  const clientName  = deal?.client?.name   || deal?.buyer_name || '—';
  const clientAddr  = deal?.client?.address || '—';
  const clientPhone = deal?.client?.phone   || '—';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...DARK);
  doc.text('Bill To:', 24, billY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(clientName,  24, billY + 14);
  doc.text(clientAddr,  24, billY + 27);
  doc.text(`Phone: ${clientPhone}`, 24, billY + 40);

  // Right: Challan meta
  const midX = pageW / 2 + 20;
  const rightX = pageW - 30;

  const rowRight = (label, value, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GRAY);
    doc.text(label, midX, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(value, rightX, y, { align: 'right' });
  };

  rowRight('Challan Date #',  todayStr,                           billY);
  rowRight('Vehicle No.',     vehicle?.vehicle_no   || '—',       billY + 14);
  rowRight('Driver Name:',    vehicle?.driver_name || vehicle?.owner_name || '—', billY + 27);
  rowRight('Shipment No.:',   deal?.shipmentNumber  || `SH-${deal?.id}`,  billY + 40);
  rowRight('Challan Type:',   'Delivery Challan',                  billY + 53);

  // ── Items Table ───────────────────────────────────────────────────────────────
  const items = deal?.purchaseOrder?.items || [];

  const tableRows = items.map((item, idx) => {
    const unitPrice  = Number(item.unitPrice)  || 0;
    const qty        = item.quantity            || 1;
    const taxable    = unitPrice * qty;
    const cgstRate   = 9;
    const cgstAmt    = (taxable * cgstRate / 100).toFixed(2);
    const sgstRate   = 9;
    const sgstAmt    = (taxable * sgstRate / 100).toFixed(2);
    return [
      idx + 1,
      item.product?.name || item.description || 'Product',
      item.product?.sku  || '—',
      qty,
      unitPrice.toFixed(2),
      taxable.toFixed(2),
      cgstRate,
      cgstAmt,
      sgstRate,
      sgstAmt,
      0,
      0,
    ];
  });

  const tableStartY = billY + 75;

  doc.autoTable({
    startY: tableStartY,
    margin: { left: 24, right: 24 },
    head: [[
      { content: 'SR\nNo.', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'ITEM\nDESCRIPTION', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'HSN/SAC', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'QTY', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'PRICE/\nITEM', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'TAXABLE\nVALUE', rowSpan: 2, styles: { valign: 'middle', halign: 'center' } },
      { content: 'CGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'SGST', colSpan: 2, styles: { halign: 'center' } },
      { content: 'IGST', colSpan: 2, styles: { halign: 'center' } },
    ],[
      'RATE', 'AMT.', 'RATE', 'AMT.', 'RATE', 'AMT.',
    ]],
    body: tableRows.length > 0 ? tableRows : [[1, 'No items', '—', 0, '0.00', '0.00', 0, '0.00', 0, '0.00', 0, '0.00']],
    headStyles: {
      fillColor: GOLD,
      textColor: [30, 30, 30],
      fontStyle: 'bold',
      fontSize: 7.5,
      lineColor: [200, 200, 200],
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: DARK,
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    alternateRowStyles: { fillColor: [252, 252, 252] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      1: { halign: 'left',   cellWidth: 90 },
      2: { halign: 'center', cellWidth: 55 },
      3: { halign: 'center', cellWidth: 28 },
      4: { halign: 'right',  cellWidth: 45 },
      5: { halign: 'right',  cellWidth: 52 },
      6: { halign: 'center', cellWidth: 28 },
      7: { halign: 'right',  cellWidth: 35 },
      8: { halign: 'center', cellWidth: 28 },
      9: { halign: 'right',  cellWidth: 35 },
      10:{ halign: 'center', cellWidth: 28 },
      11:{ halign: 'right',  cellWidth: 35 },
    },
    theme: 'grid',
  });

  // ── Totals ───────────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY + 16;

  const subtotal = items.reduce((s, i) => s + (Number(i.unitPrice) || 0) * (i.quantity || 1), 0);
  const totalTax = subtotal * 0.18;
  const rounded  = Math.round(subtotal + totalTax) - (subtotal + totalTax);
  const grand    = subtotal + totalTax + rounded;

  const totalsX  = pageW - 24;
  const labelX   = pageW - 160;

  const drawTotRow = (label, value, y, bold = false, highlight = false) => {
    if (highlight) {
      doc.setFillColor(...GOLD);
      doc.rect(labelX - 8, y - 11, totalsX - labelX + 14, 16, 'F');
    }
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    if (highlight) {
      doc.setTextColor(30, 30, 30);
    } else if (bold) {
      doc.setTextColor(...DARK);
    } else {
      doc.setTextColor(...GRAY);
    }
    doc.text(label, labelX, y);
    doc.text(value, totalsX, y, { align: 'right' });
  };

  drawTotRow('Sub Total:', subtotal.toFixed(2), finalY);
  drawTotRow('Total Tax:', totalTax.toFixed(2), finalY + 16);
  drawTotRow('Rounded Off:', Math.abs(rounded).toFixed(2), finalY + 32);

  // Gold grand total bar
  doc.setFillColor(...GOLD);
  doc.rect(labelX - 8, finalY + 42, totalsX - labelX + 14, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text('Grand Total:', labelX, finalY + 54);
  doc.text(Math.round(grand).toString(), totalsX, finalY + 54, { align: 'right' });

  // ── Notes ────────────────────────────────────────────────────────────────────
  const notesY = finalY + 82;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  doc.text('Notes:', 24, notesY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(deal?.trackingRemarks || 'Please sign and return the duplicate copy.', 24, notesY + 14);

  // ── Signature block ───────────────────────────────────────────────────────────
  const sigY = pageH - 80;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.line(24, sigY, 160, sigY);
  doc.line(pageW - 160, sigY, pageW - 24, sigY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Authorised Signatory', 92, sigY + 12, { align: 'center' });
  doc.text("Receiver's Signature", pageW - 92, sigY + 12, { align: 'center' });

  // Return blob URL
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
