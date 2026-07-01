import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generateRFQPdf(rfq, inquiryId, buyerName, products) {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175); // Dark blue
  doc.text('REQUEST FOR QUOTATION', 14, 22);

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Reference No: ${inquiryId}`, 14, 32);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 38);

  // Supplier Details
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('To:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(rfq.supplierName || 'Supplier', 14, 58);
  
  // Buyer Details
  doc.setFont('helvetica', 'bold');
  doc.text('From:', 120, 52);
  doc.setFont('helvetica', 'normal');
  doc.text('TradeMind Sourcing Team', 120, 58);
  doc.text(`On behalf of: ${buyerName || 'Client'}`, 120, 64);

  // Separator Line
  doc.setDrawColor(200);
  doc.line(14, 72, 196, 72);

  // Letter Body
  doc.setFontSize(10);
  doc.text(
    `Dear ${rfq.supplierName || 'Supplier'},\n\nWe are currently sourcing products for an upcoming requirement. Please review the items requested below\nand provide your best wholesale quotation.`,
    14, 82
  );

  // Table
  const tableData = products.map((p, index) => [
    index + 1,
    p.product_name || 'N/A',
    `${p.quantity || 1} ${p.unit || ''}`,
    p.specs || 'N/A'
  ]);

  autoTable(doc, {
    startY: 102,
    head: [['Sr. No.', 'Product Name', 'Quantity', 'Specifications']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  // Footer
  const finalY = doc.lastAutoTable.finalY || 102;
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Looking forward to your prompt response.', 14, finalY + 15);
  doc.text('TradeMind Sourcing Team', 14, finalY + 21);

  return doc;
}
