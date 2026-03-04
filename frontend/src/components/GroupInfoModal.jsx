import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarUrl } from "../utils/avatar";
import { X, Users, Shield, UserPlus, UserMinus, LogOut, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const GroupInfoModal = ({ group, onClose, refreshConversations }) => {
  const { user, token } = useAuth();
  const [members, setMembers] = useState(group.participants || []);
  const [connections, setConnections] = useState([]);
  const [adding, setAdding] = useState(false);
  
  const isAdmin = String(group.admin) === String(user._id);

  // load user connections for add-member list
  useEffect(() => {
    const loadConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (e) {
        console.error("Load connections error:", e);
      }
    };
    if (isAdmin) loadConnections();
  }, [isAdmin, token, user]);

  // --- add / remove / leave handlers (UNCHANGED) ---
  const addMember = async (uid) => {
    try {
      const res = await fetch(`${BACKEND}/api/chat/group/${group._id}/add`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.participants);
        refreshConversations?.();
      } else {
        alert("Failed to add member");
      }
    } catch (e) { console.error(e); }
  };

  const removeMember = async (uid) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/chat/group/${group._id}/remove`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: uid }),
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.participants);
        refreshConversations?.();
      } else {
        alert("Failed to remove");
      }
    } catch (e) { console.error(e); }
  };

  const leaveGroup = async () => {
    if (!window.confirm("Leave this group?")) return;
    try {
      const res = await fetch(`${BACKEND}/api/chat/group/${group._id}/remove`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: user._id }),
      });
      if (res.ok) {
        refreshConversations?.();
        onClose();
      }
    } catch (e) { console.error(e); }
  };

  // --- render ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users size={20} />
             </div>
             <div>
                <h2 className="font-bold text-gray-900 text-lg leading-tight">{group.name}</h2>
                <p className="text-xs text-gray-500">{members.length} members</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
            
            {/* Member List */}
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Participants</h4>
                <div className="space-y-2">
                    {members.map((m) => {
                        const isGroupAdmin = m._id === group.admin;
                        return (
                            <div key={m._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 group transition-colors border border-transparent hover:border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img 
                                            src={getAvatarUrl(m.avatarUrl, m.name, BACKEND)} 
                                            className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                                            alt={m.name} 
                                        />
                                        {isGroupAdmin && (
                                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-white p-0.5 rounded-full border-2 border-white" title="Admin">
                                                <Shield size={10} fill="currentColor" />
                                            </div>
                                        )}
                                    </div>
                                    <span className={`font-medium text-sm ${isGroupAdmin ? 'text-gray-900' : 'text-gray-700'}`}>
                                        {m.name} {m._id === user._id && "(You)"}
                                    </span>
                                </div>
                                
                                {isAdmin && m._id !== user._id && (
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

            {/* Admin Controls: Add Member */}
            {isAdmin && (
                <div className="pt-4 border-t border-gray-100">
                    {!adding ? (
                        <button 
                            onClick={() => setAdding(true)} 
                            className="w-full py-2.5 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-medium"
                        >
                            <UserPlus size={16} /> Add Member
                        </button>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Connection</h4>
                                <button onClick={() => setAdding(false)} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                            </div>
                            
                            {connections.filter(c => !members.some(m => m._id === c._id)).length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl border border-dashed">No available connections to add.</p>
                            ) : (
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {connections
                                        .filter((c) => !members.some((m) => m._id === c._id))
                                        .map((c) => (
                                            <div 
                                                key={c._id} 
                                                onClick={() => addMember(c._id)}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                                            >
                                                <img 
                                                    src={getAvatarUrl(c.avatarUrl, c.name, BACKEND)} 
                                                    className="w-8 h-8 rounded-full object-cover" 
                                                    alt={c.name} 
                                                />
                                                <span className="text-sm font-medium text-gray-700">{c.name}</span>
                                                <UserPlus size={14} className="ml-auto text-blue-500 opacity-0 group-hover:opacity-100" />
                                            </div>
                                        ))
                                    }
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer: Leave Group */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button 
                onClick={leaveGroup} 
                className="w-full py-2.5 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium shadow-sm hover:shadow"
            >
                <LogOut size={16} /> Leave Group
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroupInfoModal;