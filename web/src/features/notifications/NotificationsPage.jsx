import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle, Info, AlertTriangle, MessageSquare, Trash2, Check, RefreshCw, Loader2, ExternalLink } from "lucide-react";
import { getNotifications, markRead as apiMarkRead, markAllRead as apiMarkAllRead, deleteNotification as apiDeleteNotification } from '@services/api/notifications';
import { useSocket } from '@context';
import { PageContainer } from '@components/ui';

const typeStyles = {
  inquiry: { icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
  "purchase-order": { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  document: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  supply: { icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
  system: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
};

const getNormalizedType = (type) => {
  if (!type) return "system";
  const lower = String(type).toLowerCase().replace(/_/g, "-");
  if (typeStyles[lower]) return lower;
  if (lower.includes("inquiry")) return "inquiry";
  if (lower.includes("purchase") || lower.includes("order") || lower.includes("po")) return "purchase-order";
  if (lower.includes("document") || lower.includes("doc")) return "document";
  if (lower.includes("supply") || lower.includes("stock") || lower.includes("inventory")) return "supply";
  return "system";
};

const getNotificationTargetUrl = (notif) => {
  if (!notif) return null;

  if (notif.link) return notif.link;

  const moduleName = (notif.relatedModule || notif.type || '').toLowerCase();
  const recordId = notif.relatedRecordId;
  const text = `${notif.title || ''} ${notif.message || ''}`;

  // 1. Check for specific module + recordId
  if (moduleName.includes('inquir') || moduleName.includes('rfq')) {
    if (recordId) return `/inquiries/${recordId}`;
    const match = text.match(/INQ-?(\d+)/i);
    if (match) return `/inquiries/${match[1]}`;
    return '/inquiries';
  }

  if (moduleName.includes('purchase') || moduleName.includes('po') || moduleName.includes('order')) {
    if (recordId) return `/purchase-orders/${recordId}`;
    const match = text.match(/PO-?([A-Za-z0-9-]+)/i);
    if (match) return `/purchase-orders/${match[1]}`;
    return '/purchase-orders';
  }

  if (moduleName.includes('supply') || moduleName.includes('shipment')) {
    if (recordId) return `/supply/${recordId}`;
    return '/supply';
  }

  if (moduleName.includes('invoice')) {
    if (recordId) return `/invoices/${recordId}`;
    const match = text.match(/INV-?([A-Za-z0-9-]+)/i);
    if (match) return `/invoices/${match[1]}`;
    return '/invoices';
  }

  if (moduleName.includes('document')) {
    return '/documents';
  }

  if (moduleName.includes('inventory') || moduleName.includes('stock')) {
    return '/inventory';
  }

  // 2. Check text regexes if type was generic ("system", etc.)
  const inqMatch = text.match(/INQ-?(\d+)/i) || text.match(/inquiry\s+#?(\d+)/i);
  if (inqMatch) return `/inquiries/${inqMatch[1]}`;

  const poMatch = text.match(/PO-?([A-Za-z0-9-]+)/i) || text.match(/purchase order\s+#?([A-Za-z0-9-]+)/i);
  if (poMatch) return `/purchase-orders/${poMatch[1]}`;

  const invMatch = text.match(/INV-?([A-Za-z0-9-]+)/i);
  if (invMatch) return `/invoices/${invMatch[1]}`;

  const lowerText = text.toLowerCase();
  if (lowerText.includes('inquiry') || lowerText.includes('rfq')) return '/inquiries';
  if (lowerText.includes('purchase order')) return '/purchase-orders';
  if (lowerText.includes('supply') || lowerText.includes('cargo') || lowerText.includes('shipping')) return '/supply';
  if (lowerText.includes('invoice')) return '/invoices';
  if (lowerText.includes('document')) return '/documents';

  return null;
};

const formatTime = (timeVal) => {
  if (!timeVal) return "";
  const date = new Date(timeVal);
  if (isNaN(date.getTime())) return String(timeVal);

  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { socket, markOneAsRead, markAllAsRead: contextMarkAllAsRead, setUnreadCount } = useSocket() || {};

  const fetchNotifications = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await getNotifications();
      const list = res?.data || (Array.isArray(res) ? res : []);
      setNotifications(list);
      
      if (setUnreadCount) {
        const unread = list.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error("Failed to fetch notifications list:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen to socket for real-time incoming notifications
  useEffect(() => {
    if (!socket) return;
    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
    };
    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, [socket]);

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => String(n.id) === String(id) ? { ...n, isRead: true } : n));
    if (markOneAsRead) markOneAsRead();
    try {
      await apiMarkRead(id);
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    if (contextMarkAllAsRead) contextMarkAllAsRead();
    try {
      await apiMarkAllRead();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (id) => {
    setNotifications(prev => prev.filter(n => String(n.id) !== String(id)));
    try {
      await apiDeleteNotification(id);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
    const targetUrl = getNotificationTargetUrl(notif);
    if (targetUrl) {
      navigate(targetUrl);
    }
  };

  return (
    <PageContainer
      title="Notifications"
      subtitle="Stay updated with your latest activities"
      rightSlot={
        <div className="flex items-center gap-2">
          <button 
            onClick={() => fetchNotifications(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm disabled:opacity-50"
            title="Refresh notifications"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
          <button 
            onClick={markAllAsRead}
            disabled={notifications.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm disabled:opacity-50"
          >
            <Check size={13} />
            Mark all as read
          </button>
        </div>
      }
    >

      {loading ? (
        <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 size={24} className="animate-spin text-purple-500" />
          <p className="text-gray-500 dark:text-gray-400 text-xs">Loading notifications...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {notifications.map((notif) => {
            const normType = getNormalizedType(notif.type);
            const Style = typeStyles[normType] || typeStyles.system;
            const Icon = Style.icon;
            const timeDisplay = formatTime(notif.createdAt || notif.time);
            const targetUrl = getNotificationTargetUrl(notif);

            return (
              <div 
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl flex items-start gap-3 transition-all hover:bg-gray-50 dark:hover:bg-white/[0.04] group relative overflow-hidden shadow-sm ${targetUrl ? 'cursor-pointer hover:border-purple-500/40 dark:hover:border-purple-500/40' : ''} ${notif.isRead ? 'opacity-70' : ''}`}
              >
                {!notif.isRead && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 rounded-l-full" />
                )}
                
                <div className={`w-8 h-8 flex-shrink-0 rounded-lg ${Style.bg} flex items-center justify-center mt-0.5`}>
                  <Icon className={`${Style.color} w-4 h-4`} />
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`font-bold text-[12.5px] truncate flex items-center gap-1.5 ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'} ${targetUrl ? 'group-hover:text-purple-500 dark:group-hover:text-purple-400' : ''}`}>
                      {notif.title}
                      {targetUrl && <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500" />}
                    </h3>
                    <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">{timeDisplay}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {notif.message}
                  </p>
                  <div className="pt-1 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.isRead && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notif.id);
                        }}
                        className="text-[10px] font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1"
                      >
                        <Check size={11} />
                        Mark as read
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                      className="text-[10px] font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
          <div className="w-14 h-14 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
            <Bell size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <div className="space-y-0.5">
            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white">No notifications</h3>
            <p className="text-gray-500 dark:text-gray-400 text-xs">You're all caught up! Check back later.</p>
          </div>
        </div>
      )}
    </PageContainer>
  );
}


