import React from "react";

export default function ContactModal({ isOpen, onClose, deal }) {
  if (!isOpen || !deal) return null;

  const contacts = [
    {
      role: "Supplier",
      name: deal.supplier || "N/A",
      phone: "+91 98765 00001",
      email: "supplier@example.com",
      icon: (
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.121 14.804A6 6 0 0110 13a6 6 0 014.879 1.804M15 10a5 5 0 11-10 0 5 5 0 0110 0z" />
      ),
    },
    {
      role: "Buyer",
      name: deal.buyer_name || "N/A",
      phone: "+91 98765 00002",
      email: deal.buyer_email || "buyer@example.com",
      icon: (
        <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM5.121 14.804A6 6 0 0110 13a6 6 0 014.879 1.804M15 10a5 5 0 11-10 0 5 5 0 0110 0z" />
      ),
    },
    {
      role: "Driver",
      name: "Rajesh Kumar",
      phone: "+91 98765 00003",
      email: "rajesh.driver@logistics.com",
      icon: (
        <path d="M8 7a4 4 0 118 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      ),
    },
    {
      role: "Helper",
      name: "Suresh Singh",
      phone: "+91 98765 00004",
      email: "suresh.helper@logistics.com",
      icon: (
        <path d="M8 7a4 4 0 118 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      ),
    },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#1e2028] border border-[#2a2d36] rounded-2xl shadow-2xl flex flex-col z-10 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[#2a2d36] flex justify-between items-center bg-[#1a1d23]">
          <div>
            <h2 className="text-white text-xl font-bold tracking-wide">
              Contact Directory
            </h2>
            <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest font-semibold">
              {deal.inquiry_id} • {deal.cargo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((contact, idx) => (
            <div
              key={idx}
              className="group p-4 bg-[#242830]/50 border border-[#2a2d36] rounded-xl hover:border-emerald-500/30 hover:bg-[#242830] transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-emerald-500"
                    fill="none"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    {contact.icon}
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                    {contact.role}
                  </p>
                  <h3 className="text-white font-bold truncate">
                    {contact.name}
                  </h3>
                  <div className="mt-3 space-y-2">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {contact.phone}
                    </a>
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors truncate"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      {contact.email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1d23] border-t border-[#2a2d36] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white font-bold rounded-lg transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scale-in {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
