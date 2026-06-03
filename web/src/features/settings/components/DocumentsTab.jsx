import React, { useState, useMemo } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS, Pagination } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { useData } from '@context';
import { api } from '@services/api';
import { RightDrawer, ViewDetails, EyeIcon, TrashIcon } from './shared';

export default function DocumentsTab() {
  const { documentsData, refreshAll } = useData();
  const [search, setSearch] = useState('');
  const [viewItem, setViewItem] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredDocuments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return documentsData || [];
    return (documentsData || []).filter(doc =>
      (doc.title && doc.title.toLowerCase().includes(q)) ||
      (doc.category && doc.category.toLowerCase().includes(q)) ||
      (doc.entityType && doc.entityType.toLowerCase().includes(q)) ||
      (doc.entityName && doc.entityName.toLowerCase().includes(q))
    );
  }, [documentsData, search]);

  const totalPages = Math.max(1, Math.ceil((filteredDocuments?.length || 0) / itemsPerPage));
  const currentItems = useMemo(() => {
    return filteredDocuments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredDocuments, currentPage, itemsPerPage]);

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
          refreshAll();
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

      <div className="p-2 border-b border-gray-200 dark:border-[#2a2d33] flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Documents List
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full sm:w-64 bg-gray-50 dark:bg-[#0f1117] border border-gray-200 dark:border-[#2a2d36] rounded-lg h-9 px-3 text-[13px] text-gray-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
          />

          <button className="h-9 px-4 bg-purple-600 hover:bg-purple-500 text-white text-[13px] font-bold rounded-lg shadow-sm whitespace-nowrap transition-colors">
            + Add Document
          </button>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <DataTable
          columns={[
            { key: "id", label: "Document ID" },
            { key: "name", label: "Document Name" },
            { key: "category", label: "Category" },
            { key: "type", label: "Entity Type" },
            { key: "entityName", label: "Linked Entity" },
            { key: "uploadedDate", label: "Uploaded Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          data={currentItems}
          emptyMessage="No documents found."
          renderRow={(doc, i) => (
            <tr key={doc.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">
                {doc.id.slice(-8)}
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
                  className={`px-2 py-1 rounded text-[11px] font-bold ${
                    doc.status === 'Valid'
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
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                  title="Delete"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          )}
        />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33]">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredDocuments?.length || 0}
          itemsPerPage={itemsPerPage}
          onPrev={() => setCurrentPage((p) => Math.max(1, p - 1))}
          onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          onPageChange={(p) => setCurrentPage(p)}
          onItemsPerPageChange={(val) => { setItemsPerPage(val); setCurrentPage(1); }}
          itemLabel="documents"
        />
      </div>
    </div>
  );
}
