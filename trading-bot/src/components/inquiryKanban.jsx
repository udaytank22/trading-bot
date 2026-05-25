import React, { useState, useRef, useCallback, useMemo } from "react";

/* ── Workflow column order ───────────────────────────────────────── */
export const KANBAN_COLUMNS = [
  {
    id: "PENDING",
    label: "Pending",
    headerCls:
      "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20",
    dotCls: "bg-amber-400",
    countCls:
      "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400",
    dropCls: "ring-2 ring-amber-400/60 bg-amber-50/50 dark:bg-amber-500/5",
  },
  {
    id: "RFQ_READY",
    label: "RFQ Ready",
    headerCls:
      "bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20",
    dotCls: "bg-purple-400",
    countCls:
      "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400",
    dropCls: "ring-2 ring-purple-400/60 bg-purple-50/50 dark:bg-purple-500/5",
  },
  {
    id: "CLIENT_QUOTING",
    label: "Client Quoting",
    headerCls:
      "bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20",
    dotCls: "bg-cyan-400",
    countCls:
      "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-400",
    dropCls: "ring-2 ring-cyan-400/60 bg-cyan-50/50 dark:bg-cyan-500/5",
  },
  {
    id: "TL_REVIEW",
    label: "TL Review",
    headerCls:
      "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20",
    dotCls: "bg-rose-400",
    countCls:
      "bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400",
    dropCls: "ring-2 ring-rose-400/60 bg-rose-50/50 dark:bg-rose-500/5",
  },
  {
    id: "ADMIN_APPROVAL",
    label: "Admin Approval",
    headerCls:
      "bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20",
    dotCls: "bg-orange-400",
    countCls:
      "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400",
    dropCls: "ring-2 ring-orange-400/60 bg-orange-50/50 dark:bg-orange-500/5",
  },
  {
    id: "EMPLOYEE_VERIFY",
    label: "Employee Verify",
    headerCls:
      "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20",
    dotCls: "bg-sky-400",
    countCls:
      "bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400",
    dropCls: "ring-2 ring-sky-400/60 bg-sky-50/50 dark:bg-sky-500/5",
  },
  {
    id: "CLIENT_FINAL_APPROVAL",
    label: "Client Decision",
    headerCls:
      "bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20",
    dotCls: "bg-violet-400",
    countCls:
      "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-400",
    dropCls: "ring-2 ring-violet-400/60 bg-violet-50/50 dark:bg-violet-500/5",
  },
  {
    id: "QUOTE_SENT",
    label: "Quoted",
    headerCls:
      "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20",
    dotCls: "bg-emerald-400",
    countCls:
      "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400",
    dropCls:
      "ring-2 ring-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-500/5",
  },
  {
    id: "CONFIRMED",
    label: "Confirmed",
    headerCls:
      "bg-teal-50 dark:bg-teal-500/10 border-teal-200 dark:border-teal-500/20",
    dotCls: "bg-teal-400",
    countCls:
      "bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400",
    dropCls: "ring-2 ring-teal-400/60 bg-teal-50/50 dark:bg-teal-500/5",
  },
  {
    id: "CLOSED",
    label: "Closed",
    headerCls:
      "bg-gray-100 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20",
    dotCls: "bg-gray-400",
    countCls:
      "bg-gray-200 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400",
    dropCls: "ring-2 ring-gray-400/60 bg-gray-50/50 dark:bg-gray-500/5",
  },
];

const ACTION_MAP = {
  PENDING: {
    label: "Check Stock",
    color:
      "border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10",
  },
  RFQ_READY: {
    label: "Create RFQ",
    color:
      "border-blue-500/40 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10",
  },
  CLIENT_QUOTING: {
    label: "Quote Prices",
    color:
      "border-cyan-500/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10",
  },
  TL_REVIEW: {
    label: "Set Margin",
    color:
      "border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10",
  },
  ADMIN_APPROVAL: {
    label: "Approve",
    color:
      "border-orange-500/40 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10",
  },
  EMPLOYEE_VERIFY: {
    label: "Verify & Quote",
    color:
      "border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10",
  },
  CLIENT_FINAL_APPROVAL: {
    label: "Final Decision",
    color:
      "border-violet-500/40 text-violet-600 dark:text-violet-400 hover:bg-violet-500/10",
  },
  QUOTE_SENT: {
    label: "Confirm Deal",
    color:
      "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10",
  },
};

const ROLE_GATES = {
  PENDING: ["Sales Executive", "Sourcing Manager", "Admin", "Administrator"],
  RFQ_READY: ["Sales Executive", "Sourcing Manager", "Admin", "Administrator"],
  CLIENT_QUOTING: ["Client", "Admin", "Administrator"],
  TL_REVIEW: ["Sourcing Manager", "Admin", "Administrator"],
  ADMIN_APPROVAL: ["Admin", "Administrator"],
  EMPLOYEE_VERIFY: ["Sales Executive", "Sourcing Manager", "Admin", "Administrator"],
  CLIENT_FINAL_APPROVAL: ["Client", "Admin", "Administrator"],
  QUOTE_SENT: ["Admin", "Administrator", "Sales Executive"],
};

function formatDate(iso) {
  if (!iso) return "—";

  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}



function KanbanCard({
  inq,
  onView,
  onAction,
  currentUser,
}) {
  const role = currentUser?.role || "Admin";
  const isAdmin = role === "Admin" || role === "Administrator";
  const actionCfg = ACTION_MAP[inq.status];
  const gates = ROLE_GATES[inq.status] || [];
  const canAct = actionCfg && (isAdmin || gates.includes(role));

  const totalValue =
    inq.my_quote?.products?.reduce((s, p) => s + (p.total_price || 0), 0) ??
    null;

  return (
    <div
      onClick={() => onView(inq)}
      className="group relative bg-white dark:bg-[#1e2128] border rounded-xl p-3.5 shadow-sm transition-all duration-200 flex flex-col gap-2.5 border-gray-100 dark:border-[#2a2d33] hover:shadow-md hover:border-purple-300 dark:hover:border-purple-500/40 cursor-pointer"
    >

      <div className="flex items-start justify-between gap-2 pr-5">
        <span className="font-mono text-[11px] font-bold text-purple-600 dark:text-purple-400 leading-tight truncate">
          {inq.inquiry_id}
        </span>
        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
          {formatDate(inq.date_received)}
        </span>
      </div>

      <div>
        <p className="text-[12px] font-bold text-gray-900 dark:text-white leading-tight line-clamp-1">
          {inq.buyer_name}
        </p>

        {inq.vessel_name && (
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
            ⚓ {inq.vessel_name}
            {inq.vessel_ref ? ` · ${inq.vessel_ref}` : ""}
          </p>
        )}
      </div>

      {inq.products?.length > 0 && (
        <div className="flex flex-col gap-1">
          {inq.products.slice(0, 2).map((p, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0" />
              <span className="text-[11px] text-gray-600 dark:text-gray-400 line-clamp-1">
                {p.product_name}
                {p.quantity ? ` · ${p.quantity} ${p.unit || ""}` : ""}
              </span>
            </div>
          ))}

          {inq.products.length > 2 && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-2.5">
              +{inq.products.length - 2} more items
            </span>
          )}
        </div>
      )}

      {totalValue != null && totalValue > 0 && (
        <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100 dark:border-[#2a2d33]">
          <span className="text-[10px] text-gray-400 font-medium">Quote</span>
          <span className="text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            $
            {totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      )}

      {canAct && (
        <div
          className="pt-1"
          onClick={(e) => {
            e.stopPropagation();
            onAction(inq, inq.status);
          }}
        >
          <button
            className={`w-full text-[11px] font-bold px-3 py-1.5 rounded-lg border transition-all ${actionCfg.color}`}
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
      className="flex-shrink-0 w-[240px] h-full min-h-0 flex flex-col rounded-xl transition-all duration-150"
    >
      <div
        className={`flex-shrink-0 flex items-center justify-between px-3 py-2.5 rounded-xl border mb-3 ${col.headerCls}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dotCls}`} />
          <span className="text-[12px] font-bold text-gray-700 dark:text-gray-200 leading-tight truncate">
            {col.label}
          </span>
        </div>

        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${col.countCls}`}
        >
          {cards.length}
        </span>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 pb-8 custom-scrollbar">
        <div className="flex flex-col gap-2.5 pb-4">
          {cards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 px-3 rounded-xl border-2 border-dashed border-gray-100 dark:border-[#2a2d33] text-gray-300 dark:text-gray-600">
              <svg
                className="w-6 h-6 mb-1.5"
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

              <span className="text-[11px] font-medium">Empty</span>
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
      left: direction === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  const totalCards = items.length;

  const activeStages = KANBAN_COLUMNS.filter(
    (c) => grouped[c.id]?.length > 0
  ).length;

  return (
    <div className="w-full h-full min-h-0 overflow-hidden flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-between gap-3 mb-3 px-1">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
            {totalCards} {totalCards === 1 ? "inquiry" : "inquiries"} across{" "}
            {activeStages} stages
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => scrollBoard("left")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-100 dark:hover:bg-[#242830] transition-all"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => scrollBoard("right")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 dark:border-[#2a2d33] bg-white dark:bg-[#1a1d23] hover:bg-gray-100 dark:hover:bg-[#242830] transition-all"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <div
          ref={boardRef}
          className="h-full w-full overflow-x-auto overflow-y-hidden custom-scrollbar scroll-smooth"
        >
          <div className="flex h-full w-max gap-3 pb-3 pr-4">
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
    </div>
  );
}