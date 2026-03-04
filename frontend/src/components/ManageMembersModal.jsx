// // frontend/src/components/ManageMembersModal.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarUrl } from "../utils/avatar";
import { X, UserPlus, UserMinus, Shield, Users } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const ManageMembersModal = ({ conversation, onClose, onDone }) => {
  const { token, user } = useAuth();
  const [members, setMembers] = useState(conversation?.participants || []);
  const [connections, setConnections] = useState([]);
  
  // Logic: Load initial members
  useEffect(() => {
    setMembers(conversation?.participants || []);
  }, [conversation]);

  // Logic: Fetch connections to add
  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) { console.error("Fetch connections error:", err); }
    };
    if (token && user?._id) fetchConnections();
  }, [token, user?._id]);

  const removeMember = async (id) => {
    if (!window.confirm("Are you sure you want to remove this member?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/chat/group/${conversation._id}/remove`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: id })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed");
      setMembers(data.participants);
      onDone?.();
    } catch (err) { console.error(err); alert("Failed to remove"); }
  };

  const addMember = async (id) => {
    try {
      const res = await fetch(`${BACKEND}/api/chat/group/${conversation._id}/add`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: id })
      });
      const data = await res.json();
      if (!res.ok) return alert(data.message || "Failed");
      setMembers(data.participants);
      onDone?.();
    } catch (err) { console.error(err); alert("Failed to add"); }
  };

  const isAdmin = String(conversation.admin) === String(user._id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={20} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800">Manage Members</h3>
                <p className="text-xs text-gray-500">{members.length} participants</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
            
            {/* Section 1: Current Members */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Current Members</h4>
                <div className="space-y-2">
                    {members.map(m => {
                        const isMemberAdmin = String(conversation.admin) === String(m._id);
                        return (
                            <div key={m._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 group border border-transparent hover:border-gray-100 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img 
                                            src={getAvatarUrl(m.avatarUrl, m.name, BACKEND)} 
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                                            alt={m.name} 
                                        />
                                        {isMemberAdmin && (
                                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white" title="Admin">
                                                <Shield size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`font-medium text-sm ${isMemberAdmin ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {m.name} {String(m._id) === String(user._id) && "(You)"}
                                    </span>
                                </div>

                                {isAdmin && String(m._id) !== String(user._id) && (
                                    <button 
                                        onClick={() => removeMember(m._id)} 
                                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Remove member"
                                    >
                                        <UserMinus size={18} />
                                    </button>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Section 2: Add Members (Only visible to admin technically, but safe to show logic handled by backend usually) */}
            <div className="pt-4 border-t border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Add People</h4>
                
                {connections.filter(c => !members.some(m => String(m._id) === String(c._id))).length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No new connections to add.</p>
                ) : (
                    <div className="space-y-2">
                        {connections
                            .filter(c => !members.some(m => String(m._id) === String(c._id)))
                            .map(c => (
                                <div key={c._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/50 group border border-transparent hover:border-blue-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <img 
                                            src={getAvatarUrl(c.avatarUrl, c.name, BACKEND)} 
                                            className="w-9 h-9 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all" 
                                            alt={c.name} 
                                        />
                                        <span className="font-medium text-sm text-gray-600 group-hover:text-blue-800 transition-colors">
                                            {c.name}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => addMember(c._id)} 
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                                        title="Add to group"
                                    >
                                        <UserPlus size={18} />
                                    </button>
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button 
                onClick={onClose} 
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm"
            >
                Done
            </button>
        </div>
      </div>
    </div>
  );
};

export default ManageMembersModal;