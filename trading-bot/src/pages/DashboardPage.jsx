import React, { useState, useEffect, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { fetchInquiries } from "../services/n8nService";
import { fetchProfitData } from "../services/sheetsService";
import { formatINR, formatDateString } from "../services/marginEngine";
import StatusBadge from "../components/ui/StatusBadge";

/* ── Skeleton loader ─────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col w-full h-full pb-8 gap-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-[#242830] border border-[#2a2d33] rounded-xl h-[118px] opacity-40"
          />
        ))}
      </div>
      <div className="flex gap-6 flex-1">
        <div className="w-[65%] bg-[#242830] border border-[#2a2d33] rounded-xl h-[300px] opacity-40" />
        <div className="w-[40%] bg-[#242830] border border-[#2a2d33] rounded-xl h-[300px] opacity-40" />
      </div>
    </div>
  );
}

/* ── Stat card ───────────────────────────────────────────────────── */
function StatCard({ value, label, colorClass, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`${colorClass} rounded-xl p-6 transition-all hover:-translate-y-1 cursor-pointer shadow-lg active:scale-95`}
    >
      <div className="text-[36px] font-bold leading-none mb-2">{value}</div>
      <div className="text-gray-400 text-sm font-semibold tracking-wide uppercase">
        {label}
      </div>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const { setInquiriesData } = useContext(AppContext);

  const [inquiries, setInquiries] = useState([]);
  const [profitData, setProfitData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    isRefresh ? setIsRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [inqRes, profRes] = await Promise.all([
        fetchInquiries(),
        fetchProfitData(),
      ]);
      const inq = inqRes || [];
      setInquiries(inq);
      setInquiriesData(inq);
      setProfitData(profRes || { closedDeals: [], weeklyTrend: [] });
    } catch {
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

  const { todayCount, pendingCount, quotesSentCount, profitToday } =
    useMemo(() => {
      const todayStr = new Date().toISOString().split("T")[0];
      let today = 0,
        pending = 0,
        quotes = 0,
        pToday = 0;
      inquiries.forEach((inq) => {
        if (inq.date_received?.startsWith(todayStr)) today++;
        if (["PENDING", "RFQ_SENT"].includes(inq.status)) pending++;
        if (["QUOTE_SENT", "CLOSED"].includes(inq.status)) quotes++;
      });
      if (profitData?.closedDeals) {
        pToday = profitData.closedDeals
          .filter((d) => d.date_closed?.startsWith(todayStr))
          .reduce((sum, d) => sum + d.profit, 0);
      }
      return {
        todayCount: today,
        pendingCount: pending,
        quotesSentCount: quotes,
        profitToday: pToday,
      };
    }, [inquiries, profitData]);

  const latestInquiries = useMemo(
    () =>
      [...inquiries]
        .sort((a, b) => new Date(b.date_received) - new Date(a.date_received))
        .slice(0, 5),
    [inquiries],
  );

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="flex flex-col w-full h-full pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
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
          className="flex items-center gap-2 px-4 py-2 bg-[#242830] hover:bg-[#2a2d33] border border-[#2a2d33] rounded-lg text-sm text-gray-300 font-medium transition-colors disabled:opacity-50"
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
      <div className="grid grid-cols-4 gap-4 mb-2">
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

      <p className="text-right text-xs text-gray-500 mb-6 font-medium">
        Last updated: {lastUpdated}
      </p>

      {/* Content row */}
      <div className="flex gap-6 mt-2">
        {/* Recent inquiries table */}
        <section className="w-[65%] flex flex-col bg-[#1a1d23] border border-[#2a2d33] rounded-xl shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2d33]">
            <h2 className="text-white text-[16px] font-bold tracking-wide">
              Recent Inquiries
            </h2>
            <button
              onClick={() => navigate("/inquiries")}
              className="text-purple-400 text-[13px] font-bold hover:text-purple-300 transition-colors"
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
              <table className="w-full text-left text-sm text-gray-300 whitespace-nowrap">
                <thead className="bg-[#242830]/50 text-gray-400 font-medium text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Inquiry ID</th>
                    <th className="px-6 py-3">Buyer</th>
                    <th className="px-6 py-3 w-1/3">Products</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2a2d33]/50">
                  {latestInquiries.map((inq, idx) => (
                    <tr
                      key={inq.inquiry_id}
                      className={`hover:bg-white/[0.03] transition-colors ${idx % 2 !== 0 ? "bg-[#242830]/30" : ""}`}
                    >
                      <td className="px-6 py-4 font-mono text-purple-300 text-xs">
                        {inq.inquiry_id}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-200">
                        {inq.buyer_name}
                      </td>
                      <td
                        className="px-6 py-4 truncate max-w-[200px]"
                        title={inq.products
                          ?.map((p) => p.product_name)
                          .join(", ")}
                      >
                        {inq.products?.length === 1
                          ? inq.products[0].product_name
                          : `${inq.products?.[0]?.product_name} +${(inq.products?.length ?? 1) - 1} more`}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={inq.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-medium">
                        {formatDateString(inq.date_received)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Weekly profit chart */}
        <section className="w-[40%] flex flex-col bg-[#1a1d23] border border-[#2a2d33] rounded-xl flex-shrink-0 p-6 shadow-lg">
          <h2 className="text-white text-[16px] font-bold tracking-wide mb-6">
            Profit This Week
          </h2>
          <div className="w-full h-[220px]">
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
                  cursor={{ fill: "#2a2d33" }}
                  contentStyle={{
                    backgroundColor: "#0f1117",
                    borderColor: "#2a2d33",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "13px",
                  }}
                  itemStyle={{ color: "#a855f7", fontWeight: "bold" }}
                  labelStyle={{ color: "#9ca3af", marginBottom: "4px" }}
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
        </section>
      </div>
    </div>
  );
}
