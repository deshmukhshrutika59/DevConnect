
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSocket } from "../utils/socket";
import { getAvatarUrl } from "../utils/avatar";
import { X, Forward, Share2, ChevronRight, User, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const ForwardMessageModal = ({ messageId, postId, onClose, onForward }) => {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load connections");
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) {
        console.error("Fetch connections error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user && token) fetchConnections();
  }, [user, token]);

  const handleForwardTo = async (targetUserId) => {
    const socket = getSocket();
    if (!socket) return alert("Socket not connected");

    setProcessingId(targetUserId);

    try {
      const res = await fetch(`${BACKEND}/api/chat/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: targetUserId }),
      });
      const convo = await res.json();
      if (!convo?._id) throw new Error("Failed to create/get conversation");

      if (messageId) {
        socket.emit("forward_message", { messageId, toConversationId: convo._id }, (ack) => {
          if (ack?.success) {
            onForward?.(ack.message);
            onClose?.();
          } else {
            alert("Forward failed: " + (ack?.error || "unknown"));
          }
          setProcessingId(null);
        });
      } else if (postId) {
        socket.emit("share_post", { postId, toConversationId: convo._id }, (ack) => {
          if (ack?.success) {
            onForward?.(ack.message);
            onClose?.();
          } else {
            alert("Share failed: " + (ack?.error || "unknown"));
          }
          setProcessingId(null);
        });
      }
    } catch (err) {
      console.error("Forward error:", err);
      alert("Forward error: " + err.message);
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className={`p-2 rounded-lg ${postId ? "bg-purple-50 text-purple-600" : "bg-blue-50 text-blue-600"}`}>
                {postId ? <Share2 size={20} /> : <Forward size={20} />}
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-900">
                    {messageId ? "Forward Message" : "Share Post"}
                </h2>
                <p className="text-xs text-gray-500">Select a recipient</p>
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
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                </div>
            ) : connections.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <User size={32} className="opacity-20 mb-2"/>
                    <p className="text-sm">No connections available.</p>
                </div>
            ) : (
                <div className="space-y-1">
                    {connections.map((conn) => {
                        const isProcessing = processingId === conn._id;
                        return (
                            <div
                                key={conn._id}
                                onClick={() => !isProcessing && handleForwardTo(conn._id)}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border border-transparent group
                                    ${isProcessing ? "bg-gray-50 cursor-wait" : "hover:bg-blue-50 hover:border-blue-100 cursor-pointer"}
                                `}
                            >
                                <img
                                    src={getAvatarUrl(conn.avatarUrl, conn.name, BACKEND)}
                                    alt={conn.name}
                                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                        {conn.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-500">Click to send</div>
                                </div>
                                
                                {isProcessing ? (
                                    <Loader2 size={18} className="animate-spin text-blue-600" />
                                ) : (
                                    <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
            <button 
                onClick={onClose} 
                className="text-xs font-medium text-gray-500 hover:text-gray-700 hover:underline"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardMessageModal;