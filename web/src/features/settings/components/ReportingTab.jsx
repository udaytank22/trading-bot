import { ReportingTabSchema1, ReportingTabSchema2 } from '@config/tableSchemas';
import React, { useState } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, DatePicker } from '@components/ui';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Field, inputCls, CenterModal } from './shared';

export default function ReportingTab() {
  const [clientFilter, setClientFilter] = useState('All');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [activeSubTab, setActiveSubTab] = useState('clients');
  const [detailTarget, setDetailTarget] = useState(null);

  const pipelineData = [
    {
      id: 'INQ-1001',
      client: 'Acme Corp',
      employee: 'John Doe',
      received: '24/01/2026 09:00 AM',
      rfqSent: '24/01/2026 10:00 AM',
      supplierResponse: '25/01/2026 01:30 PM',
      quotationSent: '25/01/2026 02:00 PM',
      clientResponse: '25/01/2026 10:00 PM',
      poReceived: '26/01/2026 09:15 AM',
      status: 'Approved'
    },
    {
      id: 'INQ-1002',
      client: 'Global Logistics Ltd',
      employee: 'Sarah Connor',
      received: '26/01/2026 11:30 AM',
      rfqSent: '26/01/2026 01:15 PM',
      supplierResponse: '27/01/2026 08:30 AM',
      quotationSent: '27/01/2026 09:45 AM',
      clientResponse: '28/01/2026 04:20 PM',
      poReceived: '-',
      status: 'Pending'
    },
    {
      id: 'INQ-1003',
      client: 'Umbrella Corporation',
      employee: 'John Doe',
      received: '27/01/2026 08:00 AM',
      rfqSent: '27/01/2026 09:30 AM',
      supplierResponse: '28/01/2026 10:00 AM',
      quotationSent: '28/01/2026 11:00 AM',
      clientResponse: '29/01/2026 01:00 PM',
      poReceived: '-',
      status: 'Rejected'
    },
    {
      id: 'INQ-1004',
      client: 'Acme Corp',
      employee: 'Sarah Connor',
      received: '29/01/2026 10:15 AM',
      rfqSent: '29/01/2026 12:00 PM',
      supplierResponse: '30/01/2026 09:30 AM',
      quotationSent: '30/01/2026 11:00 AM',
      clientResponse: '30/01/2026 04:30 PM',
      poReceived: '31/01/2026 09:00 AM',
      status: 'Approved'
    },
    {
      id: 'INQ-1005',
      client: 'Acme Corp',
      employee: 'John Doe',
      received: '30/01/2026 02:45 PM',
      rfqSent: '30/01/2026 03:30 PM',
      supplierResponse: '31/01/2026 09:00 AM',
      quotationSent: '31/01/2026 10:15 AM',
      clientResponse: '31/01/2026 02:00 PM',
      poReceived: '-',
      status: 'Rejected'
    },
    {
      id: 'INQ-1006',
      client: 'Global Logistics Ltd',
      employee: 'John Doe',
      received: '31/01/2026 09:20 AM',
      rfqSent: '31/01/2026 10:10 AM',
      supplierResponse: '01/02/2026 08:45 AM',
      quotationSent: '01/02/2026 09:50 AM',
      clientResponse: '01/02/2026 05:20 PM',
      poReceived: '02/02/2026 10:10 AM',
      status: 'Approved'
    }
  ];

  const parseReceivedDate = (value) => {
    if (!value) return null;
    const [datePart, timePart, ampm] = value.split(' ');
    if (!datePart || !timePart) return null;
    const [day, month, year] = datePart.split('/');
    const [hours, minutes] = timePart.split(':');
    let hour = Number(hours);
    const minute = Number(minutes);
    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;
    return new Date(Number(year), Number(month) - 1, Number(day), hour, minute);
  };

  const inDateRange = (item) => {
    const itemDate = parseReceivedDate(item.received);
    if (!itemDate) return true;
    if (dateRange.start) {
      const start = new Date(`${dateRange.start}T00:00:00`);
      if (itemDate < start) return false;
    }
    if (dateRange.end) {
      const end = new Date(`${dateRange.end}T23:59:59`);
      if (itemDate > end) return false;
    }
    return true;
  };

  const filteredData = pipelineData.filter(d =>
    (clientFilter === 'All' || d.client === clientFilter) &&
    (employeeFilter === 'All' || d.employee === employeeFilter) &&
    inDateRange(d)
  );

  const summaryData = Object.values(
    filteredData.reduce((acc, item) => {
      const key = activeSubTab === 'clients' ? item.client : item.employee;
      if (!acc[key]) acc[key] = { key, completed: 0, failed: 0, total: 0 };
      acc[key].total += 1;
      if (item.status === 'Approved') acc[key].completed += 1;
      if (item.status === 'Rejected') acc[key].failed += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const detailHistory = detailTarget
    ? filteredData.filter(item =>
      detailTarget.type === 'clients'
        ? item.client === detailTarget.key
        : item.employee === detailTarget.key
    )
    : [];

  const entityLabel = activeSubTab === 'clients' ? 'Client' : 'Employee';

  const handleDownloadPDF = () => {
    if (filteredData.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF('landscape');
    doc.setFontSize(18);
    doc.text('Detailed Pipeline Timeline Report', 14, 22);

    doc.setFontSize(11);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Filters: Client = ${clientFilter} | Employee = ${employeeFilter}`, 14, 36);

    autoTable(doc, {
      startY: 42,
      head: [['ID', 'Client Name', 'Employee', 'Inquiry Received', 'RFQ Sent', 'Supplier Resp.', 'Quotation Sent', 'Client Resp.', 'Status']],
      body: filteredData.map(d => [
        d.id,
        d.client,
        d.employee,
        d.received,
        d.rfqSent,
        d.supplierResponse,
        d.quotationSent,
        d.clientResponse,
        d.status
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246], fontSize: 9 },
      bodyStyles: { fontSize: 8 }
    });

    doc.save(`Pipeline_Timeline_Report_${Date.now()}.pdf`);
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">Reporting Overview</h2>
          <button
            type="button"
            onClick={() => setActiveSubTab('clients')}
            className={`px-4 py-2 rounded-lg font-bold text-[13px] ${activeSubTab === 'clients' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#16191f] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d33]'}`}
          >
            Clients
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('employees')}
            className={`px-4 py-2 rounded-lg font-bold text-[13px] ${activeSubTab === 'employees' ? 'bg-purple-600 text-white' : 'bg-white dark:bg-[#16191f] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2a2d33]'}`}
          >
            Employees
          </button>
        </div>
        <button onClick={handleDownloadPDF} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Download PDF
        </button>
      </div>

      <div className="p-5 border-b border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0f1117]/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Field label="Filter by Client">
            <Select
              variant="settings"
              className={inputCls}
              value={clientFilter}
              onChange={(val) => setClientFilter(val)}
              options={[
                { value: 'All', label: 'All Clients' },
                { value: 'Acme Corp', label: 'Acme Corp' },
                { value: 'Global Logistics Ltd', label: 'Global Logistics Ltd' },
                { value: 'Umbrella Corporation', label: 'Umbrella Corporation' }
              ]}
            />
          </Field>
          <Field label="Filter by Employee">
            <Select
              variant="settings"
              className={inputCls}
              value={employeeFilter}
              onChange={(val) => setEmployeeFilter(val)}
              options={[
                { value: 'All', label: 'All Employees' },
                { value: 'John Doe', label: 'John Doe' },
                { value: 'Sarah Connor', label: 'Sarah Connor' }
              ]}
            />
          </Field>
          <Field label="Start Date (Inquiry Received)">
            <DatePicker
              name="start"
              className={inputCls}
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            />
          </Field>
          <Field label="End Date">
            <DatePicker
              name="end"
              className={inputCls}
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            />
          </Field>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={ReportingTabSchema1(entityLabel)}
          data={summaryData}
          emptyMessage="No data found for the selected filters."
          renderRow={(item, i) => (
            <tr key={item.key} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{item.key}</td>
              <td className="px-4 py-3">{item.completed}</td>
              <td className="px-4 py-3">{item.failed}</td>
              <td className="px-4 py-3">{item.total}</td>
              <td className="px-4 py-3">
                <button
                  onClick={() => setDetailTarget({ type: activeSubTab, key: item.key })}
                  className="text-purple-600 dark:text-purple-300 font-semibold hover:underline"
                >
                  View history
                </button>
              </td>
            </tr>
          )}
        />
      </div>

      <CenterModal
        isOpen={!!detailTarget}
        title={detailTarget ? `${detailTarget.key} History` : 'History'}
        onClose={() => setDetailTarget(null)}
      >
        {detailTarget && (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">{detailTarget.key} inquiry history</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Showing all inquiries for this {detailTarget.type === 'clients' ? 'client' : 'employee'}.</p>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {detailHistory.length} record{detailHistory.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="overflow-x-auto flex-1 custom-scrollbar">
              <DataTable
                columns={ReportingTabSchema2}
                data={detailHistory}
                emptyMessage="No history records."
                renderRow={(item, i) => (
                  <tr key={item.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + i + 1}</td>
                        <td className="px-4 py-3 font-medium text-purple-600 dark:text-purple-400">{item.id}</td>
                    <td className="px-4 py-3">{item.client}</td>
                    <td className="px-4 py-3">{item.employee}</td>
                    <td className="px-4 py-3">{item.received}</td>
                    <td className="px-4 py-3">{item.rfqSent}</td>
                    <td className="px-4 py-3">{item.supplierResponse}</td>
                    <td className="px-4 py-3">{item.quotationSent}</td>
                    <td className="px-4 py-3">{item.clientResponse}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${item.status === 'Approved' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        item.status === 'Pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                          'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                )}
              />
            </div>
          </div>
        )}
      </CenterModal>
    </div>
  );
}
