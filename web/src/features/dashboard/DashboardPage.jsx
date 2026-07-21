import { useAuth } from '@context';
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { api } from '@services/api';
import { formatINR } from '@services/marginEngine';
import StatusBadge from '@components/ui/statusBadge';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

/* ── Time-based Greeting Helper ──────────────────────────────────── */
function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) {
    return "Good morning";
  } else if (hour >= 12 && hour < 17) {
    return "Good afternoon";
  } else {
    return "Good evening";
  }
}

/* ── Skeleton loader ─────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col w-full h-full pb-4 gap-6 animate-pulse p-2">
      <div className="h-14 w-64 bg-[#e8e2d5]/50 dark:bg-[#242830] rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#faf8f5] dark:bg-[#242830] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl h-[100px] opacity-60"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-[#faf8f5] dark:bg-[#242830] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl h-[280px] opacity-60" />
        <div className="lg:col-span-5 bg-[#faf8f5] dark:bg-[#242830] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl h-[280px] opacity-60" />
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ value, label, topBorderClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] ${topBorderClass} rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-98`}
    >
      <div className="text-3xl font-bold text-[#1e293b] dark:text-white mb-2 leading-none tracking-tight">
        {value}
      </div>
      <div className="text-[#64748b] dark:text-gray-400 text-[11px] font-bold tracking-wider uppercase">
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reports.getDashboardStats();
      if (res.success) {
        setStats(res.data);
      } else {
        setError("Error loading data.");
      }
    } catch (e) {
      console.error(e);
      setError("Error loading data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayCount = stats?.inquiriesToday ?? 0;
  const quotesSentCount = stats?.quotesSent ?? 0;
  const pendingCount = stats?.pendingReplies ?? 0;
  const profitToday = formatINR(stats?.profitToday ?? 0);
  const latestInquiries = stats?.recentInquiries || [];

  const weeklyData = useMemo(() => {
    if (!stats?.weeklyTrend || !Array.isArray(stats.weeklyTrend) || stats.weeklyTrend.length === 0) {
      return [];
    }
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const parsed = stats.weeklyTrend.map(item => {
      const d = new Date(item.date);
      const dayName = !isNaN(d.getDay()) ? dayNames[d.getDay()] : (item.day || item.date || "Day");
      return {
        day: dayName,
        profit: Number(item.profit) || 0
      };
    });

    const maxProfit = Math.max(...parsed.map(p => p.profit), 0);

    return parsed.map(p => ({
      ...p,
      height: maxProfit > 0 ? `${Math.max(15, Math.round((p.profit / maxProfit) * 100))}%` : '15%',
      isBest: maxProfit > 0 && p.profit === maxProfit
    }));
  }, [stats]);

  const bestDayItem = useMemo(() => {
    if (!weeklyData.length) return null;
    const max = weeklyData.reduce((best, curr) => (curr.profit > (best?.profit || -1) ? curr : best), null);
    return max && max.profit > 0 ? max : null;
  }, [weeklyData]);

  if (loading) return <DashboardSkeleton />;

  const userName = currentUser?.name?.split(' ')[0] || currentUser?.first_name || 'User';

  return (
    <div className="flex flex-col w-full h-full pb-6 space-y-4">
      {/* Header Greeting */}
      <div>
        <h1 className="text-3xl font-serif font-medium text-[#1e293b] dark:text-white tracking-tight">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-sm font-sans font-medium text-[#64748b] dark:text-gray-400 mt-1">
          Here's how the ledger is moving today.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={todayCount}
          label="INQUIRIES TODAY"
          topBorderClass="border-t-4 border-t-[#1e40af]"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "All", date: "today" } })
          }
        />
        <StatCard
          value={quotesSentCount}
          label="QUOTES SENT"
          topBorderClass="border-t-4 border-t-[#16a34a]"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "QUOTE_SENT_ONLY" } })
          }
        />
        <StatCard
          value={pendingCount}
          label="PENDING REPLIES"
          topBorderClass="border-t-4 border-t-[#b8832a]"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "PENDING_REPLIES" } })
          }
        />
        <StatCard
          value={profitToday}
          label="PROFIT TODAY"
          topBorderClass="border-t-4 border-t-[#b8832a]"
          onClick={() => navigate("/profit")}
        />
      </div>

      {/* Content Row: Recent Inquiries + Profit This Week */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Recent Inquiries Table */}
        <section className="lg:col-span-7 flex flex-col bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6e0d2] dark:border-[#2a2d33]">
            <h2 className="text-[#1e293b] dark:text-white font-serif text-[17px] font-bold tracking-tight">
              Recent inquiries
            </h2>
            <button
              onClick={() => navigate("/inquiries")}
              className="text-[#0f6460] dark:text-teal-400 text-xs font-bold hover:underline transition-colors flex items-center gap-1"
            >
              View all &rarr;
            </button>
          </div>
          <div className="flex-1 w-full overflow-x-auto">
            {latestInquiries.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500 font-medium">
                No recent inquiries
              </div>
            ) : (
              <DataTable
                columns={[
                  { key: "id", label: "REF" },
                  { key: "buyer", label: "BUYER" },
                  { key: "vessel", label: "VESSEL" },
                  { key: "status", label: "STATUS" },
                  { key: "actions", label: "", className: "text-right" }
                ]}
                data={latestInquiries}
                emptyMessage="No recent inquiries"
                renderRow={(inq, idx) => (
                  <tr
                    key={inq.inquiry_id || idx}
                    className={`${rowStripeClass(idx, inq)} ${ROW_HOVER_CLS}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-[#0f6460] dark:text-teal-400 text-xs font-medium cursor-pointer" onClick={() => navigate("/inquiries")}>
                      {inq.inquiry_id}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#1e293b] dark:text-gray-200 text-sm">
                      {inq.buyer_name}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-[#1e293b] dark:text-gray-200 text-sm">
                      {inq.vesselName || "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={inq.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => navigate("/inquiries")}
                        className="text-[#0f6460] dark:text-teal-400 font-bold text-sm hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                )}
              />
            )}
          </div>
        </section>

        {/* Profit This Week Bar Chart */}
        <section className="lg:col-span-5 bg-[#faf8f5] dark:bg-[#1a1d23] border border-[#e6e0d2] dark:border-[#2a2d33] rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[300px]">
          <h2 className="text-[#1e293b] dark:text-white font-serif text-[17px] font-bold tracking-tight mb-4">
            Profit this week
          </h2>

          {weeklyData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm font-medium py-12">
              No profit data for this week
            </div>
          ) : (
            <>
              <div className="flex items-end justify-between h-[150px] pt-4 px-2 border-b border-[#e6e0d2] dark:border-[#2a2d33] pb-3 gap-3">
                {weeklyData.map((item, idx) => (
                  <div key={item.day + idx} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end">
                    <div
                      className={`w-full rounded-lg transition-all duration-300 ${item.isBest ? 'bg-[#b8832a]' : 'bg-[#0d6e6e]'
                        }`}
                      style={{ height: item.height }}
                      title={`${item.day}: ${formatINR(item.profit)} profit`}
                    />
                    <span className="text-[11px] text-[#64748b] dark:text-gray-400 font-medium">
                      {item.day}
                    </span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-[#64748b] dark:text-gray-400 font-medium mt-4">
                {bestDayItem ? (
                  <>Best day: <span className="font-bold text-[#1e293b] dark:text-white">{bestDayItem.day}, {formatINR(bestDayItem.profit)} profit</span></>
                ) : (
                  <span>No profit recorded this week</span>
                )}
              </div>
            </>
          )}
        </section>

      </div>
    </div>
  );
}
