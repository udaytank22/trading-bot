import React, { useState } from "react";
import { Select } from "../components/ui";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Users,
  Clock,
  MapPin,
  Gift,
  PartyPopper,
  Plane,
  Search,
  Grid,
  List as ListIcon,
  Image as ImageIcon,
  History,
  Download,
  Share2,
  Heart,
  X,
  AlignLeft,
  AlertCircle,
} from "lucide-react";
import { mockTodoData } from "../data/mockTodo";

// Move Modal outside the main component to prevent re-declaration on every render
const AddMeetingModal = ({
  isOpen,
  onClose,
  formData,
  setFormData,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-[#161922] w-full max-w-xl rounded-[3rem] shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Schedule New Meeting
              </h3>
              <p className="text-xs text-gray-500">
                Plan your next team collaboration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-gray-200 dark:hover:bg-white/10 rounded-2xl text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-10 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Meeting Title
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                <AlignLeft size={18} />
              </div>
              <input
                required
                autoFocus
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Weekly Strategy Review"
                className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 transition-all outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Date
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  <CalendarIcon size={18} />
                </div>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Time
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  <Clock size={18} />
                </div>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Location
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-purple-500 transition-colors">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Room / Zoom Link"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 transition-all outline-none"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                Priority
              </label>
              <Select
  variant="form"
                value={formData.priority}
                onChange={(val) =>
                  setFormData({ ...formData, priority: val })
                }
                options={[
                  { value: "High", label: "High Priority" },
                  { value: "Medium", label: "Medium Priority" },
                  { value: "Low", label: "Low Priority" },
                ]}
                className="w-full"
              />
            </div>
          </div>

          <div className="pt-6">
            <button
              type="submit"
              className="w-full py-5 bg-purple-600 hover:bg-purple-500 text-white rounded-3xl font-black text-lg shadow-2xl shadow-purple-500/30 transition-all active:scale-95"
            >
              Confirm & Schedule Meeting
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TodoPage() {
  const [view, setView] = useState("calendar"); // 'calendar' or 'memories'
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [events, setEvents] = useState(mockTodoData.events);

  // Form State
  const [newMeeting, setNewMeeting] = useState({
    title: "",
    date: "2026-05-13",
    time: "10:00",
    location: "",
    priority: "Medium",
    description: "",
  });

  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dates = [10, 11, 12, 13, 14, 15, 16];
  const timeSlots = [
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
  ];

  const handleAddMeeting = (e) => {
    e.preventDefault();
    const id = events.length + 1;
    setEvents([
      ...events,
      { ...newMeeting, id, time: `${newMeeting.time} AM` },
    ]); // Simplification for display
    setIsAddingMeeting(false);
    setNewMeeting({
      title: "",
      date: "2026-05-13",
      time: "10:00",
      location: "",
      priority: "Medium",
      description: "",
    });
  };

  if (selectedMemory) {
    return (
      <div className="h-full flex flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-500 overflow-y-auto custom-scrollbar pb-12">
        {/* Memory Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSelectedMemory(null)}
              className="p-4 bg-gray-100 dark:bg-white/5 hover:bg-purple-600 hover:text-white rounded-3xl text-gray-600 dark:text-gray-400 transition-all shadow-sm group active:scale-95"
            >
              <ChevronLeft
                size={24}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Event Detail
                </span>
                <span className="text-gray-400 text-sm">•</span>
                <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                  {selectedMemory.date}
                </span>
              </div>
              <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {selectedMemory.title}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:text-rose-500 transition-colors shadow-sm">
              <Heart size={20} />
            </button>
            <button className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:text-blue-500 transition-colors shadow-sm">
              <Share2 size={20} />
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold shadow-lg shadow-purple-500/20 transition-all active:scale-95">
              <Download size={20} /> Download All
            </button>
          </div>
        </div>

        {/* Gallery Scroller */}
        <div className="relative group">
          <div className="flex gap-8 overflow-x-auto pb-10 pt-4 snap-x snap-mandatory custom-scrollbar scroll-smooth no-scrollbar">
            {selectedMemory.gallery.map((img, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[85vw] md:w-[750px] h-[500px] rounded-[3.5rem] overflow-hidden shadow-2xl snap-center group/img relative border-4 border-white dark:border-white/5"
              >
                <img
                  src={img}
                  alt={`Gallery ${i}`}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover/img:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/img:opacity-100 transition-all duration-500 flex flex-col justify-end p-12">
                  <div className="transform translate-y-4 group-hover/img:translate-y-0 transition-transform duration-500">
                    <h4 className="text-white text-2xl font-bold mb-2">
                      Moments of Joy
                    </h4>
                    <p className="text-white/70 text-sm max-w-md">
                      Captured during the peak of the celebration, showcasing
                      our team's unity and spirit.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-3">
            {selectedMemory.gallery.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 rounded-full transition-all duration-500 ${i === 0 ? "bg-purple-600 w-12" : "bg-gray-200 dark:bg-white/10 w-2.5"}`}
              />
            ))}
          </div>
        </div>

        {/* Event Stats & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* Story Card */}
            <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group hover:border-purple-500/30 transition-all">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl group-hover:bg-purple-600/10 transition-all" />
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-1 bg-purple-600 rounded-full" />
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-widest">
                    The Story
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-2xl font-medium italic">
                  "{selectedMemory.description}"
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-indigo-500/30 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <Users
                  size={80}
                  className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700"
                />
                <Users size={48} className="mb-8 opacity-80" />
                <div className="text-6xl font-black tracking-tighter mb-2">
                  {selectedMemory.attendees}
                </div>
                <div className="text-lg font-bold opacity-80 uppercase tracking-widest">
                  Active Participants
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-emerald-500/30 group hover:-translate-y-2 transition-all duration-500 relative overflow-hidden">
                <Gift
                  size={80}
                  className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700"
                />
                <Gift size={48} className="mb-8 opacity-80" />
                <div className="text-6xl font-black tracking-tighter mb-2">
                  {selectedMemory.highlights.length}
                </div>
                <div className="text-lg font-bold opacity-80 uppercase tracking-widest">
                  Main Events
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Highlights */}
          <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-[3.5rem] p-12 shadow-2xl h-fit sticky top-8 group">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-10 border-b border-gray-100 dark:border-white/5 pb-6">
              Event Highlights
            </h3>
            <div className="space-y-8">
              {selectedMemory.highlights.map((h, i) => (
                <div
                  key={i}
                  className="flex items-start gap-6 group/item cursor-default"
                >
                  <div className="flex-shrink-0 w-14 h-14 rounded-[1.25rem] bg-purple-500/10 flex items-center justify-center text-purple-600 font-black text-xl transition-all group-hover/item:bg-purple-600 group-hover/item:text-white group-hover/item:scale-110 shadow-sm">
                    {i + 1}
                  </div>
                  <div className="pt-2">
                    <span className="text-gray-800 dark:text-gray-200 font-bold text-xl block group-hover/item:text-purple-600 transition-colors leading-tight">
                      {h}
                    </span>
                    <span className="text-xs text-gray-400 font-medium uppercase tracking-tighter mt-1 block">
                      Completed Event
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 p-8 bg-gray-50 dark:bg-white/[0.02] rounded-[2.5rem] border border-gray-100 dark:border-white/5">
              <div className="flex items-center gap-3 text-gray-500 mb-2">
                <MapPin size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">
                  Location
                </span>
              </div>
              <div className="text-xl font-extrabold text-gray-900 dark:text-white">
                {selectedMemory.location}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-700">
      <AddMeetingModal
        isOpen={isAddingMeeting}
        onClose={() => setIsAddingMeeting(false)}
        formData={newMeeting}
        setFormData={setNewMeeting}
        onSubmit={handleAddMeeting}
      />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Events & Schedule
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage meetings, celebrations, and team memories.
          </p>
        </div>

        <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-2xl border border-gray-200 dark:border-white/10">
          <button
            onClick={() => setView("calendar")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "calendar" ? "bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <CalendarIcon size={16} /> Calendar
          </button>
          <button
            onClick={() => setView("memories")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${view === "memories" ? "bg-white dark:bg-purple-600 text-purple-600 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
          >
            <History size={16} /> Memories
          </button>
        </div>
      </div>

      {view === "calendar" ? (
        <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden">
          {/* Main Calendar View */}
          <div className="flex-1 bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-3xl flex flex-col overflow-hidden shadow-xl">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.01]">
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-400 transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg text-gray-600 dark:text-gray-400 transition-colors">
                  <ChevronRight size={20} />
                </button>
                <button className="px-4 py-1.5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors ml-2">
                  Today
                </button>
                <span className="text-lg font-bold text-gray-900 dark:text-white ml-4">
                  May 2026
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    placeholder="Search meetings..."
                    className="pl-9 pr-4 py-2 bg-gray-100 dark:bg-white/5 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500/50 transition-all w-48"
                  />
                </div>
                <button
                  onClick={() => setIsAddingMeeting(true)}
                  className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all"
                >
                  <Plus size={18} /> New Meeting
                </button>
              </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-100 dark:border-white/5">
              <div className="p-4 border-r border-gray-100 dark:border-white/5" />
              {days.map((day, i) => (
                <div
                  key={day}
                  className={`p-4 text-center border-r border-gray-100 dark:border-white/5 last:border-r-0 ${dates[i] === 13 ? "bg-purple-500/5" : ""}`}
                >
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {day}
                  </span>
                  <div
                    className={`mt-1 text-xl font-bold flex items-center justify-center mx-auto w-10 h-10 rounded-full transition-all ${dates[i] === 13 ? "bg-purple-600 text-white shadow-md" : "text-gray-700 dark:text-gray-300"}`}
                  >
                    {dates[i]}
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-50 dark:border-white/[0.02] min-h-[80px]"
                >
                  <div className="p-3 text-[11px] font-bold text-gray-400 border-r border-gray-100 dark:border-white/5 flex justify-end">
                    {time}
                  </div>
                  {dates.map((date) => {
                    const event = events.find(
                      (e) =>
                        e.time.startsWith(time.split(":")[0]) &&
                        e.date.endsWith(date.toString()),
                    );
                    return (
                      <div
                        key={date}
                        className={`p-1 border-r border-gray-50 dark:border-white/[0.02] last:border-r-0 relative group ${date === 13 ? "bg-purple-500/[0.01]" : ""}`}
                      >
                        {event && (
                          <div
                            className={`absolute inset-1 p-2 rounded-xl text-[10px] leading-tight border-l-4 shadow-sm transition-all hover:scale-[1.02] hover:z-10 cursor-pointer ${
                              event.priority === "High"
                                ? "bg-rose-500/10 border-rose-500 text-rose-700 dark:text-rose-300"
                                : event.priority === "Medium"
                                  ? "bg-amber-500/10 border-amber-500 text-amber-700 dark:text-amber-300"
                                  : "bg-blue-500/10 border-blue-500 text-blue-700 dark:text-blue-300"
                            }`}
                          >
                            <div className="font-bold truncate">
                              {event.title}
                            </div>
                            <div className="opacity-80 truncate">
                              {event.location}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            {/* Mini Calendar */}
            <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  May 2026
                </h4>
                <div className="flex gap-1">
                  <ChevronLeft
                    size={16}
                    className="text-gray-400 cursor-pointer"
                  />
                  <ChevronRight
                    size={16}
                    className="text-gray-400 cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {days.map((d) => (
                  <span key={d} className="text-[10px] font-bold text-gray-400">
                    {d[0]}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-center">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <button
                    key={d}
                    className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg transition-all ${d === 13 ? "bg-purple-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Highlights */}
            <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-lg flex-1 overflow-y-auto custom-scrollbar">
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-between">
                Today's Highlights
                <span className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">
                  May 13
                </span>
              </h4>

              <div className="space-y-6">
                {/* Celebrations */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest">
                    <Gift size={14} /> Celebrations
                  </div>
                  {mockTodoData.celebrations.map((celeb) => (
                    <div
                      key={celeb.id}
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                    >
                      <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold text-sm">
                        {celeb.avatar}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {celeb.name}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {celeb.type}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Festival */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-widest">
                    <PartyPopper size={14} /> Festival
                  </div>
                  {mockTodoData.festivals.map((fest) => (
                    <div
                      key={fest.id}
                      className="p-3 bg-amber-500/5 rounded-2xl border border-amber-500/10"
                    >
                      <div className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {fest.name}
                      </div>
                      <div className="text-[11px] text-amber-600/70 mt-1">
                        {fest.description}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Leaves */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-500 uppercase tracking-widest">
                    <Plane size={14} /> Team Out
                  </div>
                  {mockTodoData.leaves.map((leave) => (
                    <div
                      key={leave.id}
                      className="flex items-center justify-between p-2"
                    >
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {leave.name}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {leave.type.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Memories View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockTodoData.pastEvents.map((event) => (
            <div
              key={event.id}
              onClick={() => setSelectedMemory(event)}
              className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-xl group hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              <div className="relative h-64 overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 text-white/70 text-xs font-bold uppercase tracking-widest mb-1">
                    <CalendarIcon size={12} /> {event.date}
                  </div>
                  <h3 className="text-xl font-bold text-white">
                    {event.title}
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2">
                  {event.description}
                </p>
                <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 border-2 border-white dark:border-[#161922] flex items-center justify-center text-[10px] font-bold text-gray-500"
                        >
                          {i === 3 ? `+${event.attendees - 2}` : `U${i}`}
                        </div>
                      ))}
                    </div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                      {event.attendees} Attendees
                    </span>
                  </div>
                  <button className="text-purple-500 hover:text-purple-400 font-bold text-sm flex items-center gap-1 transition-colors">
                    View Gallery <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Add Memory Card */}
          <button className="bg-gray-50 dark:bg-white/[0.02] border-2 border-dashed border-gray-200 dark:border-white/10 rounded-[2.5rem] p-12 flex flex-col items-center justify-center gap-4 text-gray-400 hover:text-purple-500 hover:border-purple-500/50 transition-all duration-300 group">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-all">
              <Plus size={32} />
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-gray-900 dark:text-white mb-1 group-hover:text-purple-500">
                Add New Memory
              </div>
              <p className="text-sm">Upload images from recent events</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
