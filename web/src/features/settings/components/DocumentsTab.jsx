import React, { useState } from 'react';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';
import { confirmAction } from '@utils/swal';
import { RightDrawer, ViewDetails, EyeIcon, EditIcon, TrashIcon } from './shared';

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([
    {
      id: 'DOC-001',
      name: 'Invoice.pdf',
      category: 'Invoice',
      type: 'PDF',
      uploadedBy: 'Admin',
      uploadedDate: '23/05/2026',
      status: 'Active'
    },
    {
      id: 'DOC-002',
      name: 'Quotation.xlsx',
      category: 'Quotation',
      type: 'Excel',
      uploadedBy: 'John Doe',
      uploadedDate: '22/05/2026',
      status: 'Active'
    },
    {
      id: 'DOC-003',
      name: 'Purchase Order.docx',
      category: 'PO',
      type: 'Word',
      uploadedBy: 'Sarah Connor',
      uploadedDate: '21/05/2026',
      status: 'Inactive'
    }
  ]);

  const [viewItem, setViewItem] = useState(null);

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Document?',
      text: 'Are you sure you want to delete this document?',
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      setDocuments(documents.filter(doc => doc.id !== id));
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
            { key: "type", label: "Type" },
            { key: "uploadedBy", label: "Uploaded By" },
            { key: "uploadedDate", label: "Uploaded Date" },
            { key: "status", label: "Status" },
            { key: "actions", label: "Actions", className: "text-right" },
          ]}
          data={documents}
          emptyMessage="No documents found."
          renderRow={(doc, i) => (
            <tr key={doc.id} className={`${rowStripeClass(i)} ${ROW_HOVER_CLS}`}>
              <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400">
                {doc.id}
              </td>
              <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">
                {doc.name}
              </td>
              <td className="px-5 py-3">
                <span className="px-2 py-1 bg-gray-100 dark:bg-[#2a2d36] rounded text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  {doc.category}
                </span>
              </td>
              <td className="px-5 py-3">{doc.type}</td>
              <td className="px-5 py-3">{doc.uploadedBy}</td>
              <td className="px-5 py-3">{doc.uploadedDate}</td>
              <td className="px-5 py-3">
                <span
                  className={`px-2 py-1 rounded text-[11px] font-bold ${doc.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                >
                  {doc.status}
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
                  className="text-blue-500 hover:text-blue-600 transition-colors"
                  title="Edit"
                >
                  <EditIcon />
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
    </div>
  );
}
