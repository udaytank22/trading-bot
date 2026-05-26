import * as XLSX from "xlsx";

/**
 * Parses an Excel or CSV file and returns an array of objects.
 * @param {File} file - The file to parse.
 * @returns {Promise<Array<Object>>}
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        resolve(json);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Maps Excel data to form data based on a provided mapping configuration.
 * @param {Array<Object>} excelData - The data parsed from Excel.
 * @param {Object} mapping - A mapping of Excel column names to form field names.
 * @returns {Object} - The first row mapped to form fields.
 */
export const mapExcelToForm = (excelData, mapping) => {
  if (!excelData || excelData.length === 0) return {};

  const firstRow = excelData[0];
  const mappedData = {};

  Object.entries(mapping).forEach(([excelKey, formKey]) => {
    if (firstRow[excelKey] !== undefined) {
      mappedData[formKey] = firstRow[excelKey];
    }
  });

  return mappedData;
};
