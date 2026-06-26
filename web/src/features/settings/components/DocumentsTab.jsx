import React, { useState, useMemo } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useAuth } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, EyeIcon, TrashIcon } from './shared';
import { DocumentsTabSchema1 } from '@config/tableSchemas';
import { usePaginatedFetch } from '@hooks/usePaginatedFetch';

export default function DocumentsTab() {
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);

  const canCreate = hasPermission('documents', 'create');
  const canDelete = hasPermission('documents', 'delete');

  const {
    data: currentItems,
    meta,
    loading,
    handlePageChange,
    handlePageSizeChange,
    refresh
  } = usePaginatedFetch(api.documents.getDocuments, 1, 10, {
    search
  });

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Document?',
      text: 'Are you sure you want to delete this document?',
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      try {
        const res = await api.documents.deleteDocument(id);
        if (res.success) {
          refresh();
        }
      } catch (e) {
        console.error('Failed to delete document:', e);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl shadow-sm animate-fade-in flex-1 overflow-hidden flex flex-col">
      <RightDrawer
        isOpen={!!viewItem}
        title="Document Details"
        onClose={() => setViewItem(null)}
      >
        <ViewDetails item={viewItem} onClose={() => setViewItem(null)} />
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

          {canCreate && (
            <button
              onClick={() => setIsFormOpen(true)}
              className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Document
            </button>
          )}
        </div>

      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={DocumentsTabSchema1}
          data={currentItems}
          emptyMessage="No documents found."
          renderRow={(doc, i) => (
            <tr key={doc.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{((meta.currentPage ? meta.currentPage : 1) - 1) * (meta.pageSize ? meta.pageSize : 10) + i + 1}</td>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">
                {String(doc.id).slice(-8)}
              </td>
              <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                {doc.title}
              </td>
              <td className="px-5 py-3">
                <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  {doc.category}
                </span>
              </td>
              <td className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-gray-500">{doc.entityType}</td>
              <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">{doc.entityName || '-'}</td>
              <td className="px-5 py-3">{doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '-'}</td>
              <td className="px-5 py-3">
                <span
                  className={`px-2 py-1 rounded text-[11px] font-bold ${doc.status === 'Valid'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : doc.status === 'Expiring Soon'
                      ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                      : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                >
                  {doc.status || 'Valid'}
                </span>
              </td>
              <td className="px-5 py-3 text-right space-x-3">
                <button
                  onClick={() => setViewItem(doc)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  title="View"
                >
                  <EyeIcon />
                </button>
                {canDelete && (
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="text-red-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                )}
              </td>
            </tr>
          )}
        />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={meta.currentPage}
          totalPages={meta.totalPages}
          totalItems={meta.totalItems}
          itemsPerPage={meta.pageSize}
          onPrev={() => handlePageChange(meta.currentPage - 1)}
          onNext={() => handlePageChange(meta.currentPage + 1)}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handlePageSizeChange}
          itemLabel="documents"
        />
      </div>
    </div>
  );
}
