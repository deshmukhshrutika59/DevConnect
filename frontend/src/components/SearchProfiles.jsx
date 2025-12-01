import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../utils/avatar";
import { Search, UserPlus, UserMinus, User, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const SearchProfiles = () => {
  const { token, user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [processing, setProcessing] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // 🔍 RUN SEMANTIC USER SEARCH
  useEffect(() => {
    const fetchResults = async () => {
      if (!query) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const res = await fetch(`${BACKEND}/api/search/semantic`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query,
            type: "users",
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          console.error("Search failed", data);
          return setResults([]);
        }

        // ✅ Backend returns an array directly
        const all = Array.isArray(data) ? data : [];

        // Remove users already connected
        const connections = Array.isArray(user?.connections)
          ? user.connections.map((id) => id.toString())
          : [];

        const filtered = all.filter(
          (u) => !connections.includes(u._id?.toString()) && u._id !== user._id
        );

        setResults(filtered);
      } catch (err) {
        console.error("Search error:", err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce the search slightly to prevent flicker on every keystroke
    const timeoutId = setTimeout(() => {
        if (token && user) fetchResults();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, token, user]);

  // CONNECT
  const handleConnect = async (userId) => {
    if (processing) return;
    setProcessing(userId);
    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await refreshUser();
      // alert("Connected successfully"); // Optional: alert removed for smoother UI
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  // DISCONNECT
  const handleDisconnect = async (userId) => {
    if (processing) return;
    setProcessing(userId);

    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await refreshUser();
      // alert("Disconnected successfully"); // Optional: alert removed for smoother UI
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 w-full">
      <h3 className="font-bold text-gray-800 mb-4">Find People</h3>
      
      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Search by name, skill, or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
        />
      </div>

      <div className="space-y-2 min-h-[100px]">
        {/* Loading State */}
        {isSearching && (
            <div className="flex justify-center py-4 text-gray-400">
                <Loader2 className="animate-spin" size={20} />
            </div>
        )}

        {/* Empty State: No query */}
        {!query && !isSearching && (
            <div className="text-center py-6 text-gray-400">
                <Search size={32} className="mx-auto mb-2 opacity-20"/>
                <p className="text-xs">Type to search developers</p>
            </div>
        )}

        {/* Empty State: No results */}
        {query && !isSearching && results.length === 0 && (
          <div className="text-center py-6 text-gray-400">
            <User size={32} className="mx-auto mb-2 opacity-20"/>
            <p className="text-sm">No matching developers found.</p>
          </div>
        )}

        {/* Results List */}
        {results.map((u) => {
            const isProcessing = processing === u._id;
            const isConnected = (user?.connections || []).includes(u._id);

            return (
                <div
                    key={u._id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
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
                            <span className="font-semibold text-gray-900 text-sm block truncate">{u.name}</span>
                            <span className="text-xs text-gray-500 truncate block">{u.email || "Developer"}</span>
                        </div>
                    </div>

                    {isConnected ? (
                        <button
                            onClick={() => handleDisconnect(u._id)}
                            disabled={isProcessing}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Disconnect"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <UserMinus size={18} />}
                        </button>
                    ) : (
                        <button
                            onClick={() => handleConnect(u._id)}
                            disabled={isProcessing}
                            className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-full transition-all shadow-sm"
                            title="Connect"
                        >
                            {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <UserPlus size={18} />}
                        </button>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};

export default SearchProfiles;