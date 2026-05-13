import React, { useState } from "react";
import { Bell, CheckCircle, Info, AlertTriangle, MessageSquare, Trash2, Check } from "lucide-react";
import { mockNotifications } from "../data/mockNotifications";

const typeStyles = {
  inquiry: { icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
  "purchase-order": { icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  document: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  supply: { icon: CheckCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
  system: { icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-500/10" },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications);

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Stay updated with your latest activities</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10 transition-all shadow-sm"
          >
            <Check size={16} />
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161922] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-xl">
        {notifications.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-white/5">
            {notifications.map((notif) => {
              const Style = typeStyles[notif.type] || typeStyles.system;
              const Icon = Style.icon;

              return (
                <div 
                  key={notif.id}
                  className={`p-6 flex items-start gap-4 transition-all hover:bg-gray-50 dark:hover:bg-white/[0.02] group ${notif.isRead ? 'opacity-70' : 'relative'}`}
                >
                  {!notif.isRead && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-500 rounded-r-full" />
                  )}
                  
                  <div className={`w-12 h-12 flex-shrink-0 rounded-2xl ${Style.bg} flex items-center justify-center`}>
                    <Icon className={`${Style.color} w-6 h-6`} />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-bold ${notif.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white text-lg'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{notif.time}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-2xl">
                      {notif.message}
                    </p>
                    <div className="pt-2 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button 
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1"
                        >
                          <Check size={14} />
                          Mark as read
                        </button>
                      )}
                      <button 
                        onClick={() => deleteNotification(notif.id)}
                        className="text-xs font-bold text-rose-500 hover:text-rose-400 flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-20 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
              <Bell size={40} className="text-gray-300 dark:text-gray-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">No notifications</h3>
              <p className="text-gray-500 dark:text-gray-400">You're all caught up! Check back later.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
