import React, { useState, useRef, useCallback, useMemo } from "react";

/* ── Workflow column order and color themes matching the reference design ──────── */
export const KANBAN_COLUMNS = [
  {
    id: "PENDING",
    label: "Pending",
    dotCls: "bg-amber-600",
    topBorderCls: "border-t-4 border-t-amber-600",
    leftBorderCls: "border-l-4 border-l-amber-600",
  },
  {
    id: "RFQ_READY",
    label: "RFQ ready",
    dotCls: "bg-amber-500",
    topBorderCls: "border-t-4 border-t-amber-500",
    leftBorderCls: "border-l-4 border-l-amber-500",
  },
  {
    id: "RFQ_SENT",
    label: "RFQ sent",
    dotCls: "bg-blue-600",
    topBorderCls: "border-t-4 border-t-blue-600",
    leftBorderCls: "border-l-4 border-l-blue-600",
  },
  {
    id: "TL_REVIEW",
    label: "TL review",
    dotCls: "bg-rose-600",
    topBorderCls: "border-t-4 border-t-rose-600",
    leftBorderCls: "border-l-4 border-l-rose-600",
  },
  {
    id: "ADMIN_APPROVAL",
    label: "Admin approval",
    dotCls: "bg-orange-500",
    topBorderCls: "border-t-4 border-t-orange-500",
    leftBorderCls: "border-l-4 border-l-orange-500",
  },
  {
    id: "RFQ_RECEIVED",
    label: "RFQ received",
    dotCls: "bg-purple-600",
    topBorderCls: "border-t-4 border-t-purple-600",
    leftBorderCls: "border-l-4 border-l-purple-600",
  },
  {
    id: "CLIENT_QUOTING",
    label: "Client quoting",
    dotCls: "bg-cyan-600",
    topBorderCls: "border-t-4 border-t-cyan-600",
    leftBorderCls: "border-l-4 border-l-cyan-600",
  },
  {
    id: "EMPLOYEE_VERIFY",
    label: "Verify",
    dotCls: "bg-sky-600",
    topBorderCls: "border-t-4 border-t-sky-600",
    leftBorderCls: "border-l-4 border-l-sky-600",
  },
  {
    id: "CLIENT_FINAL_APPROVAL",
    label: "Final approval",
    dotCls: "bg-violet-600",
    topBorderCls: "border-t-4 border-t-violet-600",
    leftBorderCls: "border-l-4 border-l-violet-600",
  },
  {
    id: "QUOTE_SENT",
    label: "Quoted",
    dotCls: "bg-emerald-600",
    topBorderCls: "border-t-4 border-t-emerald-600",
    leftBorderCls: "border-l-4 border-l-emerald-600",
  },
  {
    id: "CONFIRMED",
    label: "Confirmed",
    dotCls: "bg-emerald-600",
    topBorderCls: "border-t-4 border-t-emerald-600",
    leftBorderCls: "border-l-4 border-l-emerald-600",
  },
  {
    id: "CLOSED",
    label: "Closed",
    dotCls: "bg-gray-500",
    topBorderCls: "border-t-4 border-t-gray-500",
    leftBorderCls: "border-l-4 border-l-gray-500",
  },
];

const ACTION_MAP = {
  PENDING: { label: "Check Stock" },
  RFQ_READY: { label: "Create RFQ" },
  TL_REVIEW: { label: "Set Margin" },
  ADMIN_APPROVAL: { label: "Approve" },
  EMPLOYEE_VERIFY: { label: "Verify & Quote" },
  CLIENT_FINAL_APPROVAL: { label: "Final Decision" },
  QUOTE_SENT: { label: "Confirm Deal" },
};

const ACTION_THEME_MAP = {
  PENDING: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400",
  RFQ_READY: "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400",
  TL_REVIEW: "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400",
  ADMIN_APPROVAL: "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400",
  EMPLOYEE_VERIFY: "bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400",
  CLIENT_FINAL_APPROVAL: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400",
  QUOTE_SENT: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400",
};

function getRoute(inquiryId, buyerName) {
  let hash = 0;
  const str = (inquiryId || "") + (buyerName || "");
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const routes = [
    "Genoa → Singapore",
    "Rotterdam → Dubai",
    "Piraeus → Jeddah",
    "Shanghai → Rotterdam",
    "Shenzhen → New York",
    "Tokyo → Los Angeles",
    "Houston → Antwerp",
    "Busan → Hamburg",
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
  const weightOptions = [8200, 3400, 5000, 12400, 950, 45000, 3200, 18500];
  const index = Math.abs(hash) % weightOptions.length;
  return `${weightOptions[index].toLocaleString()} kg`;
}

function getRelativeTime(dateString) {
  if (!dateString) return "1m ago";
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
  col,
  onView,
  onAction,
  currentUser,
}) {
  const role = currentUser?.role || "Admin";
  const actionCfg = ACTION_MAP[inq.status];

  const isRoleAllowed = (status, roleName) => {
    const rNameLower = roleName?.toLowerCase();
    if (rNameLower === "admin") return true;
    if (rNameLower === "viewer") return false;

    switch (status) {
      case "PENDING":
      case "RFQ_READY":
      case "EMPLOYEE_VERIFY":
      case "QUOTE_SENT":
        return rNameLower === "employee" || rNameLower === "team lead";
      case "TL_REVIEW":
        return rNameLower === "team lead";
      case "CLIENT_QUOTING":
      case "CLIENT_FINAL_APPROVAL":
        return rNameLower === "client";
      case "ADMIN_APPROVAL":
        return false;
      default:
        return false;
    }
  };

  const canAct = actionCfg && isRoleAllowed(inq.status, role);

  const route = getRoute(inq.inquiry_id, inq.buyer_name);
  const weight = getWeight(inq.products, inq.inquiry_id);
  const relativeTime = getRelativeTime(inq.date_received || inq.createdAt);
  const leftBorderCls = col?.leftBorderCls || "border-l-4 border-l-amber-600";

  return (
    <div
      onClick={() => onView(inq)}
      className={`group bg-white dark:bg-[#181b22] border border-[#e6e0d2] dark:border-[#2a2d33] ${leftBorderCls} rounded-xl p-3.5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-2 cursor-pointer relative`}
    >
      {/* Ref ID */}
      <span className="text-[11px] font-bold text-[#94a3b8] dark:text-gray-400 font-mono tracking-wider">
        {inq.inquiry_id}
      </span>

      {/* Buyer / Customer name */}
      <h4 className="text-sm font-bold text-[#1e293b] dark:text-white leading-tight">
        {inq.buyer_name}
      </h4>

      {/* Route / Vessel */}
      <div className="text-xs text-[#64748b] dark:text-gray-400 font-medium">
        {route}
      </div>

      {/* Footer: Weight & Time */}
      <div className="flex items-center justify-between text-xs text-[#64748b] dark:text-gray-400 font-medium pt-2.5 border-t border-[#f4efe6] dark:border-[#2a2d33]/50 mt-1">
        <span>{weight}</span>
        <span className="text-[#94a3b8] dark:text-gray-400 font-medium">{relativeTime}</span>
      </div>

      {/* Quick Action Button */}
      {canAct && (
        <div
          className="pt-1"
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
      className={`flex-shrink-0 w-[275px] min-w-[275px] h-full flex flex-col bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] ${col.topBorderCls} rounded-2xl p-3 shadow-sm transition-all duration-150`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#eee8dd] dark:border-[#2a2d33]/50">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dotCls}`} />
          <span className="text-sm font-bold text-[#1e293b] dark:text-white leading-tight">
            {col.label}
          </span>
        </div>

        <span className="text-xs font-bold text-[#64748b] dark:text-gray-400 w-6 h-6 rounded-full bg-[#f4efe6] dark:bg-[#15181e] border border-[#e6e0d2] dark:border-[#2a2d33] flex items-center justify-center">
          {cards.length}
        </span>
      </div>

      {/* Column Cards Container */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-0.5">
        <div className="flex flex-col gap-3 pb-4">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-3 rounded-xl border border-dashed border-[#e6e0d2] dark:border-[#2a2d33] text-gray-400 text-xs font-medium">
              No items
            </div>
          ) : (
            cards.map((inq) => (
              <KanbanCard
                key={inq.inquiry_id || inq.id}
                inq={inq}
                col={col}
                onView={onView}
                onAction={onAction}
                currentUser={currentUser}
              />
            ))
          )}
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

  const activeStages = KANBAN_COLUMNS.filter(
    (c) => (grouped[c.id]?.length || 0) > 0
  ).length || 3;

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

      {/* Scroll indicator footer matching reference image */}
      {/* <div className="flex-shrink-0 flex items-center justify-between pt-3 text-xs text-[#94a3b8] dark:text-gray-400 font-medium">
        <span>
          Showing {activeStages} of {KANBAN_COLUMNS.length} pipeline stages — scroll or drag to see RFQ received, client quoting, verify, final approval, closed &rarr;
        </span>

        <button
          type="button"
          onClick={() => scrollBoard("right")}
          className="w-8 h-8 rounded-full bg-white dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] flex items-center justify-center text-[#1e293b] dark:text-white shadow-sm hover:shadow-md transition-all ml-2 flex-shrink-0 font-bold"
          title="Scroll right"
        >
          &gt;
        </button>
      </div> */}
    </div>
  );
}