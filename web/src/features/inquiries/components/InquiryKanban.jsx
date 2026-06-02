import React, { useState, useRef, useCallback, useMemo } from "react";

/* ── Workflow column order and color themes ──────────────────────── */
export const KANBAN_COLUMNS = [
  {
    id: "PENDING",
    label: "Pending",
    dotCls: "bg-[#f5a623]",
    countBadgeCls: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
    bodyCls: "bg-[#faf8f5] dark:bg-[#15181f]/40 border-amber-200/50 dark:border-amber-900/10",
  },
  {
    id: "RFQ_READY",
    label: "RFQ Ready",
    dotCls: "bg-[#7c3aed]",
    countBadgeCls: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-400",
    bodyCls: "bg-[#f8f6fc] dark:bg-[#15181f]/40 border-purple-200/50 dark:border-purple-900/10",
  },
  {
    id: "RFQ_SENT",
    label: "RFQ Sent",
    dotCls: "bg-[#2563eb]",
    countBadgeCls: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-400",
    bodyCls: "bg-[#f3f7fd] dark:bg-[#15181f]/40 border-blue-200/50 dark:border-blue-900/10",
  },
  {
    id: "TL_REVIEW",
    label: "TL Review",
    dotCls: "bg-rose-500",
    countBadgeCls: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400",
    bodyCls: "bg-[#faf5f6] dark:bg-[#15181f]/40 border-rose-200/50 dark:border-rose-900/10",
  },
  {
    id: "ADMIN_APPROVAL",
    label: "Admin Approval",
    dotCls: "bg-orange-500",
    countBadgeCls: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-400",
    bodyCls: "bg-[#faf6f3] dark:bg-[#15181f]/40 border-orange-200/50 dark:border-orange-900/10",
  },
  {
    id: "EMPLOYEE_VERIFY",
    label: "Employee Verify",
    dotCls: "bg-sky-500",
    countBadgeCls: "bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-400",
    bodyCls: "bg-[#f2f7fa] dark:bg-[#15181f]/40 border-sky-200/50 dark:border-sky-900/10",
  },
  {
    id: "CLIENT_FINAL_APPROVAL",
    label: "Client Decision",
    dotCls: "bg-violet-500",
    countBadgeCls: "bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-400",
    bodyCls: "bg-[#f5f3fa] dark:bg-[#15181f]/40 border-violet-200/50 dark:border-violet-900/10",
  },
  {
    id: "QUOTE_SENT",
    label: "Quoted",
    dotCls: "bg-emerald-500",
    countBadgeCls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    bodyCls: "bg-[#f2faf5] dark:bg-[#15181f]/40 border-emerald-200/50 dark:border-emerald-900/10",
  },
  {
    id: "CONFIRMED",
    label: "Confirmed",
    dotCls: "bg-teal-500",
    countBadgeCls: "bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-400",
    bodyCls: "bg-[#f2faf8] dark:bg-[#15181f]/40 border-teal-200/50 dark:border-teal-900/10",
  },
  {
    id: "CLOSED",
    label: "Closed",
    dotCls: "bg-gray-500",
    countBadgeCls: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400",
    bodyCls: "bg-[#f5f5f5] dark:bg-[#15181f]/40 border-gray-200/50 dark:border-gray-800/10",
  },
];

const ACTION_MAP = {
  PENDING: {
    label: "Check Stock",
  },
  RFQ_READY: {
    label: "Create RFQ",
  },
  TL_REVIEW: {
    label: "Set Margin",
  },
  ADMIN_APPROVAL: {
    label: "Approve",
  },
  EMPLOYEE_VERIFY: {
    label: "Verify & Quote",
  },
  CLIENT_FINAL_APPROVAL: {
    label: "Final Decision",
  },
  QUOTE_SENT: {
    label: "Confirm Deal",
  },
};

const ACTION_THEME_MAP = {
  PENDING: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:hover:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/30",
  RFQ_READY: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/30",
  TL_REVIEW: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/30",
  ADMIN_APPROVAL: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30",
  EMPLOYEE_VERIFY: "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:hover:bg-sky-900/30 dark:text-sky-400 dark:border-sky-800/30",
  CLIENT_FINAL_APPROVAL: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:hover:bg-violet-900/30 dark:text-violet-400 dark:border-violet-800/30",
  QUOTE_SENT: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30",
};

const STATUS_BADGE_MAP = {
  PENDING: "bg-amber-100/80 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
  RFQ_READY: "bg-purple-100/80 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300",
  RFQ_SENT: "bg-blue-100/80 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
  TL_REVIEW: "bg-rose-100/80 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
  ADMIN_APPROVAL: "bg-orange-100/80 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300",
  EMPLOYEE_VERIFY: "bg-sky-100/80 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300",
  CLIENT_FINAL_APPROVAL: "bg-violet-100/80 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  QUOTE_SENT: "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
  CONFIRMED: "bg-teal-100/80 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300",
  CLOSED: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const ROLE_GATES = {
  PENDING: ["Sales Executive", "User", "Sourcing Manager", "Team Leader", "Admin", "Administrator"],
  RFQ_READY: ["Sales Executive", "User", "Sourcing Manager", "Team Leader", "Admin", "Administrator"],
  TL_REVIEW: ["Sourcing Manager", "Team Leader", "Admin", "Administrator"],
  ADMIN_APPROVAL: ["Admin", "Administrator"],
  EMPLOYEE_VERIFY: ["Sales Executive", "User", "Sourcing Manager", "Team Leader", "Admin", "Administrator"],
  CLIENT_FINAL_APPROVAL: ["Client", "Admin", "Administrator"],
  QUOTE_SENT: ["Admin", "Administrator", "Sales Executive", "User"],
};

const AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80",
];

function getAvatars(inqId) {
  let hash = 0;
  for (let i = 0; i < inqId.length; i++) {
    hash = inqId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const count = (Math.abs(hash) % 2) + 1;
  const avatarIndex1 = Math.abs(hash) % AVATARS.length;
  const avatarIndex2 = (Math.abs(hash) + 1) % AVATARS.length;
  if (count === 1) {
    return [AVATARS[avatarIndex1]];
  } else {
    return [AVATARS[avatarIndex1], AVATARS[avatarIndex2]];
  }
}

function getRoute(inquiryId, buyerName) {
  let hash = 0;
  const str = (inquiryId || "") + (buyerName || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const routes = [
    "Shanghai → Rotterdam",
    "Shenzhen → New York",
    "Hamburg → Dubai",
    "Singapore → Rotterdam",
    "Tokyo → Los Angeles",
    "Houston → Antwerp",
    "Genoa → Singapore",
    "Qingdao → Long Beach",
    "Busan → Hamburg",
    "Mumbai → London"
  ];
  const index = Math.abs(hash) % routes.length;
  return routes[index];
}

function getWeight(products, inquiryId) {
  let hash = 0;
  const str = inquiryId || "";
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const weightOptions = [12400, 950, 45000, 3200, 18500, 750, 24000, 1500, 38000, 8200];
  const index = Math.abs(hash) % weightOptions.length;
  return `${weightOptions[index].toLocaleString()} kg`;
}

function getRelativeTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
}

function KanbanCard({
  inq,
  onView,
  onAction,
  currentUser,
}) {
  const role = currentUser?.role || "Admin";
  const rLower = role.toLowerCase();
  const isAdmin = rLower === "admin" || rLower === "administrator" || rLower === "super admin";
  const isEmployee = rLower === "employee";
  const actionCfg = ACTION_MAP[inq.status];
  const canAct = actionCfg && (isAdmin || isEmployee);

  const route = getRoute(inq.inquiry_id, inq.buyer_name);
  const weight = getWeight(inq.products, inq.inquiry_id);
  const relativeTime = getRelativeTime(inq.date_received);
  const cardAvatars = getAvatars(inq.inquiry_id);
  const statusBadgeClass = STATUS_BADGE_MAP[inq.status] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
  const statusLabel = inq.status.replace(/_/g, " ");

  return (
    <div
      onClick={() => onView(inq)}
      className="group bg-white dark:bg-[#1e222b] border border-gray-150/70 dark:border-gray-800/60 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3.5 cursor-pointer relative"
    >
      {/* Top Row: ID and Status Pill */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-purple-650 dark:text-purple-400 font-mono tracking-wide">
          #{inq.inquiry_id.replace("OM-ENQ-", "TR-")}
        </span>
        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider ${statusBadgeClass}`}>
          {statusLabel}
        </span>
      </div>

      {/* Title / Buyer */}
      <div>
        <h4 className="text-[13px] font-bold text-gray-900 dark:text-white leading-snug">
          {inq.buyer_name}
        </h4>
      </div>

      {/* Details (Route and Weight) */}
      <div className="flex flex-col gap-2">
        {/* Route Row */}
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
            {route}
          </span>
        </div>

        {/* Cargo Weight Row */}
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 shrink-0"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25-3v13.5m0-13.5L3.75 7.5m8.25-3l8.25 3M3.75 7.5h16.5M12 17.25h.008v.008H12v-.008z" />
          </svg>
          <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
            {weight}
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800/60 my-0.5"></div>

      {/* Footer Row */}
      <div className="flex items-center justify-between mt-0.5">
        {/* Relative Time */}
        <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-3.5 h-3.5 text-gray-400/80 dark:text-gray-500/80"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] font-medium">
            {relativeTime}
          </span>
        </div>

        {/* Right side: Awaiting Feedback or Avatars */}
        {inq.status === "CLIENT_FINAL_APPROVAL" ? (
          <span className="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400 px-2 py-0.5 rounded-md text-[9px] font-extrabold border border-cyan-100/30 dark:border-cyan-900/30">
            Awaiting Feedback
          </span>
        ) : (
          <div className="flex -space-x-1.5 overflow-hidden">
            {cardAvatars.map((url, idx) => (
              <img
                key={idx}
                className="inline-block h-5 w-5 rounded-full ring-2 ring-white dark:ring-[#1e222b] object-cover"
                src={url}
                alt="Assignee Avatar"
              />
            ))}
          </div>
        )}
      </div>

      {/* Themed Quick Action Button */}
      {canAct && (
        <div
          className="pt-1.5"
          onClick={(e) => {
            e.stopPropagation();
            onAction(inq, inq.status);
          }}
        >
          <button
            className={`w-full text-[10px] font-extrabold px-3 py-1.5 rounded-xl border transition-all duration-200 tracking-wide uppercase ${ACTION_THEME_MAP[inq.status] || ""}`}
          >
            {actionCfg.label}
          </button>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({
  col,
  cards,
  onView,
  onAction,
  currentUser,
}) {
  return (
    <div
      className="flex-shrink-0 w-[290px] h-full min-h-0 flex flex-col transition-all duration-150"
    >
      {/* Column Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-1.5 py-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dotCls}`} />
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-700 dark:text-gray-300 leading-tight truncate">
            {col.label}
          </span>
          <span
            className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full flex-shrink-0 ${col.countBadgeCls}`}
          >
            {cards.length}
          </span>
        </div>

        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex-shrink-0">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM18 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
      </div>

      {/* Column Body Container */}
      <div className={`flex-1 min-h-0 flex flex-col rounded-2xl border border-dashed p-3 ${col.bodyCls}`}>
        <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar pb-8">
          <div className="flex flex-col gap-3 pb-4">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 px-3 rounded-xl border border-dashed border-gray-200/40 dark:border-gray-800/40 text-gray-400 dark:text-gray-600 bg-white/30 dark:bg-black/10">
                <svg
                  className="w-6 h-6 mb-2 opacity-60"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <span className="text-[11px] font-bold">Empty Column</span>
              </div>
            ) : (
              cards.map((inq) => (
                <KanbanCard
                  key={inq.inquiry_id}
                  inq={inq}
                  onView={onView}
                  onAction={onAction}
                  currentUser={currentUser}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InquiryKanban({
  items,
  onView,
  onAction,
  onStatusChange,
  currentUser,
}) {
  const boardRef = useRef(null);

  const grouped = useMemo(() => {
    const map = {};

    KANBAN_COLUMNS.forEach((col) => {
      map[col.id] = [];
    });

    items.forEach((inq) => {
      if (map[inq.status]) {
        map[inq.status].push(inq);
      } else {
        map.CLOSED.push(inq);
      }
    });

    return map;
  }, [items]);

  const scrollBoard = (direction) => {
    if (!boardRef.current) return;

    boardRef.current.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const totalCards = items.length;

  const activeStages = KANBAN_COLUMNS.filter(
    (c) => grouped[c.id]?.length > 0
  ).length;

  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col">
      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={boardRef}
          className="h-full w-full overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth"
        >
          <div className="flex h-full w-max gap-4 pb-3 pr-4">
            {KANBAN_COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                col={col}
                cards={grouped[col.id] || []}
                onView={onView}
                onAction={onAction}
                currentUser={currentUser}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-shrink-0 flex items-center justify-between gap-3 pt-3 px-1 border-t border-gray-200 dark:border-[#2a2d33] mt-2 bg-white dark:bg-[#1e2128]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[11px] text-gray-600 dark:text-gray-400 font-bold whitespace-nowrap">
            {totalCards} {totalCards === 1 ? "inquiry" : "inquiries"} across{" "}
            {activeStages} stages
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => scrollBoard("left")}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-100 dark:hover:bg-[#242830] transition-all"
          >
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollBoard("right")}
            className="w-6 h-6 flex items-center justify-center rounded border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-100 dark:hover:bg-[#242830] transition-all"
          >
            <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}