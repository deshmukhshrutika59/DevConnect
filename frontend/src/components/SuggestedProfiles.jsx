import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../utils/avatar";
import { UserPlus, UserMinus, Sparkles, User } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const SuggestedProfiles = () => {
  const { user, token, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState([]);
  const [processing, setProcessing] = useState(null);

  // 🔥 FETCH AI-BASED SUGGESTIONS
  const fetchSuggestions = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/recommend/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load suggestions");

      const data = await res.json();
      const recommended = Array.isArray(data.results) ? data.results : [];

      const myId = user?._id || user?.id;
      const connections = user?.connections?.map(id => id.toString()) || [];

      // filter: exclude yourself + already connected users
      const filtered = recommended.filter(
        (u) =>
          u._id !== myId &&
          !connections.includes(u._id?.toString())
      );

      setSuggestions(filtered);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    }
  };

  useEffect(() => {
    if (token && user) fetchSuggestions();
  }, [token, user]);

  // CONNECT user
  const handleConnect = async (userId) => {
    if (processing) return;
    setProcessing(userId);
    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Connection failed");

      await refreshUser();
      fetchSuggestions(); // refresh list after connecting
      // alert("Connected successfully"); // Optional: removed alert for cleaner UI flow
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // DISCONNECT user
  const handleDisconnect = async (userId) => {
    if (processing) return;
    setProcessing(userId);

    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Disconnection failed");

      await refreshUser();
      fetchSuggestions();
      // alert("Disconnected successfully"); // Optional: removed alert for cleaner UI flow
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1.5 bg-yellow-100 rounded-lg">
           <Sparkles className="text-yellow-600" size={18} />
        </div>
        <h3 className="font-bold text-gray-800">Suggested for you</h3>
      </div>

      <div className="space-y-3">
        {suggestions.length > 0 ? (
          suggestions.map((u) => {
            const connected = (user?.connections || []).includes(u._id);
            const isProcessing = processing === u._id;

            return (
              <div
                key={u._id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
              >
                <div
                  className="flex items-center gap-3 cursor-pointer overflow-hidden"
                  onClick={() => navigate(`/profile/${u._id}`)}
                >
                  <img
                    src={getAvatarUrl(u?.avatarUrl, u?.name, BACKEND)}
                    alt={u?.name}
                    className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-blue-200 transition-colors"
                  />
                  <div className="min-w-0">
                     <p className="font-semibold text-gray-900 text-sm truncate">{u.name}</p>
                     <p className="text-xs text-gray-500 truncate">{u.email || "Developer"}</p>
                  </div>
                </div>

                {connected ? (
                  <button
                    onClick={() => handleDisconnect(u._id)}
                    disabled={isProcessing}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Disconnect"
                  >
                    <UserMinus size={18} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleConnect(u._id)}
                    disabled={isProcessing}
                    className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full transition-all shadow-sm"
                    title="Connect"
                  >
                    {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <UserPlus size={18} />
                    )}
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-gray-400">
             <User size={32} className="opacity-20 mb-2"/>
             <p className="text-sm">No suggestions right now.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuggestedProfiles;