
import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getSocket } from "../utils/socket";
import { getAvatarUrl } from "../utils/avatar";
import { X, Share2, Send, Search, User } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const SharePostModal = ({ post, onClose, onShared }) => {
  const { user, token } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Added for local filtering

  // ✅ Step 1: Load connected users (UNCHANGED)
  useEffect(() => {
    if (!user?._id && !user?.id) return;

    const fetchConnections = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${user._id || user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setConnections(data.connections || []);
      } catch (err) {
        console.error("Error fetching connections:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConnections();
  }, [user, token]);

  // ✅ Step 2: Share post logic (UNCHANGED)
  const handleShare = async () => {
    if (!selected) {
      alert("Please select a connection to share with.");
      return;
    }
    if (!post?._id) {
      alert("Invalid post — please refresh and try again.");
      return;
    }

    const socket = getSocket();
    if (!socket || socket.disconnected) {
      alert("Socket not connected — try reopening messages or refresh the page.");
      return;
    }

    setSending(true);
    try {
      // 1️⃣ Create or fetch conversation with selected user
      const res = await fetch(`${BACKEND}/api/chat/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: selected }),
      });

      const conversation = await res.json();
      if (!conversation._id) throw new Error("Conversation not found");

      // 2️⃣ Emit the share_post event
      socket.emit(
        "share_post",
        {
          toConversationId: conversation._id,
          postId: post._id,
          note,
        },
        (ack) => {
          setSending(false);
          if (ack?.success) {
            alert("✅ Post shared successfully!");
            onShared?.(ack.sharedMessage);
            onClose();
          } else {
            alert("❌ Share failed: " + (ack?.error || "unknown error"));
          }
        }
      );
    } catch (err) {
      console.error("Share error:", err);
      alert("Error sharing post: " + err.message);
      setSending(false);
    }
  };

  // Filter connections based on search
  const filteredConnections = connections.filter(c => 
    (c.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Share2 size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-800">Share Post</h2>
                <p className="text-xs text-gray-500">Send this to a friend</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
            
            {/* Note Input */}
            <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2">Message (Optional)</label>
                <textarea
                    placeholder="Write a thought..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none bg-gray-50 transition-all min-h-[80px]"
                />
            </div>

            {/* Search */}
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Search connections..." 
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-50 focus:border-blue-300 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Connections List */}
            <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Select Recipient</p>
                
                {loading ? (
                    <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div></div>
                ) : filteredConnections.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <User size={32} className="mx-auto mb-2 opacity-20"/>
                        <p className="text-sm">No connections found.</p>
                    </div>
                ) : (
                    <div className="max-h-48 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                        {filteredConnections.map((conn) => (
                            <div
                                key={conn._id}
                                onClick={() => setSelected(conn._id)}
                                className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all border ${
                                selected === conn._id
                                    ? "bg-blue-50 border-blue-200 shadow-sm"
                                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-100"
                                }`}
                            >
                                <div className="relative">
                                    <img 
                                        src={getAvatarUrl(conn.avatarUrl, conn.name, BACKEND)}
                                        alt={conn.name}
                                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                    />
                                    {selected === conn._id && (
                                        <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-0.5 border-2 border-white">
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className={`font-semibold text-sm truncate ${selected === conn._id ? 'text-blue-800' : 'text-gray-800'}`}>
                                        {conn.name || "Unknown"}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {conn.headline || "Developer"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
                Cancel
            </button>
            <button
                onClick={handleShare}
                disabled={sending || !selected}
                className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
            >
                {sending ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                        Sending...
                    </>
                ) : (
                    <>
                        Send <Send size={14} />
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};

export default SharePostModal;