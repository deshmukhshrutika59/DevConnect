
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getAvatarUrl } from "../utils/avatar";
import { X, MessageSquarePlus, User, ChevronRight, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const NewChatModal = ({ onClose, onStartChat }) => {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) {
        console.error("Connection fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchConnections();
  }, [user, token]);

  const startChat = async (targetUserId) => {
    if (startingChat) return; // Prevent double clicks
    setStartingChat(targetUserId);
    
    try {
      const res = await fetch(`${BACKEND}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to start chat");
        return;
      }

      // Pass the conversation object directly to maintain compatibility with Messages.jsx
      onStartChat?.(data);
      onClose();
    } catch (err) {
      console.error("startChat error:", err);
    } finally {
      setStartingChat(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <MessageSquarePlus size={20} />
             </div>
             <div>
                <h3 className="font-bold text-gray-800">New Chat</h3>
                <p className="text-xs text-gray-500">Select a connection to message</p>
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
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {loading ? (
            <div className="flex justify-center items-center py-12">
               <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <User size={32} className="opacity-20 mb-2"/>
                <p className="text-sm">No connections yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {connections.map((c) => {
                const isProcessing = startingChat === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => startChat(c._id)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-all group border border-transparent hover:border-blue-100"
                  >
                    <div className="relative">
                        <img
                        src={getAvatarUrl(c.avatarUrl, c.name, BACKEND)}
                        alt={c.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-blue-200"
                        />
                        {/* Optional: Add online status indicator here if available */}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate group-hover:text-blue-500/70">
                        {c.email || "Developer"}
                      </div>
                    </div>

                    {isProcessing ? (
                        <Loader2 size={18} className="animate-spin text-blue-600" />
                    ) : (
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 p-3 text-center border-t border-gray-100">
            <span className="text-xs text-gray-400">You can only message connected users</span>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;