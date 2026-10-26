import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Bell, Clock, ArrowUpRight, Megaphone } from 'lucide-react';

export const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notices, setNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const res = await api.get('/notices');
        const list = res.data.data || [];
        setNotices(list.slice(0, 5));
        setUnreadCount(list.length);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotices();
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setUnreadCount(0);
        }}
        className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors relative"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">Campus Alerts</h3>
            </div>
            <Link
              to="/notices"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5"
            >
              View All <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notices.length > 0 ? (
              notices.map((n) => (
                <div key={n._id} className="p-3.5 hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        n.priority === 'Urgent'
                          ? 'bg-rose-100 text-rose-700'
                          : n.priority === 'Important'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {n.priority}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{n.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{n.content}</p>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No new announcements.</div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notices"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-slate-600 hover:text-indigo-600 block py-1"
            >
              Go to Announcement Board →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
