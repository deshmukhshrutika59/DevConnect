
import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Check, CheckCheck, Users } from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";

const ChatList = ({ conversations = [], setActiveConversation, activeConversation }) => {
  const { user } = useAuth();
  const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

  return (
    <div className="space-y-1 p-2">
      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <span className="text-sm">No conversations yet</span>
        </div>
      ) : (
        conversations.map((c) => {
          const isGroup = !!c.isGroup;
          const other = !isGroup
            ? c.participants.find((p) => p._id !== (user._id || user.id))
            : null;

          const last = c.lastMessage;
          const displayName = isGroup
            ? c.name || "Unnamed Group"
            : other?.name || "Unknown";

          // ✅ Unified avatar path handling
          const displayAvatar = isGroup
            ? "/group-icon.png" 
            : getAvatarUrl(other?.avatarUrl, other?.name, BACKEND);

          let previewText = "No messages yet";
          if (last) previewText = last.content || "[Media]";

          const isMine = last?.sender?._id === (user._id || user.id);
          const isSeen =
            Array.isArray(last?.seenBy) &&
            last.seenBy.includes(isGroup ? (user._id || user.id) : other?._id);
            
          const isActive = activeConversation && activeConversation._id === c._id;

          return (
            <div
              key={c._id}
              onClick={() => setActiveConversation(c)}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border border-transparent ${
                isActive
                  ? "bg-blue-50 border-blue-200 shadow-sm"
                  : "hover:bg-gray-50 hover:border-gray-100"
              }`}
            >
              {/* Avatar Section */}
              <div className="relative flex-shrink-0">
                {isGroup ? (
                    // Fallback visual if group image missing or just icon
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 overflow-hidden">
                        <img 
                            src={displayAvatar}
                            alt="group"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display='none'; }} 
                        />
                        <Users size={20} className="absolute" style={{zIndex: -1}} />
                    </div>
                ) : (
                    <img
                        src={displayAvatar}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover border border-gray-200"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
                        }}
                    />
                )}
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <span className={`font-semibold text-sm truncate ${isActive ? 'text-blue-900' : 'text-gray-900'}`}>
                        {displayName}
                    </span>
                    {c.updatedAt && (
                        <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                            {new Date(c.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-xs text-gray-500">
                    {last && isMine && (
                        <span className={isSeen ? "text-blue-500" : "text-gray-400"}>
                            {isSeen ? <CheckCheck size={14} /> : <Check size={14} />}
                        </span>
                    )}
                    <span className={`truncate w-full ${(!last || (last && !isMine && !isSeen)) ? "font-medium text-gray-700" : "text-gray-500"}`}>
                        {isMine ? `You: ${previewText}` : previewText}
                    </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;