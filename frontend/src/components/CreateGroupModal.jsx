// // src/components/CreateGroupModal.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarUrl } from "../utils/avatar";
import { X, Users, CheckCircle, Circle, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const CreateGroupModal = ({ onClose, onCreated }) => {
  const { token, user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch connections");
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) {
        console.error("Connection fetch error:", err);
      } finally {
        setFetching(false);
      }
    };
    if (token && user?._id) fetchConnections();
  }, [token, user?._id]);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const createGroup = async () => {
    if (selected.length < 2) return alert("Please select at least 2 members to form a group.");
    if (!groupName.trim()) return alert("Please enter a group name.");

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/chat/create-group`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: groupName, members: selected }),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated?.(data);
        onClose();
      } else {
        alert(data.message || "Failed to create group");
      }
    } catch (err) {
      console.error("createGroup error:", err);
      alert("Failed to create group: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={20} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800">Create Group</h3>
                <p className="text-xs text-gray-500">{selected.length} members selected</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-hidden flex flex-col">
            
            {/* Group Name Input */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Group Name</label>
                <input
                    className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none text-gray-800 placeholder-gray-400 transition-all"
                    placeholder="e.g. Project Team Alpha"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                />
            </div>

            {/* Selection List */}
            <div className="flex-1 overflow-hidden flex flex-col">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Select Members</label>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1 border rounded-xl p-2 border-gray-100 bg-gray-50/50">
                    {fetching ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-gray-400" />
                        </div>
                    ) : connections.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p className="text-sm">No connections found.</p>
                        </div>
                    ) : (
                        connections.map((c) => {
                            const isSelected = selected.includes(c._id);
                            return (
                                <div
                                    key={c._id}
                                    onClick={() => toggleSelect(c._id)}
                                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all border ${
                                        isSelected
                                        ? "bg-white border-indigo-200 shadow-sm"
                                        : "bg-transparent border-transparent hover:bg-gray-100"
                                    }`}
                                >
                                    {/* Checkbox Icon */}
                                    <div className={`transition-colors ${isSelected ? "text-indigo-600" : "text-gray-300"}`}>
                                        {isSelected ? <CheckCircle size={20} fill="currentColor" className="text-white" /> : <Circle size={20} />}
                                    </div>

                                    <img
                                        src={getAvatarUrl(c.avatarUrl, c.name, BACKEND)}
                                        alt={c.name}
                                        className="w-9 h-9 rounded-full object-cover border border-gray-200"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || "User")}`;
                                        }}
                                    />
                                    
                                    <span className={`text-sm font-medium ${isSelected ? "text-indigo-900" : "text-gray-700"}`}>
                                        {c.name}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={createGroup}
                disabled={loading || selected.length < 2 || !groupName.trim()}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
            >
                {loading ? <Loader2 size={16} className="animate-spin" /> : "Create Group"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;