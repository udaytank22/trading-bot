import React, { useState, useEffect, useMemo } from 'react';
import { DownloadIcon, FilterIcon, FileTextIcon, RefreshCwIcon, FileSpreadsheetIcon } from 'lucide-react';
import { DataTable } from '../../components/ui';
import { 
  getPipelineReport, 
  getProfitReport, 
  getInvoiceReport, 
  getPaymentReport, 
  getInventoryReport, 
  getEmployeeReport, 
  getDocumentExpiryReport 
} from '../../api/reports';
import { exportToPDF, exportToExcel } from '../../utils/exportUtils';
import PageLoader from '../../components/common/PageLoader';

const REPORT_TYPES = [
  { id: 'profit', label: 'Profit & Margins' },
  { id: 'invoices', label: 'Invoices (AR)' },
  { id: 'payments', label: 'Payments Received' },
  { id: 'pipeline', label: 'Inquiry Pipeline' },
  { id: 'inventory', label: 'Inventory & Stock' },
  { id: 'employees', label: 'Employee Attendance' },
  { id: 'documents', label: 'Expiring Documents' }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('profit');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const loadReport = async () => {
    setLoading(true);
    setData(null); // Clear previous tab data to prevent rendering mismatched summaries
    try {
      const filters = {};
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;

      let res;
      switch (activeTab) {
        case 'profit': res = await getProfitReport(filters); break;
        case 'invoices': res = await getInvoiceReport(filters); break;
        case 'payments': res = await getPaymentReport(filters); break;
        case 'pipeline': res = await getPipelineReport(); break;
        case 'inventory': res = await getInventoryReport(); break;
        case 'employees': res = await getEmployeeReport(); break;
        case 'documents': res = await getDocumentExpiryReport(); break;
        default: break;
      }
      setData(res?.data || res);
    } catch (error) {
      console.error('Failed to load report', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [activeTab]);

  const handleExportPDF = () => {
    if (!data) return;
    const { title, columns, tableData } = getExportConfig();
    exportToPDF(title, columns, tableData);
  };

  const handleExportExcel = () => {
    if (!data) return;
    const { title, columns, tableData } = getExportConfig();
    exportToExcel(title, columns, tableData);
  };

  // Helper to normalize data for export based on active tab
  const getExportConfig = () => {
    const toArray = (val) => Array.isArray(val) ? val : (val && Array.isArray(val.data) ? val.data : []);

    switch (activeTab) {
      case 'profit':
        return {
          title: 'Profit and Margin Report',
          columns: [
            { header: 'Inquiry No', key: 'inquiryNumber' },
            { header: 'Client', key: 'clientName' },
            { header: 'Vessel', key: 'vesselName' },
            { header: 'Revenue', key: 'revenue' },
            { header: 'Cost', key: 'cost' },
            { header: 'Profit', key: 'profit' },
            { header: 'Margin (%)', key: 'marginPercentage' },
            { header: 'Date Closed', key: 'dateClosed' },
          ],
          tableData: data.deals || []
        };
      case 'invoices':
        return {
          title: 'Invoices Report',
          columns: [
            { header: 'Invoice No', key: 'invoiceNumber' },
            { header: 'Client', key: 'clientName' },
            { header: 'Status', key: 'status' },
            { header: 'Total', key: 'total' },
            { header: 'Paid', key: 'paidAmount' },
            { header: 'Pending', key: 'pendingAmount' },
            { header: 'Date', key: 'invoiceDate' },
          ],
          tableData: (data.invoices || []).map(i => ({...i, clientName: i.client?.name || 'N/A'}))
        };
      case 'payments':
        return {
          title: 'Payments Report',
          columns: [
            { header: 'Payment Ref', key: 'referenceNumber' },
            { header: 'Invoice No', key: 'invoiceNumber' },
            { header: 'Client', key: 'clientName' },
            { header: 'Amount', key: 'amount' },
            { header: 'Method', key: 'method' },
            { header: 'Date', key: 'paymentDate' },
          ],
          tableData: (data.payments || []).map(p => ({
            ...p, 
            invoiceNumber: p.invoice?.invoiceNumber,
            clientName: p.invoice?.client?.name || 'N/A'
          }))
        };
      case 'pipeline':
        return {
          title: 'Inquiry Pipeline Report',
          columns: [
            { header: 'Status', key: 'status' },
            { header: 'Count', key: 'count' },
          ],
          tableData: Object.entries(data.statusCounts || {}).map(([status, count]) => ({ status, count }))
        };
      case 'inventory':
        return {
          title: 'Inventory Stock Report',
          columns: [
            { header: 'SKU', key: 'sku' },
            { header: 'Item Name', key: 'itemName' },
            { header: 'Category', key: 'category' },
            { header: 'Total Qty', key: 'totalQty' },
            { header: 'Min Level', key: 'minimumStockLevel' },
            { header: 'Status', key: 'status' },
          ],
          tableData: toArray(data)
        };
      case 'employees':
        return {
          title: 'Employee Attendance Report',
          columns: [
            { header: 'Name', key: 'fullName' },
            { header: 'Department', key: 'department' },
            { header: 'Total Records', key: 'totalRecords' },
            { header: 'Present', key: 'present' },
            { header: 'Late', key: 'late' },
            { header: 'Sick', key: 'sickLeave' },
            { header: 'Off Day', key: 'offDay' },
          ],
          tableData: toArray(data).map(e => ({
            ...e, 
            totalRecords: e.attendanceStats?.totalRecords || 0,
            present: e.attendanceStats?.present || 0,
            late: e.attendanceStats?.late || 0,
            sickLeave: e.attendanceStats?.sickLeave || 0,
            offDay: e.attendanceStats?.offDay || 0,
          }))
        };
      case 'documents':
        return {
          title: 'Expiring Documents Report',
          columns: [
            { header: 'Title', key: 'title' },
            { header: 'Category', key: 'category' },
            { header: 'Employee', key: 'employeeName' },
            { header: 'Status', key: 'status' },
            { header: 'Expiry Date', key: 'expiryDate' },
          ],
          tableData: toArray(data)
        };
      default: return { title: 'Report', columns: [], tableData: [] };
    }
  };

  const renderSummaryCards = () => {
    if (!data) return null;
    
    if (activeTab === 'profit' && data.summary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${(data.summary.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${(data.summary.totalCost || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Net Profit</p>
            <p className="text-2xl font-bold text-emerald-600">${(data.summary.totalProfit || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Avg Margin</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.averageMargin || '0.00'}%</p>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'invoices' && data.summary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Billed</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${(data.summary.totalBilled || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-emerald-600">${(data.summary.totalPaid || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Pending (AR)</p>
            <p className="text-2xl font-bold text-red-600">${(data.summary.totalPending || 0).toLocaleString()}</p>
          </div>
        </div>
      );
    }

    if (activeTab === 'payments') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1d23] p-4 rounded-xl border border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">Total Payments Received</p>
            <p className="text-2xl font-bold text-emerald-600">${(data.totalReceived || 0).toLocaleString()}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTable = () => {
    if (loading) return <div className="p-8 text-center"><PageLoader /></div>;
    if (!data) return <div className="p-8 text-center text-gray-500">No data available for this report.</div>;

    const { columns, tableData } = getExportConfig();

    return (
      <div className="overflow-x-auto">
        <DataTable
          columns={columns.map(c => ({ key: c.key, label: c.header }))}
          data={tableData}
          emptyMessage="No records found."
        />
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Reporting Module</h1>
          <p className="text-gray-500 mt-1">Generate, analyze, and export comprehensive business reports.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-lg text-sm font-medium transition-colors"
          >
            <FileTextIcon className="w-4 h-4" />
            PDF
          </button>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-medium transition-colors"
          >
            <FileSpreadsheetIcon className="w-4 h-4" />
            Excel
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1a1d23] rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden mb-6">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-800 custom-scrollbar">
          {REPORT_TYPES.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {['profit', 'invoices', 'payments'].includes(activeTab) && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Start Date</label>
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-[#0c0e12] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">End Date</label>
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                className="w-full sm:w-auto px-3 py-1.5 bg-white dark:bg-[#0c0e12] border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            <button 
              onClick={loadReport}
              className="px-4 py-1.5 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
            >
              <FilterIcon className="w-4 h-4" /> Apply Filters
            </button>
            {(dateRange.startDate || dateRange.endDate) && (
               <button 
                onClick={() => { setDateRange({startDate: '', endDate: ''}); setTimeout(loadReport, 100); }}
                className="px-4 py-1.5 text-gray-500 hover:text-gray-800 dark:hover:text-white text-sm font-medium transition-colors"
             >
               Clear
             </button>
            )}
          </div>
        )}

        <div className="p-6">
          {renderSummaryCards()}
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            {renderTable()}
          </div>
        </div>
      </div>
    </div>
  );
}
