import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates a Gate Pass PDF and returns a Blob URL.
 * Matches the Fatima Garments style layout.
 *
 * @param {object} deal       - Shipment deal object
 * @param {object} vehicle    - Allotted vehicle object
 * @param {string} gatePassNo - e.g. "GP-001"
 * @returns {string}          - Object URL of the generated PDF blob
 */
export function generateGatePassPDF(deal, vehicle, gatePassNo) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  
  const BLACK = [0, 0, 0];
  const GRAY = [245, 245, 245];

  const today = new Date();
  const fmtDate = (d) =>
    `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  const todayStr = fmtDate(today);

  // ── Header: FATIMA GARMENTS style ─────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(...BLACK);
  doc.text('FATIMA GARMENTS', pageW / 2, 60, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(16);
  doc.text('All Kinds of Textile & Garments', pageW / 2, 80, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(14);
  doc.text('Plot#2/3, Sector 21, Murtaza Chowrangi,', pageW / 2, 100, { align: 'center' });
  doc.text('Industrial Area Korangi Karachi', pageW / 2, 118, { align: 'center' });
  doc.text('Cell: 0331-9930044', pageW / 2, 136, { align: 'center' });

  // ── Title ──────────────────────────────────────────────────────────────
  doc.setFont('times', 'bold');
  doc.setFontSize(26);
  doc.text('Gate Pass', pageW / 2, 175, { align: 'center' });

  // ── Fields ─────────────────────────────────────────────────────────────
  const fieldY = 210;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('S.No.', 40, fieldY);
  doc.setLineWidth(1);
  doc.line(90, fieldY, 250, fieldY);
  doc.setFont('helvetica', 'normal');
  doc.text(gatePassNo, 95, fieldY - 3);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 40, fieldY + 30);
  doc.line(90, fieldY + 30, 250, fieldY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(todayStr, 95, fieldY + 27);

  const vehicleNo = vehicle?.vehicle_no || '—';
  doc.setFont('helvetica', 'bold');
  doc.text('Vehicle No.', 340, fieldY + 30);
  doc.line(430, fieldY + 30, pageW - 40, fieldY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(vehicleNo, 435, fieldY + 27);

  const driverName = vehicle?.driver_name || vehicle?.owner_name || '—';
  doc.setFont('helvetica', 'bold');
  doc.text('Name:.', 40, fieldY + 60);
  doc.line(95, fieldY + 60, pageW - 40, fieldY + 60);
  doc.setFont('helvetica', 'normal');
  doc.text(driverName, 100, fieldY + 57);

  const destination = deal?.client?.address || deal?.client?.name || '—';
  doc.setFont('helvetica', 'bold');
  doc.text('Destination:.', 40, fieldY + 90);
  doc.line(130, fieldY + 90, pageW - 40, fieldY + 90);
  doc.setFont('helvetica', 'normal');
  doc.text(destination, 135, fieldY + 87);


  // ── Items Table ────────────────────────────────────────────────────────
  let items = deal?.purchaseOrder?.items || [];
  if (items.length === 0 && deal?.subShipments) {
      deal.subShipments.forEach(sub => {
          if (sub.purchaseOrder?.items) {
              items = items.concat(sub.purchaseOrder.items);
          } else if (sub.cargoDetails) {
              items.push({
                  description: sub.cargoDetails,
                  quantity: sub.quantity || 1,
                  product: { sku: '-' }
              });
          }
      });
  }

  const tableRows = items.map((item, idx) => {
    return [
      idx + 1,
      item.product?.sku || '-', // Style
      item.product?.name || item.description || 'Product', // Particular
      item.quantity || 1, // Quantity
      '', // Ctn (empty for manual entry or -)
    ];
  });

  // Ensure there are at least 10 rows to match the image style
  while (tableRows.length < 10) {
      tableRows.push(['', '', '', '', '']);
  }

  const tableStartY = fieldY + 110;

  doc.autoTable({
    startY: tableStartY,
    margin: { left: 40, right: 40 },
    head: [[
      { content: 'S.No.', styles: { halign: 'center' } },
      { content: 'Style', styles: { halign: 'center' } },
      { content: 'Particular', styles: { halign: 'center' } },
      { content: 'Quantity', styles: { halign: 'center' } },
      { content: 'Ctn', styles: { halign: 'center' } },
    ]],
    body: tableRows,
    headStyles: {
      fillColor: GRAY,
      textColor: BLACK,
      fontStyle: 'bold',
      fontSize: 12,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
    },
    bodyStyles: {
      fontSize: 12,
      textColor: BLACK,
      lineColor: [200, 200, 200],
      lineWidth: 0.5,
      minCellHeight: 25, // Generous row height
    },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 50 },
      1: { halign: 'center', cellWidth: 100 },
      2: { halign: 'left',   cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 80 },
      4: { halign: 'center', cellWidth: 80 },
    },
    theme: 'grid',
  });

  // ── Footer Signatures ──────────────────────────────────────────────────
  const sigY = pageH - 80;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  
  doc.text('Prepared By:', 40, sigY);
  doc.text('Head of Deptt.', 180, sigY);
  doc.text('Authorized By:', 340, sigY);
  doc.text('Received', 490, sigY);

  // Return blob URL
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
}
