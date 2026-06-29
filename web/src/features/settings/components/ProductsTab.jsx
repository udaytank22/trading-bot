import { TOAST_MESSAGES } from '../../../constants/toastMessages';
import React, { useState, useMemo } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination, ExcelImportModal } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useAuth } from '@context';
import { useTablePageSize } from '@hooks/useTablePageSize';
import { useProducts } from '@hooks/queries';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon } from './shared';
import * as XLSX from 'xlsx';
import { useToast } from '@hooks/useToast';

export default function ProductsTab() {
  const { data: productsData, refetch: refreshAll } = useProducts();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useTablePageSize(50);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { showToast } = useToast();

  const canCreate = hasPermission('products', 'create');
  const canUpdate = hasPermission('products', 'update');
  const canDelete = hasPermission('products', 'delete');

  const filteredProducts = useMemo(() => {
    const list = productsData || [];
    const q = search.toLowerCase().trim();
    if (!q) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [productsData, search]);

  const totalPages = Math.max(1, Math.ceil((filteredProducts?.length || 0) / itemsPerPage));
  const currentItems = useMemo(() => {
    return (filteredProducts || []).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);


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
      showToast(editItem ? TOAST_MESSAGES.SETTINGS.PRODUCTS.UPDATED : TOAST_MESSAGES.SETTINGS.PRODUCTS.ADDED, 'success');
    } catch (e) {
      console.error('Failed to save product:', e);
      showToast(e.response?.data?.message || TOAST_MESSAGES.SETTINGS.PRODUCTS.SAVE_ERROR, 'error');
    }
  };

  const handleDownloadSample = () => {
    let dataToExport = [];
    if (productsData && productsData.length > 0) {
      dataToExport = productsData.map(prod => ({
        ID: prod.id,
        Name: prod.name || "",
        SKU: prod.sku || "",
        Category: prod.category || "",
        Unit: prod.unit || "pcs",
        "Selling Price": prod.sellingPrice || 0,
        "Purchase Price": prod.purchasePrice || 0
      }));
    } else {
      dataToExport = [{
        ID: "",
        Name: "Industrial Valve",
        SKU: "VLV-1001",
        Category: "Mechanical",
        Unit: "pcs",
        "Selling Price": 1500.00,
        "Purchase Price": 1200.00
      }];
    }
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");
    XLSX.writeFile(wb, "Products_Data.xlsx");
  };

  const handleImport = async (jsonData) => {
    let failCount = 0;
    const validProducts = [];

    for (const row of jsonData) {
      if (!row.Name) {
        failCount++;
        continue;
      }

      validProducts.push({
        id: row.ID || undefined,
        name: row.Name,
        sku: row.SKU || `SKU-${Date.now().toString().slice(-4)}`,
        category: row.Category || 'General',
        unit: row.Unit || 'pcs',
        sellingPrice: parseFloat(row["Selling Price"]) || 0,
        purchasePrice: parseFloat(row["Purchase Price"]) || 0,
        minStock: 0
      });
    }

    let successCount = 0;
    try {
      if (validProducts.length > 0) {
        const res = await api.products.bulkUpsert(validProducts);
        if (res.success) {
          successCount = validProducts.length;
        } else {
          failCount += validProducts.length;
        }
      }
    } catch (err) {
      console.error(err);
      failCount += validProducts.length;
    }

    refreshAll();
    showToast(TOAST_MESSAGES.SETTINGS.IMPORT.PARTIAL(successCount, failCount), failCount > 0 ? 'info' : 'success');
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Product Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Product' : 'Add New Product'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ProductForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        {/* Left Side - Search */}
        <div className="w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        {/* Right Side - Buttons */}
        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          <button
            onClick={handleDownloadSample}
            className="h-9 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Sample
          </button>

          {canCreate && (
            <>
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import
              </button>

              <button
                onClick={() => setIsFormOpen(true)}
                className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </>
          )}
        </div>

      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        expectedColumns={['ID', 'Name', 'SKU', 'Category', 'Unit', 'Selling Price', 'Purchase Price']}
      />

      <DataTable
        maxHeight="max-h-none"
        columns={[
          { key: "srno", label: "#" },
          { key: "id", label: "Product ID" },
          { key: "name", label: "Name" },
          { key: "category", label: "Category" },
          { key: "sku", label: "SKU" },
          { key: "sellingPrice", label: "Selling Price" },
          { key: "purchasePrice", label: "Purchase Price" },
          { key: "actions", label: "Actions", className: "text-right" },
        ]}
        data={currentItems}
        emptyMessage="No products found."
        renderRow={(prod, i) => (
          <tr key={prod.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
            <td className="px-5 py-3 font-medium text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
            <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{String(prod.id).slice(-8)}</td>
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
              {canUpdate && <button onClick={() => { setEditItem(prod); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit"><EditIcon /></button>}
              {canDelete && <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete"><TrashIcon /></button>}
            </td>
          </tr>
        )}
        paginationProps={{
          currentPage,
          totalPages,
          totalItems: filteredProducts?.length || 0,
          itemsPerPage,
          onPrev: () => setCurrentPage((p) => Math.max(1, p - 1)),
          onNext: () => setCurrentPage((p) => Math.min(totalPages, p + 1)),
          onPageChange: (p) => setCurrentPage(p),
          onItemsPerPageChange: (val) => { setItemsPerPage(val); setCurrentPage(1); },
          itemLabel: "products"
        }}
      />
    </div>
  );
}

function ProductForm({ initialData, onSave, onClose }) {
  const [formData, setFormData] = useState(initialData || { name: '', category: '', sku: '', sellingPrice: '', purchasePrice: '', unit: 'pcs' });

  React.useEffect(() => {
    setFormData(initialData || { name: '', category: '', sku: '', sellingPrice: '', purchasePrice: '', unit: 'pcs' });
  }, [initialData]);

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
