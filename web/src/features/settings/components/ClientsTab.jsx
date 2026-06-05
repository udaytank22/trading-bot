import React, { useState, useMemo } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination, ExcelImportModal } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useData } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';
import * as XLSX from 'xlsx';
import { useToast } from '@hooks/useToast';
import { ClientsTabSchema1 } from '@config/tableSchemas';

export default function ClientsTab() {
  const { clientsData, supplyData, refreshAll } = useData();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { showToast } = useToast();

  const filteredClients = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clientsData;
    return clientsData.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.company && c.company.toLowerCase().includes(q))
    );
  }, [clientsData, search]);

  const totalPages = Math.max(1, Math.ceil((filteredClients?.length || 0) / itemsPerPage));
  const currentItems = useMemo(() => {
    return filteredClients.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Client?',
      text: "Are you sure you want to delete this client? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });
    if (isConfirmed) {
      try {
        const res = await api.clients.deleteClient(id);
        if (res.success) {
          refreshAll();
        }
      } catch (e) {
        console.error('Failed to delete client:', e);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const data = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        company: formData.company || '',
        address: formData.address || '',
        isActive: formData.status === 'Active',
        vessels: formData.vessels || []
      };
      if (editItem) {
        const res = await api.clients.updateClient(editItem.id, data);
        if (res.success) refreshAll();
      } else {
        const res = await api.clients.createClient(data);
        if (res.success) refreshAll();
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save client:', e);
    }
  };

  const handleDownloadSample = () => {
    let dataToExport = [];
    if (clientsData && clientsData.length > 0) {
      dataToExport = clientsData.map(client => ({
        ID: client.id,
        Name: client.name || "",
        Email: client.email || "",
        Phone: client.phone || "",
        Company: client.company || "",
        Address: client.address || "",
        Status: client.isActive ? "Active" : "Inactive",
        Vessels: (client.vessels || []).map(v => v.name).filter(Boolean).join(", "),
        "IMO Numbers": (client.vessels || []).map(v => v.imoNumber || "").join(", ")
      }));
    } else {
      dataToExport = [{
        ID: "",
        Name: "John Doe",
        Email: "john@example.com",
        Phone: "+1234567890",
        Company: "Acme Corp",
        Address: "123 Main St",
        Status: "Active",
        Vessels: "Vessel 1, Vessel 2",
        "IMO Numbers": "IMO1234567, IMO7654321"
      }];
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clients");
    XLSX.writeFile(wb, "Clients_Data.xlsx");
  };

  const handleImport = async (jsonData) => {
    const clientsToImport = [];
    let failCount = 0;
    
    for (const row of jsonData) {
      if (!row.Name || !row.Email) {
        failCount++;
        continue;
      }
      
      const data = {
        id: row.ID || undefined,
        name: row.Name,
        email: row.Email,
        phone: String(row.Phone || ''),
        company: row.Company || '',
        address: row.Address || '',
        isActive: row.Status !== 'Inactive',
        vessels: (() => {
          const names = row.Vessels ? String(row.Vessels).split(',').map(v => v.trim()) : [];
          const imos = row["IMO Numbers"] ? String(row["IMO Numbers"]).split(',').map(v => v.trim()) : [];
          return names.map((name, i) => ({
            name,
            imoNumber: imos[i] || ''
          })).filter(v => v.name);
        })()
      };
      clientsToImport.push(data);
    }
    
    if (clientsToImport.length > 0) {
      try {
        const res = await api.clients.bulkImportClients(clientsToImport);
        if (res.success) {
          refreshAll();
          showToast(`Successfully processed ${res.data?.successCount || clientsToImport.length} rows. ${failCount} failed due to missing fields.`, 'success');
        } else {
          showToast(`Failed to import data.`, 'error');
        }
      } catch (err) {
        console.error(err);
        showToast(`Error importing data.`, 'error');
      }
    } else {
      showToast(`No valid rows to import. ${failCount} failed.`, 'info');
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Client Profile" onClose={() => setViewItem(null)}>
        {viewItem && (
          <ClientDetailsView client={viewItem} supplyData={supplyData || []} onClose={() => setViewItem(null)} />
        )}
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Client' : 'Add New Client'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ClientForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Clients List</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button onClick={handleDownloadSample} className="h-9 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Sample
          </button>
          <button onClick={() => setIsImportModalOpen(true)} className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import
          </button>
          <button onClick={() => setIsFormOpen(true)} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Client
          </button>
        </div>
      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        expectedColumns={['ID', 'Name', 'Email', 'Phone', 'Company', 'Address', 'Status', 'Vessels', 'IMO Numbers']}
      />

      <DataTable
        maxHeight="max-h-none"
        columns={[
            { key: "srno", label: "#" },
            { key: "id", label: "Client ID" },
            { key: "name", label: "Client Name" },
            { key: "company", label: "Company" },
            { key: "email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          data={currentItems}
          emptyMessage="No clients found."
          renderRow={(client, i) => (
            <tr key={client.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{String(client.id).slice(-8)}</td>
              <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{client.name}</td>
              <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{client.company || '-'}</td>
              <td className="px-5 py-3">{client.email}</td>
              <td className="px-5 py-3">
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${client.isActive
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {client.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-5 py-3 text-right space-x-3">
                <button onClick={() => setViewItem(client)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                <button onClick={() => { setEditItem(client); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                <button onClick={() => handleDelete(client.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
              </td>
            </tr>
          )}
        />

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredClients?.length || 0}
          itemsPerPage={itemsPerPage}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPageChange={(p) => setCurrentPage(p)}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          itemLabel="clients"
        />
      </div>
    </div>
  );
}
function ClientForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(initialData || { name: '', company: '', email: '', phone: '', address: '', status: 'Active', vessels: [] });
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const addVessel = () => setFormData(prev => ({ ...prev, vessels: [...(prev.vessels || []), { name: '', imoNumber: '' }] }));
  const updateVessel = (idx, field, val) => {
    const updated = [...(formData.vessels || [])];
    updated[idx][field] = val;
    setFormData(prev => ({ ...prev, vessels: updated }));
  };
  const removeVessel = (idx) => setFormData(prev => ({ ...prev, vessels: (prev.vessels || []).filter((_, i) => i !== idx) }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Client Name"><input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Acme Corp" /></Field>
        <Field label="Company"><input type="text" className={inputCls} value={formData.company} onChange={set('company')} placeholder="e.g. Acme Industries" /></Field>
        <Field label="Email Address"><input type="email" className={inputCls} value={formData.email} onChange={set('email')} placeholder="e.g. contact@acme.com" /></Field>
        <Field label="Phone"><input type="text" className={inputCls} value={formData.phone} onChange={set('phone')} placeholder="e.g. +91 9988776655" /></Field>
        <Field label="Address"><input type="text" className={inputCls} value={formData.address} onChange={set('address')} placeholder="e.g. Mumbai, India" /></Field>
        <Field label="Status">
          <Select variant="settings"
            className={inputCls}
            value={formData.status || (formData.isActive ? 'Active' : 'Inactive')}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" }
            ]}
          />
        </Field>
      </div>
      
      {/* Vessels Section */}
      <div className="flex-1 flex flex-col pt-4 border-t border-gray-200 dark:border-[#2a2d36] mt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">Client Vessels</h4>
          <button type="button" onClick={addVessel} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2d36] dark:hover:bg-[#343844] text-[12px] font-bold rounded-lg transition-colors">
            + Add Vessel
          </button>
        </div>
        
        <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
          {(!formData.vessels || formData.vessels.length === 0) && (
            <div className="text-xs text-gray-500 italic text-center py-4 bg-gray-50 dark:bg-[#1a1d23]/50 rounded-lg border border-dashed border-gray-200 dark:border-[#2a2d36]">
              No vessels added.
            </div>
          )}
          {(formData.vessels || []).map((vessel, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1d23]/50 p-2.5 rounded-xl border border-gray-200 dark:border-[#2a2d36]">
              <div className="flex-1">
                <input type="text" className={`${inputCls} h-9 text-xs`} placeholder="Vessel Name" value={vessel.name} onChange={(e) => updateVessel(idx, 'name', e.target.value)} />
              </div>
              <div className="flex-1">
                <input type="text" className={`${inputCls} h-9 text-xs`} placeholder="IMO Number" value={vessel.imoNumber || ''} onChange={(e) => updateVessel(idx, 'imoNumber', e.target.value)} />
              </div>
              <button type="button" onClick={() => removeVessel(idx)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Remove">
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">Save Details</button>
      </div>
    </div>
  );
}

function ClientDetailsView({ client, supplyData, onClose }) {
  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Filter supply data for this client
  const clientSupplies = useMemo(() => {
    if (!client) return [];
    return supplyData.filter(s => s.clientId === client.id);
  }, [client, supplyData]);

  // Stats
  const confirmedCount = clientSupplies.filter(s => s.status === "ORDER_PLACED" || s.currentStatus === "ORDER_PLACED").length;
  const dispatchedCount = clientSupplies.filter(s => s.status === "DISPATCHED" || s.currentStatus === "DISPATCHED").length;

  const clientOrderRecords = useMemo(() => {
    return clientSupplies.filter(s =>
      s.status === "ORDER_PLACED" || s.currentStatus === "ORDER_PLACED" ||
      s.status === "DISPATCHED" || s.currentStatus === "DISPATCHED"
    );
  }, [clientSupplies]);

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto custom-scrollbar pr-2 pt-1">
      {/* Client Profile Card */}
      <div className="bg-gray-50 dark:bg-[#242830]/30 p-5 rounded-xl border border-gray-150 dark:border-[#2a2d36] space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-base font-extrabold text-gray-900 dark:text-white">{client.name}</h4>
            <span className="text-xs text-gray-400 mt-0.5 block">{client.company || "No Company"}</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${client.isActive
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            {client.isActive ? 'ACTIVE' : 'INACTIVE'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-2">
          <div>
            <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Email</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold break-all">{client.email}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Phone</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">{client.phone || "—"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Address</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold">{client.address || "—"}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-400 block font-bold uppercase tracking-wider text-[9px]">Joined Date</span>
            <span className="text-gray-800 dark:text-gray-200 font-semibold font-mono">
              {client.createdAt ? formatDateTime(client.createdAt) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Orders stats summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-purple-500/5 dark:bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest block">Confirmed Orders</span>
          <span className="text-2xl font-black text-purple-700 dark:text-purple-300 block mt-1">{confirmedCount}</span>
        </div>
        <div className="bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-center">
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Dispatched Orders</span>
          <span className="text-2xl font-black text-blue-700 dark:text-blue-300 block mt-1">{dispatchedCount}</span>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Client Order Records</h4>
        {clientOrderRecords.length > 0 ? (
          <div className="space-y-3">
            {clientOrderRecords.map((ship) => {
              const isDispatched = ship.status === 'DISPATCHED' || ship.currentStatus === 'DISPATCHED';
              const isConfirmed = ship.status === 'ORDER_PLACED' || ship.currentStatus === 'ORDER_PLACED';
              return (
                <div
                  key={ship.id}
                  className="p-4 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d36] rounded-xl flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono font-bold text-xs text-gray-900 dark:text-white">
                      {ship.shipmentNumber || ship.inquiry_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isDispatched
                        ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                        : isConfirmed
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {isConfirmed ? 'Confirmed' : isDispatched ? 'Dispatched' : ship.status || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-semibold">Cargo Description</span>
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-1" title={ship.cargoDetails || ship.cargo}>
                      {ship.cargoDetails || ship.cargo || "General Cargo"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 border-t border-dashed border-gray-150 dark:border-[#2a2d36] pt-2 mt-1 font-semibold">
                    <span>Record Date:</span>
                    <span className="font-mono text-gray-600 dark:text-gray-300">
                      {formatDateTime(ship.createdAt || ship.date)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 italic text-xs border border-dashed border-gray-200 dark:border-[#2a2d36] rounded-xl">
            No confirmed or dispatched orders recorded for this client.
          </div>
        )}
      </div>
    </div>
  );
}
