import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Clock, AlertTriangle, ShieldCheck, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotificationsModal({ isOpen, onClose }) {
  const { fetchNotificationCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      fetchNotificationCount();
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      fetchNotificationCount();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      fetchNotificationCount();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Notifications & Expiry Alerts</h3>
              <p className="text-xs text-slate-500">Statutory verification reminders & status updates</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading alerts...</div>
          ) : notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <ShieldCheck className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-medium text-slate-600">No notifications yet</p>
              <p className="text-xs text-slate-400">You're all caught up with your instruments</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif._id}
                className={`py-3.5 px-3 rounded-xl transition-all my-1 flex gap-3.5 items-start ${
                  notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/60 border border-blue-100/80 shadow-sm'
                }`}
              >
                <div className={`p-2 rounded-lg mt-0.5 ${
                  notif.type === 'expiry_alert' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {notif.type === 'expiry_alert' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 text-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-800">{notif.title || 'Notification'}</h4>
                    <span className="text-[11px] text-slate-400">
                      {new Date(notif.sentAt || notif.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs mt-1 leading-relaxed">{notif.message}</p>
                  
                  <div className="mt-2.5 flex items-center gap-3">
                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif._id)}
                        className="text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark as read
                      </button>
                    )}
                    {notif.relatedApplicationId && (
                      <Link
                        to={`/applications/${notif.relatedApplicationId}`}
                        onClick={onClose}
                        className="text-xs font-medium text-slate-700 hover:text-blue-700 underline"
                      >
                        View Application &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between text-xs">
            <span className="text-slate-500">{notifications.filter(n => !n.read).length} unread alerts</span>
            <button
              onClick={markAllAsRead}
              className="text-blue-700 hover:text-blue-900 font-semibold px-2 py-1 rounded hover:bg-blue-50"
            >
              Mark all as read
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
