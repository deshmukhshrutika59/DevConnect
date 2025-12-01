// // src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import GoogleRedirect from "./pages/GoogleRedirect";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary";
import { useAuth } from "./contexts/AuthContext";
import OtherProfile from "./pages/OtherProfile";
import Messages from "./pages/Messages";
import { initSocket, disconnectSocket } from "./utils/socket";
import Analytics from "./pages/Analytics";
import ResumeAnalyzer from "./pages/ResumeAnalyzer";
import AiAssistant from "./pages/AiAssistant";

export default function App() {
  const { user, token } = useAuth();

  // ✅ Initialize socket globally whenever a user logs in
  useEffect(() => {
    if (token) {
      const socket = initSocket(token);

      socket.on("connect", () => {
        console.log("✅ Global socket connected:", socket.id);
      });

      socket.on("disconnect", (reason) => {
        console.warn("⚠️ Global socket disconnected:", reason);
      });

      socket.on("connect_error", (err) => {
        console.error("❌ Socket connect error:", err.message);
      });
    }

    // Cleanup on logout / token change
    return () => disconnectSocket();
  }, [token]);

  return (
    <ErrorBoundary>
      {/* Updates:
        1. Added 'flex flex-col' to ensure proper vertical stacking.
        2. Added 'font-sans' for global typography consistency.
      */}
      <div className="flex flex-col min-h-screen bg-gray-50 font-sans text-gray-900">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        
        <Navbar />
        
        {/* Changed from "container mx-auto p-4" to "flex-1 w-full".
           This removes the forced box around your pages, allowing the 
           Messages app to be full-screen and the Dashboard to manage its own width.
        */}
        <main className="flex-1 w-full relative">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Home />} />
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
            <Route path="/auth/google/redirect" element={user ? <Navigate to="/dashboard" /> : <GoogleRedirect />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/dashboard/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/profile/:id" element={<OtherProfile />} />
            <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" />} />
            <Route path="/analytics" element={user ? <Analytics />: <Navigate to="/login" />} />
            <Route path="/resume-analyzer" element={<ResumeAnalyzer />} />
            <Route path="/assistant" element={<AiAssistant />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} />} />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}