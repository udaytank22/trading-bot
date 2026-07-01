import React, { useState, useMemo } from "react";

// Generate mock attendance data for a given month/year
function generateAttendance(empId, year, month) {
  const seed = empId.charCodeAt(empId.length - 1) + month + year;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const attendance = {};

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayOfWeek = date.getDay();

    // Weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      attendance[d] = "weekend";
      continue;
    }

    // Future dates
    if (date > today) {
      attendance[d] = "future";
      continue;
    }

    // Deterministic pseudo-random based on seed + day
    const hash = ((seed * 31 + d * 17) % 100);
    if (hash < 70) {
      attendance[d] = "present";
    } else if (hash < 85) {
      attendance[d] = "absent";
    } else {
      attendance[d] = "halfday";
    }
  }

  return attendance;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function EmployeeViewModal({ isOpen, onClose, employee }) {
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const attendance = useMemo(() => {
    if (!employee) return {};
    return generateAttendance(employee.id, viewYear, viewMonth);
  }, [employee, viewYear, viewMonth]);

  const calendarGrid = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    // Blank cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push({ day: null });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, status: attendance[d] });
    }

    return cells;
  }, [viewYear, viewMonth, attendance]);

  // Stats
  const stats = useMemo(() => {
    let present = 0, absent = 0, halfday = 0, total = 0;
    Object.values(attendance).forEach(s => {
      if (s === "present") { present++; total++; }
      else if (s === "absent") { absent++; total++; }
      else if (s === "halfday") { halfday++; total++; }
    });
    return { present, absent, halfday, total };
  }, [attendance]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const goToToday = () => {
    setViewMonth(today.getMonth());
    setViewYear(today.getFullYear());
  };

  if (!isOpen || !employee) return null;

  const statusColor = employee.status === "Active"
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : "bg-gray-500/15 text-gray-400 border-gray-500/30";

  const getCellClasses = (status) => {
    switch (status) {
      case "present":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30";
      case "absent":
        return "bg-red-500/20 text-red-300 border-red-500/30 hover:bg-red-500/30";
      case "halfday":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/30";
      case "weekend":
        return "bg-white/[0.02] text-gray-600 border-transparent";
      case "future":
        return "bg-white/[0.02] text-gray-600 border-transparent";
      default:
        return "";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "present": return "Present";
      case "absent": return "Absent";
      case "halfday": return "Half Day";
      case "weekend": return "Weekend";
      case "future": return "—";
      default: return "";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-[900px] max-h-[90vh] bg-white dark:bg-[#13151a] border border-gray-200 dark:border-[#2a2d33] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalSlideIn 0.25s ease-out" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a2d33] bg-gray-50/50 dark:bg-[#0c0e12]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center text-purple-400 font-bold text-sm border border-purple-500/20 shadow-inner">
              {employee.avatar}
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{employee.name}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{employee.id} · {employee.department}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] rounded-xl transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="flex gap-6 flex-col lg:flex-row">

            {/* Left: Employee Details */}
            <div className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
              <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Employee Details</h3>

                <DetailRow label="Full Name" value={employee.name} />
                <DetailRow label="Email" value={employee.email} />
                <DetailRow label="Phone" value={employee.phone || "—"} />
                <DetailRow label="Role" value={employee.role} />
                <DetailRow label="Department" value={employee.department} />
                <DetailRow
                  label="Joining Date"
                  value={new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                />

                <div className="pt-2 border-t border-gray-100 dark:border-[#2a2d33]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-1.5">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                    {employee.status}
                  </span>
                </div>
              </div>

              {/* Attendance Summary */}
              <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
                  {MONTH_NAMES[viewMonth]} Summary
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  <StatCard label="Present" count={stats.present} color="emerald" />
                  <StatCard label="Absent" count={stats.absent} color="red" />
                  <StatCard label="Half Day" count={stats.halfday} color="yellow" />
                </div>
              </div>
            </div>

            {/* Right: Attendance Calendar */}
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-xl p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={goToToday}
                      className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-all active:scale-95"
                    >
                      Today
                    </button>
                    <button
                      onClick={goToPrevMonth}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={goToNextMonth}
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all active:scale-90"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Day Headers */}
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {DAY_LABELS.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold uppercase tracking-wider text-gray-500 py-1.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarGrid.map((cell, idx) => {
                    if (cell.day === null) {
                      return <div key={`empty-${idx}`} className="aspect-square" />;
                    }

                    const isToday =
                      cell.day === today.getDate() &&
                      viewMonth === today.getMonth() &&
                      viewYear === today.getFullYear();

                    return (
                      <div
                        key={cell.day}
                        className={`aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-bold transition-all cursor-default group relative ${getCellClasses(cell.status)} ${isToday ? "ring-2 ring-purple-500 ring-offset-1 ring-offset-[#1a1d23]" : ""
                          }`}
                        title={`${cell.day} ${MONTH_NAMES[viewMonth]} — ${getStatusLabel(cell.status)}`}
                      >
                        <span className="text-[13px] leading-none">{cell.day}</span>
                        {cell.status !== "weekend" && cell.status !== "future" && (
                          <span className="text-[7px] uppercase tracking-wider mt-0.5 opacity-70">
                            {cell.status === "present" ? "P" : cell.status === "absent" ? "A" : "HD"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-[#2a2d33]">
                  <LegendDot color="bg-emerald-500" label="Present" />
                  <LegendDot color="bg-red-500" label="Absent" />
                  <LegendDot color="bg-yellow-500" label="Half Day" />
                  <LegendDot color="bg-gray-600" label="Weekend / Future" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200 font-medium break-all">{value}</span>
    </div>
  );
}

function StatCard({ label, count, color }) {
  const colors = {
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
    yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  return (
    <div className={`rounded-lg border p-2 text-center ${colors[color]}`}>
      <span className="text-sm font-bold block leading-tight">{count}</span>
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{label}</span>
    </div>
  );
}

function LegendDot({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] text-gray-500 font-medium">{label}</span>
    </div>
  );
}
