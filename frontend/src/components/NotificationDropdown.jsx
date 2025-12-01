import React, { useEffect, useState } from "react";
import { Bell, Heart, MessageSquare, UserPlus, X, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { getSocket } from "../utils/socket";

export default function NotificationDropdown({ open, onClose }) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Helper to get styled icon based on type
  const getIcon = (type) => {
    switch (type) {
      case "like":
        return { icon: <Heart size={16} className="text-red-500 fill-red-500" />, bg: "bg-red-50" };
      case "comment":
        return { icon: <MessageSquare size={16} className="text-blue-500 fill-blue-500" />, bg: "bg-blue-50" };
      case "follow":
      case "connection":
        return { icon: <UserPlus size={16} className="text-green-600" />, bg: "bg-green-50" };
      case "message":
        return { icon: <MessageSquare size={16} className="text-purple-600" />, bg: "bg-purple-50" };
      default:
        return { icon: <Bell size={16} className="text-gray-600" />, bg: "bg-gray-100" };
    }
  };

  // Load notifications
  useEffect(() => {
    if (!open) return;

    (async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/notifications", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setNotifications(data.notifications.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load notifications", err);
      } finally {
        setTimeout(() => setLoading(false), 300); 
      }
    })();
  }, [open, token]);

  // Real-time listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("notification:new", (notif) => {
      setNotifications((prev) => [notif, ...prev].slice(0, 6));
    });

    return () => socket.off("notification:new");
  }, []);

  if (!open) return null;

  return (
    <div
      className="absolute right-0 mt-3 w-80 bg-white shadow-2xl rounded-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up origin-top-right"
    >
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <h3 className="font-bold text-gray-800 text-sm">Notifications</h3>
        <div className="flex items-center gap-3">
          <button
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
            onClick={() => {
                navigate("/notifications");
                onClose();
            }}
          >
            View all
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex-shrink-0"></div>
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-2.5 bg-gray-100 rounded w-3/4"></div>
                  <div className="h-2 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Bell size={32} className="opacity-20 mb-2"/>
            <p className="text-xs">No notifications yet.</p>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n) => {
                const style = getIcon(n.type);
                return (
                    <div
                        key={n._id}
                        onClick={() => {
                            navigate(n.link || "/notifications");
                            onClose();
                        }}
                        className={`flex gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors relative group border-b border-gray-50 last:border-0
                            ${!n.read ? "bg-blue-50/30" : ""}
                        `}
                    >
                        {/* Unread Dot */}
                        {!n.read && (
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        )}

                        {/* Icon */}
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${style.bg}`}>
                            {style.icon}
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-xs leading-snug truncate-2-lines ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                                {n.message}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                );
            })}
          </div>
        )}
      </div>
      
      {/* Footer hint (Optional) */}
      <div className="bg-gray-50 border-t border-gray-100 p-2 text-center">
         <span className="text-[10px] text-gray-400">Real-time updates active</span>
      </div>
    </div>
  );
}