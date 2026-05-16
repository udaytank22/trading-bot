import React, { useState, useContext, useMemo } from "react";
import { AppContext } from "../context";
import { useToast } from "../hooks/useToast";
import Toast from "../components/ui/Toast";
import AddDocumentModal from "../components/AddDocumentModal";
import { confirmAction } from "../utils/swal";

// Helper for the Kanban Board
const KanbanColumn = ({ title, status, documents, onEdit, onDelete, colorClass }) => (
  <div className="flex-1 bg-[#242830]/40 rounded-2xl border border-[#2a2d33] flex flex-col overflow-hidden min-w-[300px]">
    <div className={`px-5 py-4 border-b border-[#2a2d33] flex items-center justify-between ${colorClass}`}>
      <h3 className="font-bold text-sm tracking-wide uppercase">{title}</h3>
      <span className="bg-black/20 px-2.5 py-0.5 rounded-full text-xs font-bold">{documents.length}</span>
    </div>
    <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
      {documents.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm py-10 opacity-50">
          <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          No documents
        </div>
      ) : (
        documents.map(doc => (
          <div key={doc.id} className="bg-[#1a1d23] p-4 rounded-xl border border-[#2a2d33] hover:border-purple-500/50 transition-colors group relative shadow-md">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded">
                {doc.category}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(doc)} className="text-gray-400 hover:text-blue-400 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button onClick={() => onDelete(doc.id)} className="text-gray-400 hover:text-red-400 p-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
            <h4 className="text-white font-bold text-sm mb-1 line-clamp-1" title={doc.title}>{doc.title}</h4>
            <p className="text-gray-400 text-xs mb-3 truncate">{doc.entityName}</p>
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-[#2a2d33] pt-3">
              <span>Exp: {new Date(doc.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="flex items-center gap-1 hover:text-purple-400 cursor-pointer transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                View
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

export default function DocumentsPage() {
  const { documentsData, setDocumentsData } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState("Employee");
  const [search, setSearch] = useState("");
  const { toast, showToast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentToEdit, setDocumentToEdit] = useState(null);

  const TABS = ["Employee", "Vehicle", "Company"];
  
  const filteredDocs = useMemo(() => {
    return documentsData.filter(doc => {
      const q = search.toLowerCase();
      return (
        doc.entityType === activeTab &&
        (doc.title.toLowerCase().includes(q) || doc.entityName.toLowerCase().includes(q))
      );
    });
  }, [documentsData, activeTab, search]);

  const validDocs = filteredDocs.filter(d => d.status === "Valid");
  const expiringDocs = filteredDocs.filter(d => d.status === "Expiring Soon");
  const expiredDocs = filteredDocs.filter(d => d.status === "Expired");

  const handleDelete = async (id) => {
    const isConfirmed = await confirmAction({
      title: 'Delete Document?',
      text: "Are you sure you want to delete this document?",
      confirmButtonText: 'Yes, delete it!'
    });

    if (isConfirmed) {
      setDocumentsData(prev => prev.filter(doc => doc.id !== id));
      showToast("Document deleted successfully", "success");
    }
  };

  const handleEdit = (doc) => {
    setDocumentToEdit(doc);
    setIsModalOpen(true);
  };

  const handleSaveDocument = (docData) => {
    if (documentToEdit) {
      setDocumentsData(prev => prev.map(d => d.id === documentToEdit.id ? { ...docData, id: documentToEdit.id } : d));
      showToast("Document updated successfully", "success");
    } else {
      setDocumentsData(prev => [{ ...docData, id: `DOC-${Date.now()}`, uploadedAt: new Date().toISOString() }, ...prev]);
      showToast("Document added successfully", "success");
    }
  };

  return (
    <div className="flex flex-col w-full h-full pb-4 relative gap-4">
      <Toast message={toast.message} type={toast.type} />

      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center bg-[#1a1d23] border border-[#2a2d33] p-1 rounded-xl w-fit">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab 
                  ? "bg-purple-600 text-white shadow-md" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab === "Company" ? "Companies" : `${tab}s`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-[260px]">
            <svg className="absolute left-3 top-2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            <input
              type="text"
              placeholder={`Search ${activeTab.toLowerCase()} documents...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-8 pl-9 pr-3 text-xs text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors shadow-sm"
            />
          </div>

          <button
            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors shadow-sm active:scale-95 flex items-center gap-1.5 font-bold text-xs whitespace-nowrap"
            onClick={() => {
              setDocumentToEdit(null);
              setIsModalOpen(true);
            }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Document
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto pb-2">
        <KanbanColumn 
          title="Valid" 
          status="Valid" 
          documents={validDocs} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          colorClass="text-emerald-500 bg-emerald-500/5 border-emerald-500/20"
        />
        <KanbanColumn 
          title="Expiring Soon" 
          status="Expiring Soon" 
          documents={expiringDocs} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          colorClass="text-amber-500 bg-amber-500/5 border-amber-500/20"
        />
        <KanbanColumn 
          title="Expired" 
          status="Expired" 
          documents={expiredDocs} 
          onEdit={handleEdit} 
          onDelete={handleDelete}
          colorClass="text-red-500 bg-red-500/5 border-red-500/20"
        />
      </div>

      <AddDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveDocument}
        documentToEdit={documentToEdit}
        initialTab={activeTab}
      />
    </div>
  );
}
