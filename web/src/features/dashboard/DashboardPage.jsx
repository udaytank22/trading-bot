import { DashboardPageSchema1 } from '@config/tableSchemas';
import { useAuth, useUI, useData } from '@context';
import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from '@services/api';
import { formatINR, formatDateString } from '@services/marginEngine';
import StatusBadge from '@components/ui/statusBadge';
import { DataTable, rowStripeClass, ROW_HOVER_CLS } from '@components/ui';

/* ── Skeleton loader ─────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col w-full h-full pb-4 gap-4 animate-pulse">
      <div className="grid grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-gray-100 dark:bg-[#242830] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-[80px] opacity-40"
          />
        ))}
      </div>
      <div className="flex gap-4 flex-1">
        <div className="w-[65%] bg-gray-100 dark:bg-[#242830] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-[240px] opacity-40" />
        <div className="w-[35%] bg-gray-100 dark:bg-[#242830] border border-gray-200 dark:border-[#2a2d33] rounded-lg h-[240px] opacity-40" />
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ value, label, colorClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${colorClass} rounded-lg p-4 transition-all hover:-translate-y-0.5 cursor-pointer shadow-sm active:scale-95`}
    >
      <div className="text-[22px] font-bold leading-none mb-1">{value}</div>
      <div className="text-gray-500 dark:text-gray-400 text-[11px] font-semibold tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setLoading(true);
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
      setLastUpdated(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const todayCount = stats?.inquiriesToday ?? 0;
  const quotesSentCount = stats?.quotesSent ?? 0;
  const pendingCount = stats?.pendingReplies ?? 0;
  const profitToday = stats?.profitToday ?? 0;
  const latestInquiries = stats?.recentInquiries ?? [];

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col w-full h-full pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          {error && (
            <p className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 text-sm font-medium">
              {error}
            </p>
          )}
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#242830] hover:bg-gray-50 dark:hover:bg-[#2a2d33] border border-gray-200 dark:border-[#2a2d33] rounded-lg text-sm text-gray-700 dark:text-gray-300 font-medium transition-colors disabled:opacity-50 shadow-sm"
        >
          <svg
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-purple-400" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-3 mb-1">
        <StatCard
          value={todayCount}
          label="Total Inquiries Today"
          colorClass="bg-blue-500/10 border border-blue-500/20 text-blue-500   hover:bg-blue-500/20"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "All", date: "today" } })
          }
        />
        <StatCard
          value={quotesSentCount}
          label="Quotes Sent"
          colorClass="bg-green-500/10 border border-green-500/20 text-green-500  hover:bg-green-500/20"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "QUOTE_SENT_ONLY" } })
          }
        />
        <StatCard
          value={pendingCount}
          label="Pending Replies"
          colorClass="bg-amber-500/10 border border-amber-500/20 text-amber-500  hover:bg-amber-500/20"
          onClick={() =>
            navigate("/inquiries", { state: { filter: "PENDING_REPLIES" } })
          }
        />
        <StatCard
          value={formatINR(profitToday)}
          label="Total Profit Today"
          colorClass="bg-purple-500/10 border border-purple-500/20 text-[#a855f7] hover:bg-purple-500/20"
          onClick={() => navigate("/profit")}
        />
      </div>

      <p className="text-right text-xs text-gray-500 mb-3 font-medium">
        Last updated: {lastUpdated}
      </p>

      {/* Content row */}
      <div className="flex gap-4 mt-0">
        {/* Recent inquiries table */}
        <section className="flex flex-col flex-1 bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg shadow-sm overflow-hidden transition-colors duration-300">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-[#2a2d33]">
            <h2 className="text-gray-900 dark:text-white text-[13px] font-bold tracking-wide">
              Recent Inquiries
            </h2>
            <button
              onClick={() => navigate("/inquiries")}
              className="text-purple-400 text-[11px] font-bold hover:text-purple-300 transition-colors"
            >
              View All
            </button>
          </div>
          <div className="flex-1 w-full overflow-x-auto">
            {latestInquiries.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500">
                No recent inquiries
              </div>
            ) : (
              <DataTable
                columns={DashboardPageSchema1}
                data={latestInquiries}
                emptyMessage="No recent inquiries"
                renderRow={(inq, idx) => (
                  <tr
                    key={inq.inquiry_id}
                    className={`${rowStripeClass(idx)} ${ROW_HOVER_CLS}`}
                  >
                    <td className="px-5 py-3 font-medium text-purple-600 dark:text-purple-400 font-mono">{(1 - 1) * 10 + idx + 1}</td>
                    <td className="px-4 py-2.5 font-mono text-purple-600 dark:text-purple-300 text-[11px]">
                      {inq.inquiry_id}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-200">
                      {inq.buyer_name}
                    </td>
                    <td
                      className="px-4 py-2.5 truncate max-w-[160px]"
                      title={inq.products?.map((p) => p.product_name).join(", ")}
                    >
                      {inq.products?.length === 1
                        ? inq.products[0].product_name
                        : `${inq.products?.[0]?.product_name} +${(inq.products?.length ?? 1) - 1} more`}
                    </td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={inq.status} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 font-medium">
                      {formatDateString(inq.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => navigate(`/inquiries/${inq.id}`)}
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold text-xs tracking-wide transition-colors"
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

        {/* Weekly profit chart */}
        {/* <section className="w-[35%] flex flex-col bg-white dark:bg-[#1a1d23] border border-gray-200 dark:border-[#2a2d33] rounded-lg flex-shrink-0 p-4 shadow-sm transition-colors duration-300">
          <h2 className="text-gray-900 dark:text-white text-[13px] font-bold tracking-wide mb-3">
            Profit This Week
          </h2>
          <div className="w-full h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={profitData?.weeklyTrend ?? []}
                margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
              >
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickMargin={12}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(v) => `₹${v / 1000}k`}
                  tickMargin={8}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{
                    backgroundColor: "var(--tw-bg-opacity, #fff)",
                    borderColor: "var(--tw-border-opacity, #e5e7eb)",
                    borderRadius: "8px",
                    color: "inherit",
                    fontSize: "13px",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "#a855f7", fontWeight: "bold" }}
                  labelStyle={{ color: "#6b7280", marginBottom: "4px" }}
                  formatter={(v) => [formatINR(v), "Profit"]}
                />
                <Bar
                  dataKey="profit"
                  fill="#a855f7"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section> */}
      </div>
    </div>
  );
}
