import React, { useState, useMemo } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useData } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';

export default function ClientsTab() {
  const { clientsData, refreshAll } = useData();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        isActive: formData.status === 'Active'
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

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Client Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
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
          <button onClick={() => setIsFormOpen(true)} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Client
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={[
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
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{client.id.slice(-8)}</td>
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
      </div>

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
  const [formData, setFormData] = useState(initialData || { name: '', company: '', email: '', phone: '', address: '', status: 'Active' });
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

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
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">Save Details</button>
      </div>
    </div>
  );
}
