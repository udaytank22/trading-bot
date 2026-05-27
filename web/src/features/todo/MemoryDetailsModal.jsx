import React, { useEffect } from "react";
import { X, Calendar, MapPin, Plus } from "lucide-react";

export default function MemoryDetailsModal({ isOpen, onClose, memory }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !memory) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* BACKDROP */}
      <div 
        onClick={handleBackdropClick}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] transition-opacity" 
      />
      
      {/* MODAL */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <div className="w-full max-w-3xl max-h-[90vh] bg-white dark:bg-[#161925] rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-auto border border-gray-200 dark:border-white/5 transition-colors">
          
          {/* HERO SECTION */}
          <div className="relative h-64 sm:h-72 w-full flex-shrink-0">
            <img 
              src={memory.image} 
              alt={memory.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-black/20 dark:from-[#161925] dark:via-[#161925]/60 dark:to-transparent transition-colors" />
            
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors"
            >
              <X size={16} />
            </button>

            {/* Title & Meta */}
            <div className="absolute bottom-6 left-6 right-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 transition-colors">{memory.title}</h2>
              <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-gray-700 dark:text-white/80 transition-colors">
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <Calendar size={16} />
                  {memory.date}
                </div>
                <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <MapPin size={16} />
                  {memory.location}
                </div>
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-10">
            
            {/* About */}
            <section>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-3 transition-colors">About the Event</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors">
                {memory.description}
              </p>
            </section>

            {/* Gallery */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest transition-colors">Event Gallery</h3>
                <button className="flex items-center gap-1.5 text-sm font-bold text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 transition-colors">
                  <Plus size={16} /> Add to Gallery
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {memory.gallery.map((img, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 cursor-pointer group">
                    <img src={img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Gallery item" />
                  </div>
                ))}
              </div>
            </section>

            {/* Attendees */}
            <section>
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-widest mb-4 transition-colors">Attendees</h3>
              <div className="flex flex-wrap gap-8">
                {memory.attendees.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-500 text-sm border-2 border-white dark:border-[#161925] shadow-sm transition-colors">
                      {att.avatar ? <img src={att.avatar} className="w-full h-full object-cover" /> : att.initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white transition-colors">{att.name}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400 transition-colors">{att.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}
