/**
 * @file TodoPage.jsx
 * @description Refactored To-Do dashboard featuring Daily Agenda, sleek Custom Calendar, and Team Memories.
 * Supports both light and dark modes.
 */

import React, { useState } from "react";
import { Plus, MapPin, ShieldAlert, Users, Camera, ChevronLeft, ChevronRight } from "lucide-react";
import MemoryDetailsModal from "./MemoryDetailsModal";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_AGENDA = [
  {
    id: 1,
    time: "08:30",
    period: "AM",
    title: "Vessel Arrival: MS Atlantic Star",
    location: "Terminal 4, Berth 12",
    status: "CONFIRMED",
    statusCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
    borderColor: "border-[#00e5ff]", // Cyan glowing left border
    glowCls: "dark:shadow-[-8px_0_15px_-5px_rgba(0,229,255,0.1)] shadow-[-8px_0_15px_-5px_rgba(0,229,255,0.3)]",
    tags: [
      { icon: ShieldAlert, label: "Provisioning\nRequired" },
      { icon: Users, label: "Logistics Team\nA" }
    ]
  },
  {
    id: 2,
    time: "11:00",
    period: "AM",
    title: "Client Review: Neptune Shipping Group",
    location: "Virtual Command Room",
    status: "PENDING",
    statusCls: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
    borderColor: "border-[#b388ff]", // Purple
    glowCls: "dark:shadow-[-8px_0_15px_-5px_rgba(179,136,255,0.1)] shadow-[-8px_0_15px_-5px_rgba(179,136,255,0.3)]",
    tags: []
  },
  {
    id: 3,
    time: "01:30",
    period: "PM",
    title: "Quarterly Team Appreciation Luncheon",
    location: "Main Hall & Terrace",
    status: "CONFIRMED",
    statusCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
    borderColor: "border-[#00e676]", // Green
    glowCls: "dark:shadow-[-8px_0_15px_-5px_rgba(0,230,118,0.1)] shadow-[-8px_0_15px_-5px_rgba(0,230,118,0.3)]",
    tags: []
  },
  {
    id: 4,
    time: "04:00",
    period: "PM",
    title: "Emergency Spare Parts Delivery",
    location: "Courier Gateway Alpha",
    status: "CONFIRMED",
    statusCls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-500",
    borderColor: "border-[#2979ff]", // Blue
    glowCls: "dark:shadow-[-8px_0_15px_-5px_rgba(41,121,255,0.1)] shadow-[-8px_0_15px_-5px_rgba(41,121,255,0.3)]",
    tags: []
  }
];

const baseMemoryDetails = {
  title: "Annual Team Celebration 2025",
  date: "Oct 15, 2025",
  location: "Sky Garden Terrace",
  description: "A memorable evening celebrating our team's hard work and collective success over the past year. From rooftop discussions to the final toast, this event captured the spirit of collaboration that drives our team forward.",
  gallery: [
    "/memories/memory_1_1779867154430.png",
    "/memories/memory_2_1779867171464.png",
    "/memories/memory_3_1779867188365.png",
    "/memories/memory_4_1779867206277.png"
  ],
  attendees: [
    { name: "Sarah Conner", role: "Support Agent", initials: "SC" },
    { name: "Frank Comly", role: "Logistics Lead", initials: "FC" },
    { name: "Maryam Amiri", role: "Designer", initials: "MA" }
  ]
};

const MEMORIES = [
  { image: "/memories/memory_1_1779867154430.png", ...baseMemoryDetails },
  { image: "/memories/memory_2_1779867171464.png", ...baseMemoryDetails },
  { image: "/memories/memory_3_1779867188365.png", ...baseMemoryDetails },
  { image: "/memories/memory_4_1779867206277.png", ...baseMemoryDetails }
];

// ─── HELPER COMPONENTS ────────────────────────────────────────────────────────
const CalendarWidget = () => {
  const days = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  // Mock October 2023 Layout
  const dates = [
    [25, 26, 27, 28, 29, 30, 1],
    [2, 3, 4, 5, 6, 7, 8],
    [23, 24, 25, 26, 27, 28, 29]
  ];

  return (
    <div className="bg-white dark:bg-[#1a1d2d] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-lg relative overflow-hidden transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-gray-900 dark:text-white font-bold text-sm tracking-wide transition-colors">October 2023</h3>
        <div className="flex gap-2">
          <ChevronLeft size={16} className="text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" />
          <ChevronRight size={16} className="text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white transition-colors" />
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map(d => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Dates Grid */}
      <div className="space-y-4">
        {dates.map((week, wIdx) => (
          <div key={wIdx} className="grid grid-cols-7 gap-2">
            {week.map((date, dIdx) => {
              const isSelected = wIdx === 2 && date === 25;
              const isFaded = wIdx === 0 && date > 20; // Previous month dates

              return (
                <div key={`${wIdx}-${dIdx}`} className="flex justify-center">
                  <div className={`
                    flex items-center justify-center w-7 h-7 text-xs font-medium rounded-full cursor-pointer transition-all
                    ${isSelected ? "bg-[#00e5ff] text-[#121623] shadow-[0_0_12px_rgba(0,229,255,0.4)]" :
                      isFaded ? "text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"}
                  `}>
                    {date}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function TodoPage() {
  const [selectedMemory, setSelectedMemory] = useState(null);

  return (
    // Background adapting between gray-50 in light mode and dark navy in dark mode
    <div className="w-full h-full bg-gray-50 dark:bg-[#121623] text-gray-900 dark:text-white p-8 overflow-y-auto custom-scrollbar font-sans rounded-xl border border-gray-200 dark:border-white/5 transition-colors">
      <MemoryDetailsModal
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        memory={selectedMemory}
      />
      <div className="max-w-7xl mx-auto flex flex-col xl:flex-row gap-8">

        {/* ── LEFT COLUMN: Daily Agenda ── */}
        <div className="flex-1 max-w-3xl flex flex-col gap-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-gray-900 dark:text-gray-300 font-bold text-lg mb-1 transition-colors">Daily Agenda</h1>
              <p className="text-gray-500 dark:text-gray-400 text-[13px] transition-colors">Wednesday, October 25th, 2023</p>
            </div>
            <button className="flex items-center gap-2 bg-white dark:bg-[#2a2e40] hover:bg-gray-100 dark:hover:bg-[#34384a] text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-gray-200 dark:border-white/5 shadow-sm">
              <Plus size={16} /> Assign Task
            </button>
          </div>

          {/* Agenda List */}
          <div className="flex flex-col gap-4">
            {MOCK_AGENDA.map((item) => (
              <div
                key={item.id}
                className={`bg-white dark:bg-[#171a27] rounded-xl border border-gray-200 dark:border-white/5 border-l-4 ${item.borderColor} ${item.glowCls} p-5 flex flex-col md:flex-row gap-6 transition-all hover:-translate-y-[2px] shadow-sm`}
              >
                {/* Time section */}
                <div className="flex flex-col md:items-center min-w-[70px]">
                  <span className={`text-[15px] font-bold ${item.borderColor.replace('border-', 'text-')}`}>
                    {item.time}
                  </span>
                  <span className="text-gray-400 dark:text-white text-[11px] font-black mt-0.5 transition-colors">{item.period}</span>
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-gray-900 dark:text-white font-bold text-[15px] tracking-wide mb-2 transition-colors">{item.title}</h3>
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs transition-colors">
                        <MapPin size={14} />
                        {item.location}
                      </div>
                    </div>
                    {/* Status Badge */}
                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest transition-colors ${item.statusCls}`}>
                      {item.status}
                    </div>
                  </div>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-4 mt-2">
                      {item.tags.map((tag, idx) => {
                        const Icon = tag.icon;
                        return (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-[#1a1d2d] border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 text-[11px] text-gray-600 dark:text-gray-400 font-medium transition-colors">
                            <Icon size={16} className="text-gray-400 dark:text-gray-500" />
                            <span className="whitespace-pre-line leading-tight">{tag.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* ── RIGHT COLUMN: Widgets ── */}
        <div className="w-full xl:w-[400px] flex flex-col gap-6">

          <CalendarWidget />

          {/* Team Memories Section */}
          <div className="bg-white dark:bg-[#1a1d2d] rounded-2xl p-6 border border-gray-200 dark:border-white/5 shadow-lg flex-1 flex flex-col transition-colors">

            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-gray-900 dark:text-white font-bold text-sm tracking-wide mb-1 transition-colors">Team Memories</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs transition-colors">Capturing our offshore success</p>
              </div>
              <button className="w-8 h-8 rounded-full bg-gray-50 dark:bg-[#171a27] border border-gray-200 dark:border-white/5 flex items-center justify-center text-purple-600 dark:text-[#00e5ff] hover:bg-gray-100 dark:hover:bg-[#00e5ff]/10 transition-colors shadow-sm">
                <Camera size={14} />
              </button>
            </div>

            {/* Photo Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {MEMORIES.map((memory, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedMemory(memory)}
                  className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-white/5 relative group cursor-pointer bg-gray-100 dark:bg-[#121623] transition-colors"
                >
                  <img
                    src={memory.image}
                    alt="Memory"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </div>
              ))}
            </div>

            {/* Add Memory Button */}
            <button className="w-full mt-auto py-3 border border-dashed border-gray-300 dark:border-gray-600 hover:border-purple-500 dark:hover:border-gray-400 rounded-xl flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-gray-300 text-sm font-medium transition-colors">
              <Plus size={16} /> Add New Memory
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}
