import React, { useState, useMemo } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useData } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';

export default function ProductsTab() {
  const { productsData, refreshAll } = useData();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return productsData;
    return productsData.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [productsData, search]);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Product?',
      text: "Are you sure you want to delete this product? This action cannot be undone.",
      confirmButtonText: 'Yes, delete it!'
    });
    if (isConfirmed) {
      try {
        const res = await api.products.deleteProduct(id);
        if (res.success) {
          refreshAll();
        }
      } catch (e) {
        console.error('Failed to delete product:', e);
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      const data = {
        name: formData.name,
        category: formData.category,
        sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        sellingPrice: parseFloat(formData.sellingPrice) || 0,
        purchasePrice: parseFloat(formData.purchasePrice) || 0,
        unit: formData.unit || 'pcs'
      };
      if (editItem) {
        const res = await api.products.updateProduct(editItem.id, data);
        if (res.success) refreshAll();
      } else {
        const res = await api.products.createProduct(data);
        if (res.success) refreshAll();
      }
      setIsFormOpen(false);
      setEditItem(null);
    } catch (e) {
      console.error('Failed to save product:', e);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Product Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Product' : 'Add New Product'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ProductForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Products List</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button onClick={() => setIsFormOpen(true)} className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Product
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={[
            { key: "id", label: "Product ID" },
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "sku", label: "SKU" },
            { key: "sellingPrice", label: "Selling Price" },
            { key: "purchasePrice", label: "Purchase Price" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          data={filteredProducts}
          emptyMessage="No products found."
          renderRow={(prod, i) => (
            <tr key={prod.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{prod.id.slice(-8)}</td>
              <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{prod.name}</td>
              <td className="px-5 py-3">
                <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  {prod.category || 'Uncategorized'}
                </span>
              </td>
              <td className="px-5 py-3 font-mono">{prod.sku}</td>
              <td className="px-5 py-3">₹{parseFloat(prod.sellingPrice || 0).toFixed(2)}</td>
              <td className="px-5 py-3">₹{parseFloat(prod.purchasePrice || 0).toFixed(2)}</td>
              <td className="px-5 py-3 text-right space-x-3">
                <button onClick={() => setViewItem(prod)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View"><EyeIcon /></button>
                <button onClick={() => { setEditItem(prod); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>
                <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}

function ProductForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(initialData || { name: '', category: '', sku: '', sellingPrice: '', purchasePrice: '', unit: 'pcs' });
  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Name"><input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Industrial Widget A" /></Field>
        <Field label="Category"><input type="text" className={inputCls} value={formData.category} onChange={set('category')} placeholder="e.g. Mechanical" /></Field>
        <Field label="SKU"><input type="text" className={inputCls} value={formData.sku} onChange={set('sku')} placeholder="e.g. IND-WDG-01" /></Field>
        <Field label="Unit"><input type="text" className={inputCls} value={formData.unit} onChange={set('unit')} placeholder="e.g. pcs" /></Field>
        <Field label="Selling Price"><input type="number" className={inputCls} value={formData.sellingPrice} onChange={set('sellingPrice')} placeholder="e.g. 1500" /></Field>
        <Field label="Purchase Price"><input type="number" className={inputCls} value={formData.purchasePrice} onChange={set('purchasePrice')} placeholder="e.g. 1000" /></Field>
      </div>
      <div className="mt-8 flex justify-end gap-3">
        <button onClick={onClose} className="px-4 py-2 text-[13px] font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
        <button onClick={() => onSave(formData)} className="px-5 py-2 text-[13px] font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-sm transition-colors">Save Details</button>
      </div>
    </div>
  );
}
