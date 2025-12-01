
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { UserCheck, UserMinus, UserPlus, Users, Loader2 } from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";
import { useNavigate } from "react-router-dom";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ConnectedProfiles = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchConnections = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/users/me/connections", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch connections");
      const data = await res.json();
      setConnections(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && user) fetchConnections();
  }, [token, user]);

  const handleDisconnect = async (userId) => {
    if(processingId) return;
    setProcessingId(userId);
    try {
      const res = await fetch(`http://localhost:5000/api/users/${userId}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to disconnect");
      await refreshUser();
      fetchConnections();
      // alert("Disconnected successfully"); // Optional: Removed for cleaner UI flow
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-green-100 rounded-lg">
           <Users className="text-green-600" size={18} />
        </div>
        <h3 className="font-bold text-gray-800">Your Connections</h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-gray-400" />
        </div>
      ) : connections.length > 0 ? (
        <div className="space-y-3">
          {connections.map((conn) => {
            const isProcessing = processingId === conn._id;
            const isConnected = (user?.connections || []).includes(conn._id);

            return (
              <div
                key={conn._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/profile/${conn._id}`)}
                >
                  <img
                    src={getAvatarUrl(conn.avatarUrl, conn.name, BACKEND)}
                    alt={conn.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-blue-200 transition-colors"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{conn.name}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {conn.experienceLevel || "Developer"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {isConnected ? (
                        <>
                            {/* Status Badge (Desktop only usually, but good for clarity) */}
                            <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-md text-[10px] font-bold uppercase tracking-wider border border-green-100">
                                <UserCheck size={12} /> Connected
                            </div>
                            
                            <button
                                onClick={() => handleDisconnect(conn._id)}
                                disabled={isProcessing}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                title="Disconnect"
                            >
                                {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <UserMinus size={18} />}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => alert("This user is not connected yet (refresh recommended)")}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full transition-all shadow-sm"
                            title="Connect"
                        >
                            <UserPlus size={18} />
                        </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <Users size={32} className="opacity-20 mb-2"/>
            <p className="text-sm">No connections yet.</p>
        </div>
      )}
    </div>
  );
};

export default ConnectedProfiles;