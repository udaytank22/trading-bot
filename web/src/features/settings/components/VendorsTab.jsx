import React, { useState, useMemo } from 'react';
import { Select, DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useData } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';

export default function VendorsTab() {
  const { suppliersData, productsData, refreshAll } = useData();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredVendors = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return suppliersData;
    return suppliersData.filter(v =>
      v.name.toLowerCase().includes(q) ||
      (v.email && v.email.toLowerCase().includes(q)) ||
      (v.company && v.company.toLowerCase().includes(q))
    );
  }, [suppliersData, search]);

  const totalPages = Math.max(1, Math.ceil((filteredVendors?.length || 0) / itemsPerPage));
  const currentItems = useMemo(() => {
    return filteredVendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredVendors, currentPage, itemsPerPage]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Vendor?',
      text: "Are you sure you want to delete this vendor? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      try {
        const res = await api.suppliers.deleteSupplier(id);
        if (res.success) {
          refreshAll();
        }
      } catch (e) {
        console.error('Failed to delete supplier:', e);
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
        categories: formData.categories || [],
        isActive: formData.status === 'Active'
      };
      if (editItem) {
        const res = await api.suppliers.updateSupplier(editItem.id, data);
        if (res.success) refreshAll();
      } else {
        const res = await api.suppliers.createSupplier(data);
        if (res.success) refreshAll();
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save supplier:', e);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Vendor Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer
        isOpen={isFormOpen}
        title={editItem ? 'Edit Vendor' : 'Add New Vendor'}
        onClose={() => {
          setIsFormOpen(false);
          setEditItem(null);
        }}
      >
        <VendorForm
          initialData={editItem}
          onSave={handleSave}
          onClose={() => {
            setIsFormOpen(false);
            setEditItem(null);
          }}
        />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Vendors List</h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button
            onClick={() => setIsFormOpen(true)}
            className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors"
          >
            + Add Vendor
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={[
            { key: "id", label: "Vendor ID" },
            { key: "name", label: "Company Name" },
            { key: "company", label: "Contact / Company" },
            { key: "email", label: "Email" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          data={currentItems}
          emptyMessage="No vendors found."
          renderRow={(vendor, i) => (
            <tr key={vendor.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{vendor.id.slice(-8)}</td>
              <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{vendor.name}</td>
              <td className="px-5 py-3 text-gray-700 dark:text-gray-300">{vendor.company || '-'}</td>
              <td className="px-5 py-3">{vendor.email}</td>
              <td className="px-5 py-3">
                <span className={`px-2 py-1 rounded text-[11px] font-bold ${vendor.isActive
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                  {vendor.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td className="px-5 py-3 text-right space-x-3">
                <button onClick={() => setViewItem(vendor)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                <button onClick={() => { setEditItem(vendor); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                <button onClick={() => handleDelete(vendor.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
              </td>
            </tr>
          )}
        />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredVendors?.length || 0}
          itemsPerPage={itemsPerPage}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPageChange={(p) => setCurrentPage(p)}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          itemLabel="vendors"
        />
      </div>
    </div>
  );
}

function VendorForm({ initialData, onSave, onClose }) {
  const { productsData } = useData();
  const [catSearch, setCatSearch] = useState('');
  const [formData, setFormData] = useState(
    initialData ? {
      ...initialData,
      status: initialData.isActive ? 'Active' : 'Inactive',
      categories: initialData.categories || []
    } : { name: '', company: '', email: '', phone: '', address: '', status: 'Active', categories: [] }
  );

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  const availableCategories = useMemo(() => {
    const cats = (productsData || [])
      .map(p => p.category)
      .filter(Boolean);
    const defaults = ['Mechanical', 'Electrical', 'Chemical', 'Machinery', 'Parts', 'Electronics', 'Consumables', 'General'];
    const merged = [...new Set([...cats, ...defaults])];
    return merged.sort();
  }, [productsData]);

  const filteredCats = useMemo(() => {
    const q = catSearch.toLowerCase().trim();
    if (!q) return availableCategories;
    return availableCategories.filter(cat => cat.toLowerCase().includes(q));
  }, [availableCategories, catSearch]);

  const toggleCategory = (catName) => {
    setFormData(prev => {
      const current = prev.categories || [];
      const updated = current.includes(catName)
        ? current.filter(c => c !== catName)
        : [...current, catName];
      return { ...prev, categories: updated };
    });
  };

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Vendor Company Name">
          <input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Ocean Supplies LLC" />
        </Field>

        <Field label="Contact / Company">
          <input type="text" className={inputCls} value={formData.company} onChange={set('company')} placeholder="e.g. Ahmed Khan" />
        </Field>

        <Field label="Email Address">
          <input type="email" className={inputCls} value={formData.email} onChange={set('email')} placeholder="e.g. vendor@example.com" />
        </Field>

        <Field label="Phone">
          <input type="text" className={inputCls} value={formData.phone} onChange={set('phone')} placeholder="e.g. +91 9988776655" />
        </Field>

        <Field label="Address">
          <input type="text" className={inputCls} value={formData.address} onChange={set('address')} placeholder="e.g. London, UK" />
        </Field>

        <Field label="Status">
          <Select
            variant="settings"
            className={inputCls}
            value={formData.status || (formData.isActive ? 'Active' : 'Inactive')}
            onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
            options={[
              { value: "Active", label: "Active" },
              { value: "Inactive", label: "Inactive" }
            ]}
          />
        </Field>

        <div className="sm:col-span-2 flex flex-col gap-2 mt-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Supplied Categories</label>
          <input 
            type="text" 
            placeholder="Search categories to link..." 
            value={catSearch} 
            onChange={(e) => setCatSearch(e.target.value)} 
            className="w-full bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors mb-2 animate-all"
          />
          <div className="border border-gray-200 dark:border-[#2a2d36] rounded-xl p-3 max-h-48 overflow-y-auto custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50 dark:bg-[#0f1117]/30">
            {filteredCats.map(cat => {
              const isSelected = (formData.categories || []).includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all text-left ${
                    isSelected 
                      ? "bg-purple-600/10 border-purple-500 text-purple-700 dark:text-white"
                      : "bg-white dark:bg-[#1a1d23] border-gray-200 dark:border-[#2a2d36] text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
                >
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "bg-purple-500 border-purple-500" : "border-gray-400 dark:border-gray-600"
                  }`}>
                    {isSelected && (
                      <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-semibold truncate">{cat}</span>
                </button>
              );
            })}
            {filteredCats.length === 0 && (
              <div className="sm:col-span-2 text-center py-4 text-xs text-gray-500 italic">No categories found.</div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
          Cancel
        </button>

        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">
          Save Details
        </button>
      </div>
    </div>
  );
}
