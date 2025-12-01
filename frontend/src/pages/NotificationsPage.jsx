
import React, { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { 
  Bell, 
  CheckCheck, 
  Heart, 
  MessageSquare, 
  UserPlus, 
  Info, 
  Check 
} from "lucide-react";

// Helper to map notification types to Icons and Colors
const getNotificationStyle = (type) => {
  switch (type) {
    case "like":
      return { icon: <Heart size={18} className="text-white fill-white" />, bg: "bg-red-500" };
    case "comment":
      return { icon: <MessageSquare size={18} className="text-white fill-white" />, bg: "bg-blue-500" };
    case "connection":
    case "follow":
      return { icon: <UserPlus size={18} className="text-white" />, bg: "bg-green-500" };
    default:
      return { icon: <Bell size={18} className="text-white" />, bg: "bg-gray-500" };
  }
};

export default function NotificationsPage() {
  const { token } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success || Array.isArray(data)) {
         // Handle both formats just in case backend structure varies
         setNotifs(data.notifications || data); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAll = async () => {
    // Optimistic UI update
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    
    await fetch("http://localhost:5000/api/notifications/mark-all-read", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    load(); // Sync with server
  };

  const markSingleRead = async (id) => {
    // Optimistic UI update
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));

    try {
      await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch(err) {
      console.error("Failed to mark read");
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Notifications
            {notifs.some(n => !n.read) && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {notifs.filter(n => !n.read).length} new
              </span>
            )}
          </h1>
          
          {notifs.length > 0 && notifs.some(n => !n.read) && (
            <button
              onClick={markAll}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
            <div className="space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse"/>)}
            </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
                <Bell size={32} className="text-gray-400" />
            </div>
            <h3 className="text-gray-900 font-medium">All caught up!</h3>
            <p className="text-gray-500 text-sm">No new notifications for you.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => {
              const style = getNotificationStyle(n.type);
              
              return (
                <div
                  key={n._id}
                  className={`group relative p-4 rounded-xl border transition-all duration-200 
                    ${!n.read 
                      ? "bg-white border-blue-200 shadow-sm" 
                      : "bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-sm"
                    }`}
                >
                   {/* Unread Indicator Dot */}
                   {!n.read && (
                     <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full" />
                   )}

                  <div className="flex gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${style.bg} shadow-sm`}>
                      {style.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <p className={`text-sm ${!n.read ? "text-gray-900 font-semibold" : "text-gray-600"}`}>
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Action Button (Desktop: Hover, Mobile: Always visible if unread) */}
                    {!n.read && (
                      <button
                        className="self-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-blue-600 bg-white sm:bg-transparent rounded-full border sm:border-none shadow-sm sm:shadow-none"
                        title="Mark as read"
                        onClick={() => markSingleRead(n._id)}
                      >
                        <Check size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}