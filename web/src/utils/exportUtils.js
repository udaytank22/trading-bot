import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to a formatted PDF file
 * @param {string} title - The title of the report
 * @param {Array<{header: string, key: string}>} columns - Column definitions
 * @param {Array<Object>} data - Array of objects representing the rows
 */
export const exportToPDF = (title, columns, data) => {
  const doc = new jsPDF('landscape', 'pt', 'a4');
  
  // Add Title
  doc.setFontSize(16);
  doc.text(title, 40, 40);
  
  // Add Generation Date
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, 60);

  // Map data to array of arrays based on columns
  const tableData = data.map(row => 
    columns.map(col => {
      // Handle nested or complex data if necessary, here we just use string representation
      const val = row[col.key];
      if (val === null || val === undefined) return '';
      if (typeof val === 'object') return JSON.stringify(val);
      return val.toString();
    })
  );
  
  const head = [columns.map(col => col.header)];

  doc.autoTable({
    startY: 80,
    head: head,
    body: tableData,
    theme: 'grid',
    styles: { 
      fontSize: 8,
      cellPadding: 4,
    },
    headStyles: { 
      fillColor: [147, 51, 234], // Tailwind purple-600
      textColor: 255,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // Tailwind gray-50
    }
  });

  doc.save(`${title.replace(/\\s+/g, '_').toLowerCase()}_${Date.now()}.pdf`);
};

/**
 * Export data to an Excel (.xlsx) file
 * @param {string} title - The title of the report
 * @param {Array<{header: string, key: string}>} columns - Column definitions
 * @param {Array<Object>} data - Array of objects representing the rows
 */
export const exportToExcel = (title, columns, data) => {
  // Map data to match header names exactly
  const sheetData = data.map(row => {
    const rowData = {};
    columns.forEach(col => {
      const val = row[col.key];
      rowData[col.header] = val !== null && val !== undefined ? val : '';
    });
    return rowData;
  });

  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
  
  // Adjust column widths automatically based on header length
  const wscols = columns.map(col => ({ wch: Math.max(col.header.length + 5, 10) }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, `${title.replace(/\\s+/g, '_').toLowerCase()}_${Date.now()}.xlsx`);
};
