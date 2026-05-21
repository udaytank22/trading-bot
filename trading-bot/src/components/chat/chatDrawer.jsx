import React, { useState } from "react";
import { X, FileText, Eye, ChevronLeft } from "lucide-react";
import { useAppContext } from "../../context";

// Local sample PDF served from /public folder
const DUMMY_PDF_URL = "/memories/file-sample_150kB.pdf";

const mockUsers = [
  { id: 1, name: "Alice Cooper", status: "online", lastMsg: "See you at the meeting", avatar: "AC" },
  { id: 2, name: "Bob Martin", status: "offline", lastMsg: "Offer sent", avatar: "BM" },
  { id: 3, name: "Charlie Day", status: "online", lastMsg: "Everything is confirmed", avatar: "CD" },
  { id: 4, name: "Diana Prince", status: "online", lastMsg: "Need the specs", avatar: "DP" },
];

const ChatDrawer = ({ isOpen, onClose }) => {
  const { /* startCall */ } = useAppContext();
  const [selectedUser, setSelectedUser] = useState(null);
  const [pdfViewerUrl, setPdfViewerUrl] = useState(null); // in-app PDF viewer state
  const [messages, setMessages] = useState([
    { sender: "them", type: "text", text: "Hello! How can I help you today?" },
    { sender: "me",   type: "text", text: "I'm looking for the status of CGO-1001" },
    {
      sender: "them",
      type: "doc",
      fileName: "Shipment_Manifest_CGO1001.pdf",
      fileSize: "1.2 MB",
      url: DUMMY_PDF_URL,
    },
    { sender: "me", type: "text", text: "Thanks! Can you also share the invoice?" },
    {
      sender: "them",
      type: "doc",
      fileName: "Invoice_CGO1001_Oct2024.pdf",
      fileSize: "840 KB",
      url: DUMMY_PDF_URL,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  if (!isOpen) return null;

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessages([...messages, { sender: "me", type: "text", text: newMessage }]);
    setNewMessage("");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const newMsg = {
      sender: "me",
      type: isImage ? "image" : "doc",
      fileName: file.name,
      fileSize: (file.size / 1024).toFixed(1) + " KB",
      url: URL.createObjectURL(file),
    };
    setMessages([...messages, newMsg]);
  };

  return (
    <div className="fixed inset-0 z-[200] flex justify-end overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`relative w-full max-w-sm bg-white dark:bg-[#1a1d23] h-full shadow-2xl border-l border-gray-200 dark:border-[#2a2d33] transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        } flex flex-col`}
      >

        {/* ── PDF Viewer Panel (slides over chat) ── */}
        {pdfViewerUrl && (
          <div className="absolute inset-0 z-20 flex flex-col bg-white dark:bg-[#1a1d23]">
            {/* PDF Viewer Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-[#2a2d33] bg-gray-50 dark:bg-[#1a1d23] flex items-center justify-between flex-shrink-0">
              <button
                onClick={() => setPdfViewerUrl(null)}
                className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeft size={18} />
                Back to Chat
              </button>
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                <FileText size={12} />
                PDF Preview
              </div>
            </div>
            {/* Iframe PDF Viewer */}
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfViewerUrl}
                title="PDF Preview"
                className="w-full h-full border-0"
                style={{ minHeight: 0 }}
              />
            </div>
          </div>
        )}

        {/* ── Header ── */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2d33] flex items-center justify-between bg-gray-50 dark:bg-[#1a1d23] sticky top-0 z-10 shadow-sm">
          {selectedUser ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center text-xs font-bold text-purple-400 border border-purple-500/20 shadow-inner">
                    {selectedUser.avatar}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-none mb-1">
                      {selectedUser.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={onClose}
                  className="p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Direct Messages
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </>
          )}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1a1d23]">
          {selectedUser ? (
            /* ── Chat messages ── */
            <div className="p-4 space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}
                >
                  {/* Incoming avatar dot */}
                  {msg.sender === "them" && (
                    <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center text-[9px] font-bold text-purple-400 border border-purple-500/20 mr-2 flex-shrink-0 self-end mb-0.5">
                      {selectedUser.avatar}
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl text-sm ${
                      msg.sender === "me"
                        ? "bg-purple-600 text-white rounded-tr-none"
                        : "bg-gray-100 dark:bg-[#2a2d33] text-gray-800 dark:text-gray-200 rounded-tl-none"
                    } ${
                      msg.type === "text"
                        ? "px-4 py-2.5"
                        : "overflow-hidden border border-gray-200 dark:border-[#3a3d43]"
                    }`}
                  >
                    {/* Text message */}
                    {msg.type === "text" && msg.text}

                    {/* Image message */}
                    {msg.type === "image" && (
                      <div className="p-1 bg-gray-50 dark:bg-[#1a1d23]">
                        <img
                          src={msg.url}
                          alt="Shared"
                          className="w-full h-auto rounded-xl object-cover max-h-[200px]"
                        />
                        <div className="px-2 py-1.5 flex justify-between items-center">
                          <span className="text-[10px] text-gray-400 truncate">{msg.fileName}</span>
                          <span className="text-[10px] text-gray-500">{msg.fileSize}</span>
                        </div>
                      </div>
                    )}

                    {/* PDF / Doc message */}
                    {msg.type === "doc" && (
                      <div className="p-3 flex items-center gap-3 bg-gray-50 dark:bg-[#1a1d23]/60">
                        {/* File icon */}
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0 border border-red-500/20">
                          <FileText size={20} className="text-red-500" />
                        </div>
                        {/* File info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {msg.fileName || "document.pdf"}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{msg.fileSize || "—"}</p>
                        </div>
                        {/* View button — opens in-app PDF viewer */}
                        <button
                          onClick={() => setPdfViewerUrl(msg.url || DUMMY_PDF_URL)}
                          title="View PDF"
                          className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-500 transition-all active:scale-90 flex-shrink-0"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Contacts list ── */
            <div className="divide-y divide-gray-100 dark:divide-[#2a2d33]">
              {mockUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#2a2d33] flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#3a3d43]">
                      {user.avatar}
                    </div>
                    {user.status === "online" && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#1a1d23] rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-gray-500">2h ago</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{user.lastMsg}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer / Chat Input ── */}
        {selectedUser && (
          <div className="p-4 border-t border-gray-200 dark:border-[#2a2d33] bg-gray-50 dark:bg-[#1a1d23] flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <label className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2d33] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors border border-gray-200 dark:border-[#3a3d43] hover:border-gray-400 dark:hover:border-gray-500 flex items-center justify-center">
                <input type="file" className="hidden" onChange={handleFileUpload} />
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </label>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-white dark:bg-[#0c0e12] border border-gray-200 dark:border-[#2a2d33] rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button
                type="submit"
                className="p-2 rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/20"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatDrawer;
