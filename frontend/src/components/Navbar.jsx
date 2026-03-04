import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Rocket, LogOut, Sparkles, LayoutDashboard, BarChart2, FileText, MessageSquare } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { getSocket } from "../utils/socket";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import NotificationDropdown from "./NotificationDropdown";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, token } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  // -----------------------------------------
  // 1️⃣ LOAD NOTIFICATIONS FROM BACKEND
  // -----------------------------------------
  const loadNotifications = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        const list = Array.isArray(data.notifications) ? data.notifications : [];
        setNotifications(list);
        setUnread(list.filter((n) => !n.read).length);
      }
      
    } catch (err) {
      console.error("Load notifications error:", err);
    }
  };

  // Run on mount
  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  // -----------------------------------------
  // 2️⃣ SOCKET — REALTIME NOTIFICATION LISTENER
  // -----------------------------------------
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    const handler = (notification) => {
      setNotifications(prev => Array.isArray(prev) ? [notification, ...prev] : [notification]);
      if (!notification.read) setUnread((prev) => prev + 1);
    };

    socket.on("notification:new", handler);

    return () => socket.off("notification:new", handler);
  }, [user]);

  // -----------------------------------------
  // 3️⃣ MARK SINGLE NOTIFICATION AS READ
  // -----------------------------------------
  const handleReadOne = async (id) => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark-read/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );

      setUnread((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  // -----------------------------------------
  // 4️⃣ MARK ALL NOTIFICATIONS AS READ
  // -----------------------------------------
  const markAllRead = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/notifications/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  // Helper to check active link
  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="p-1.5 bg-blue-600 rounded-lg group-hover:bg-blue-700 transition-colors">
                <Rocket className="text-white fill-white" size={20} />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              Dev<span className="text-blue-600">Connect</span>
            </span>
          </Link>

          {/* Navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-6">
            {user && (
                <>
                    <Link 
                        to="/" 
                        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link 
                        to="/resume-analyzer" 
                        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isActive('/resume-analyzer') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <FileText size={16} /> Resume AI
                    </Link>
                    <Link 
                        to="/messages" 
                        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isActive('/messages') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <MessageSquare size={16} /> Messages
                    </Link>
                    <Link 
                        to="/analytics" 
                        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isActive('/analytics') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <BarChart2 size={16} /> Analytics
                    </Link>
                    <Link 
                        to="/assistant" 
                        className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${isActive('/assistant') ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                        <Sparkles size={16} className="text-amber-500" /> AI Coach
                    </Link>
                </>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                {/* 🔔 Notifications */}
                <div className="relative">
                  <NotificationBell onClick={() => setNotifOpen(!notifOpen)} count={unread} />
                  <NotificationDropdown
                    open={notifOpen}
                    onClose={() => setNotifOpen(false)}
                    notifications={notifications}
                    onRead={handleReadOne}
                    onMarkAll={markAllRead}
                  />
                </div>

                <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>

                {/* Profile Link */}
                <Link
                  to="/dashboard/profile"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200 text-sm font-medium text-gray-700"
                >
                  <User size={16} className="text-gray-500" /> 
                  <span className="truncate max-w-[100px]">{user.name.split(' ')[0]}</span>
                </Link>

                {/* Logout */}
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link 
                    to="/login"
                    className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                    Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
                >
                  Join Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}