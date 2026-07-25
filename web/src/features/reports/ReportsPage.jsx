import React, { useState, useEffect, useMemo } from 'react';
import { DownloadIcon, FilterIcon, FileTextIcon, RefreshCwIcon, FileSpreadsheetIcon } from 'lucide-react';
import { DataTable, PageContainer } from '../../components/ui';
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
  { id: 'profit', label: 'Profit & margins' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'pipeline', label: 'Inquiry pipeline' },
  { id: 'inventory', label: 'Inventory & stock' }
];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('profit');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  const loadReport = async () => {
    setLoading(true);
    setData(null);
    try {
      const filters = {};
      if (dateRange.startDate) filters.startDate = dateRange.startDate;
      if (dateRange.endDate) filters.endDate = dateRange.endDate;

      let res;
      switch (activeTab) {
        case 'profit': res = await getProfitReport(filters); break;
        case 'invoices': res = await getInvoiceReport(filters); break;
        case 'pipeline': res = await getPipelineReport(); break;
        case 'inventory': res = await getInventoryReport(); break;
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

  const getExportConfig = () => {
    const toArray = (val) => Array.isArray(val) ? val : (val && Array.isArray(val.data) ? val.data : []);

    switch (activeTab) {
      case 'profit':
        return {
          title: 'Profit and Margin Report',
          columns: [
            { header: 'INQUIRY', key: 'inquiryNumber' },
            { header: 'CLIENT', key: 'clientName' },
            { header: 'VESSEL', key: 'vesselName' },
            { header: 'REVENUE', key: 'revenue' },
            { header: 'COST', key: 'cost' },
            { header: 'PROFIT', key: 'profit' },
            { header: 'MARGIN', key: 'marginPercentage' }
          ],
          tableData: data.deals || []
        };
      case 'invoices':
        return {
          title: 'Invoices Report',
          columns: [
            { header: 'INVOICE NO', key: 'invoiceNumber' },
            { header: 'CLIENT', key: 'clientName' },
            { header: 'STATUS', key: 'status' },
            { header: 'TOTAL', key: 'total' },
            { header: 'PAID', key: 'paidAmount' },
            { header: 'PENDING', key: 'pendingAmount' },
            { header: 'DATE', key: 'invoiceDate' },
          ],
          tableData: (data.invoices || []).map(i => ({...i, clientName: i.client?.name || 'N/A'}))
        };
      case 'pipeline':
        return {
          title: 'Inquiry Pipeline Report',
          columns: [
            { header: 'STATUS', key: 'status' },
            { header: 'COUNT', key: 'count' },
          ],
          tableData: Object.entries(data.statusCounts || {}).map(([status, count]) => ({ status, count }))
        };
      case 'inventory':
        return {
          title: 'Inventory Stock Report',
          columns: [
            { header: 'IMPA', key: 'impa' },
            { header: 'ITEM NAME', key: 'itemName' },
            { header: 'CATEGORY', key: 'category' },
            { header: 'TOTAL QTY', key: 'totalQty' },
            { header: 'MIN LEVEL', key: 'minimumStockLevel' },
            { header: 'STATUS', key: 'status' },
          ],
          tableData: toArray(data)
        };
      default: return { title: 'Report', columns: [], tableData: [] };
    }
  };

  const renderSummaryCards = () => {
    if (!data) return null;
    
    if (activeTab === 'profit' && data.summary) {
      const revenue = parseFloat(data.summary.totalRevenue) || 0;
      const cost = parseFloat(data.summary.totalCost) || 0;
      const profit = parseFloat(data.summary.totalProfit) || 0;
      const margin = parseFloat(data.summary.averageMargin) || 0;

      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#1D70B8] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white leading-none">
              ₹{(revenue).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
              Total Revenue
            </p>
          </div>
          
          {/* Total Cost */}
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#C87E23] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white leading-none">
              ₹{(cost).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
              Total Cost
            </p>
          </div>
          
          {/* Net Profit */}
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#0E5A44] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white leading-none">
              ₹{(profit).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
              Net Profit
            </p>
          </div>
          
          {/* Avg Margin */}
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#C87E23] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white leading-none">
              {margin.toFixed(1)}%
            </p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">
              Avg Margin
            </p>
          </div>
        </div>
      );
    }
    
    if (activeTab === 'invoices' && data.summary) {
      const billed = parseFloat(data.summary.totalBilled) || 0;
      const paid = parseFloat(data.summary.totalPaid) || 0;
      const pending = parseFloat(data.summary.totalPending) || 0;

      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#1D70B8] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white">₹{billed.toLocaleString('en-IN')}</p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">Total Billed</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#0E5A44] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white">₹{paid.toLocaleString('en-IN')}</p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">Total Paid</p>
          </div>
          <div className="bg-white dark:bg-[#1a1d23] p-5 rounded-2xl border border-stone-200/60 dark:border-stone-800 border-t-[3px] border-t-[#C87E23] shadow-sm flex flex-col justify-between min-h-[105px]">
            <p className="text-2xl font-bold text-stone-900 dark:text-white">₹{pending.toLocaleString('en-IN')}</p>
            <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mt-2">Total Pending (AR)</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTable = () => {
    if (loading) return <div className="p-8 text-center"><PageLoader /></div>;
    if (!data) return <div className="p-8 text-center text-stone-500">No data available for this report.</div>;

    const { columns, tableData } = getExportConfig();

    const mappedColumns = columns.map(col => {
      let renderCell = undefined;

      if (['revenue', 'cost', 'profit', 'total', 'paidAmount', 'pendingAmount', 'amount'].includes(col.key)) {
        renderCell = (row) => {
          const val = row[col.key];
          return typeof val === 'number' ? `₹${val.toLocaleString('en-IN')}` : val;
        };
      } else if (col.key === 'marginPercentage') {
        renderCell = (row) => {
          const val = row[col.key];
          return typeof val === 'number' ? `${val.toFixed(1)}%` : val;
        };
      } else if (col.key === 'inquiryNumber') {
        renderCell = (row) => (
          <span className="text-[#0A5C43] dark:text-emerald-400 font-semibold cursor-pointer hover:underline">
            {row.inquiryNumber}
          </span>
        );
      }

      return {
        key: col.key,
        label: col.header,
        renderCell
      };
    });

    return (
      <div className="overflow-x-auto">
        <DataTable
          columns={mappedColumns}
          data={tableData}
          emptyMessage="No records found."
        />
      </div>
    );
  };

  return (
    <PageContainer
      title="Reports"
      subtitle="Generate and export business reports."
      className="overflow-y-auto"
    >

      {/* Tabs Row */}
      <div className="flex border-b border-stone-200/80 dark:border-stone-850 items-center justify-between mb-6">
        <div className="flex gap-6 overflow-x-auto custom-scrollbar">
          {REPORT_TYPES.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap pb-2 text-sm font-medium transition-all relative ${
                activeTab === tab.id
                  ? 'text-[#0A5C43] dark:text-emerald-400 font-semibold'
                  : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0A5C43] dark:bg-emerald-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Left: Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {['profit', 'invoices'].includes(activeTab) && (
            <>
              {/* Start Date */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({...prev, startDate: e.target.value}))}
                  className="appearance-none bg-white dark:bg-[#1a1d23] border border-stone-250 dark:border-stone-700 text-stone-750 dark:text-stone-300 px-3 py-1.5 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] transition-colors cursor-pointer select-none font-medium shadow-sm"
                />
                <div className="absolute right-2.5 pointer-events-none text-stone-400">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M7 10l3-3 3 3H7zm0 2h6l-3 3-3-3z" />
                  </svg>
                </div>
              </div>

              {/* End Date */}
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({...prev, endDate: e.target.value}))}
                  className="appearance-none bg-white dark:bg-[#1a1d23] border border-stone-250 dark:border-stone-700 text-stone-750 dark:text-stone-300 px-3 py-1.5 pr-8 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#0A5C43] focus:border-[#0A5C43] transition-colors cursor-pointer select-none font-medium shadow-sm"
                />
                <div className="absolute right-2.5 pointer-events-none text-stone-400">
                  <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                    <path d="M7 10l3-3 3 3H7zm0 2h6l-3 3-3-3z" />
                  </svg>
                </div>
              </div>

              {/* Apply Filters */}
              <button
                onClick={loadReport}
                className="px-4 py-1.5 bg-white hover:bg-stone-50 dark:bg-[#1a1d23] dark:hover:bg-stone-800 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-750 font-medium rounded-lg text-sm transition-all shadow-sm"
              >
                Apply filters
              </button>
              
              {(dateRange.startDate || dateRange.endDate) && (
                <button
                  onClick={() => {
                    setDateRange({ startDate: '', endDate: '' });
                    setTimeout(loadReport, 100);
                  }}
                  className="text-xs text-stone-500 hover:text-[#0A5C43] dark:text-stone-400 dark:hover:text-emerald-400 font-semibold transition-colors"
                >
                  Clear
                </button>
              )}
            </>
          )}
        </div>

        {/* Right: Exports */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleExportPDF}
            className="px-4 py-1.5 bg-white hover:bg-stone-50 dark:bg-[#1a1d23] dark:hover:bg-stone-800 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-750 font-medium rounded-lg text-sm transition-all shadow-sm"
          >
            Export PDF
          </button>
          <button
            onClick={handleExportExcel}
            className="px-4 py-1.5 bg-white hover:bg-stone-50 dark:bg-[#1a1d23] dark:hover:bg-stone-800 text-stone-850 dark:text-stone-200 border border-stone-250 dark:border-stone-750 font-medium rounded-lg text-sm transition-all shadow-sm"
          >
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6">
        {renderSummaryCards()}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-[#181a20] rounded-2xl shadow-sm border border-stone-200/70 dark:border-stone-850 overflow-hidden p-6">
        {renderTable()}
      </div>
    </PageContainer>
  );
}
