import { TOAST_MESSAGES } from '../../../constants/toastMessages';
import React, { useState, useMemo } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, ExcelImportModal } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useAuth } from '@context';
import { useTablePageSize } from '@hooks/useTablePageSize';
import { useProducts } from '@hooks/queries';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, Field, inputCls, EyeIcon, EditIcon, TrashIcon, HeaderButton } from './shared';
import * as XLSX from 'xlsx';
import { useToast } from '@hooks/useToast';
import Button from '@components/ui/button';

export default function ProductsTab() {
  const { data: productsData, refetch: refreshAll, isLoading } = useProducts();
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
      (p.impa && p.impa.toLowerCase().includes(q)) ||
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
        impa: formData.impa || `IMPA-${Date.now().toString().slice(-4)}`,
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
        IMPA: prod.impa || "",
        Category: prod.category || "",
        Unit: prod.unit || "pcs",
        "Selling Price": prod.sellingPrice || 0,
        "Purchase Price": prod.purchasePrice || 0
      }));
    } else {
      dataToExport = [{
        ID: "",
        Name: "Industrial Valve",
        IMPA: "VLV-1001",
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

    for (const rawRow of jsonData) {
      const row = Object.keys(rawRow).reduce((acc, key) => {
        acc[key.trim()] = rawRow[key];
        return acc;
      }, {});

      if (!row.Name) {
        failCount++;
        continue;
      }

      const rawId = parseInt(row.ID || row.id);
      validProducts.push({
        id: rawId > 0 ? rawId : undefined,
        name: row.Name,
        impa: row.IMPA || `IMPA-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
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
    <div className="bg-white dark:bg-[#1a1d23] shadow-sm animate-fade-in flex-1 flex flex-col">
      <RightDrawer isOpen={!!viewItem} title="Product Details" onClose={() => setViewItem(null)}>
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
      </RightDrawer>

      <RightDrawer isOpen={isFormOpen} title={editItem ? 'Edit Product' : 'Add New Product'} onClose={() => { setIsFormOpen(false); setEditItem(null); }}>
        <ProductForm initialData={editItem} onSave={handleSave} onClose={() => { setIsFormOpen(false); setEditItem(null); }} />
      </RightDrawer>

      <div className="pb-4 border-b border-[#eee8dd] dark:border-[#2a2d33] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

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
            className="w-full sm:w-64 bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-xl h-10 px-3.5 text-sm text-[#1e293b] dark:text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#0d6e6e] transition-colors shadow-sm"
          />
        </div>

        {/* Right Side - Buttons */}
        <div className="flex flex-wrap items-center gap-3 justify-start sm:justify-end">
          <HeaderButton onClick={handleDownloadSample}>
            Download sample
          </HeaderButton>

          {canCreate && (
            <>
              <HeaderButton onClick={() => setIsImportModalOpen(true)}>
                Import
              </HeaderButton>

              <Button
                variant="primary"
                onClick={() => setIsFormOpen(true)}
              >
                + Add product
              </Button>
            </>
          )}
        </div>

      </div>

      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImport}
        expectedColumns={['ID', 'Name', 'IMPA', 'Category', 'Unit', 'Selling Price', 'Purchase Price']}
      />

      <DataTable
        maxHeight="max-h-none"
        columns={[
          { key: "srno", label: "#" },
          { key: "name", label: "NAME" },
          { key: "category", label: "CATEGORY" },
          { key: "impa", label: "IMPA" },
          { key: "sellingPrice", label: "SELLING PRICE" },
          { key: "purchasePrice", label: "PURCHASE PRICE" },
          { key: "actions", label: "ACTIONS", className: "text-right" },
        ]}
        data={currentItems}
        isLoading={isLoading}
        emptyMessage="No products found."
        renderRow={(prod, i) => (
          <tr key={prod.id} className={`${rowStripeClass(i, prod)} ${ROW_HOVER_CLS}`}>
            <td className="px-5 py-3.5 font-medium text-gray-500 dark:text-gray-400">{(currentPage - 1) * itemsPerPage + i + 1}</td>
            <td className="px-5 py-3.5 font-bold text-[#1e293b] dark:text-white">{prod.name}</td>
            <td className="px-5 py-3.5 font-medium text-[#1e293b] dark:text-gray-200">
              {prod.category || 'Uncategorized'}
            </td>
            <td className="px-5 py-3.5 font-mono text-[#0f6460] dark:text-teal-400 font-medium cursor-pointer hover:underline" onClick={() => setViewItem(prod)}>{prod.impa || `SKU-${prod.id}`}</td>
            <td className="px-5 py-3.5 font-medium text-[#1e293b] dark:text-gray-200">₹{parseFloat(prod.sellingPrice || 0).toFixed(2)}</td>
            <td className="px-5 py-3.5 font-medium text-[#1e293b] dark:text-gray-200">₹{parseFloat(prod.purchasePrice || 0).toFixed(2)}</td>
            <td className="px-5 py-3.5 text-right space-x-3">
              <button onClick={() => setViewItem(prod)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" title="View">
                <EyeIcon />
              </button>
              {canUpdate && (
                <button onClick={() => { setEditItem(prod); setIsFormOpen(true); }} className="text-blue-500 hover:text-blue-600 transition-colors" title="Edit">
                  <EditIcon />
                </button>
              )}
              {canDelete && (
                <button onClick={() => handleDelete(prod.id)} className="text-red-500 hover:text-red-600 transition-colors" title="Delete">
                  <TrashIcon />
                </button>
              )}
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
  const [formData, setFormData] = useState(initialData || { name: '', category: '', impa: '', sellingPrice: '', purchasePrice: '', unit: 'pcs' });

  React.useEffect(() => {
    setFormData(initialData || { name: '', category: '', impa: '', sellingPrice: '', purchasePrice: '', unit: 'pcs' });
  }, [initialData]);

  const set = (key) => (e) => setFormData(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4 content-start">
        <Field label="Name"><input type="text" className={inputCls} value={formData.name} onChange={set('name')} placeholder="e.g. Industrial Widget A" /></Field>
        <Field label="Category"><input type="text" className={inputCls} value={formData.category} onChange={set('category')} placeholder="e.g. Mechanical" /></Field>
        <Field label="IMPA"><input type="text" className={inputCls} value={formData.impa} onChange={set('impa')} placeholder="e.g. IND-WDG-01" /></Field>
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
