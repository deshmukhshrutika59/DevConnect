
import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { getSocket } from "../utils/socket";
import { useAuth } from "../contexts/AuthContext";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function NotificationBell({ onClick }) {
  const { token } = useAuth();
  const [unread, setUnread] = useState(0);

  // Fetch unread count
  useEffect(() => {
    const loadCount = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/notifications/unread-count`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setUnread(data.count);
      } catch (err) {
        console.error("Failed to load notification count", err);
      }
    };

    loadCount();
  }, [token]);

  // Real-time update
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("notification:count", ({ unread: inc }) => {
      setUnread((prev) => prev + inc);
    });

    return () => socket.off("notification:count");
  }, []);

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-full hover:bg-blue-50 transition-colors group focus:outline-none focus:ring-2 focus:ring-blue-100"
      aria-label="Notifications"
    >
      <Bell 
        className="text-gray-600 group-hover:text-blue-600 transition-colors" 
        size={22} 
        strokeWidth={2}
      />

      {unread > 0 && (
        <span
          className="absolute top-1.5 right-1.5 flex items-center justify-center min-w-[18px] h-[18px] 
          bg-red-500 text-white text-[10px] font-bold rounded-full px-1 border-2 border-white 
          shadow-sm transform translate-x-1/3 -translate-y-1/3 animate-in zoom-in duration-200"
        >
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}