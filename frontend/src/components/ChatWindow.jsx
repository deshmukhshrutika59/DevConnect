// // frontend/src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { getSocket } from "../utils/socket";
import ForwardMessageModal from "./ForwardMessageModal";
import ChatInput from "./ChatInput";
import GroupInfoModal from "./GroupInfoModal";
import { 
  ArrowRightCircle, 
  Trash2, 
  Edit2, 
  Check, 
  CheckCheck, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  X,
  Save
} from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const ChatWindow = ({ conversation, refreshConversations }) => {
  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [forwardModal, setForwardModal] = useState({ open: false, messageId: null });
  const [renameMode, setRenameMode] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const messagesRef = useRef(null);

  const isGroup = !!conversation?.isGroup;
  const otherUser = !isGroup
    ? conversation?.participants?.find((p) => p._id !== (user._id || user.id))
    : null;

  useEffect(() => {
    if (!conversation) return setMessages([]);

    const fetchMessages = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/messages/${conversation._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return setMessages([]);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Fetch messages error:", err);
      }
    };
    fetchMessages();

    const socket = getSocket();
    socket.emit("join_conversation", { conversationId: conversation._id });

    const onNew = (m) => {
      if (m.conversation === conversation._id)
        setMessages((prev) => [...prev, m]);
      refreshConversations?.();
    };
    const onEdited = (m) =>
      setMessages((prev) => prev.map((p) => (p._id === m._id ? m : p)));
    const onDeleted = ({ messageId }) =>
      setMessages((prev) => prev.filter((p) => p._id !== messageId));
    const onSeen = ({ conversationId, seenBy }) => {
      if (conversationId === conversation._id) {
        setMessages((prev) =>
          prev.map((m) => ({
            ...m,
            seenBy: m.seenBy
              ? Array.from(new Set([...m.seenBy, seenBy]))
              : [seenBy],
          }))
        );
      }
    };
    const onTyping = ({ userId }) => {
      if (userId !== user._id)
        setTypingUsers((prev) => new Set(prev).add(userId));
    };
    const onStopTyping = ({ userId }) =>
      setTypingUsers((prev) => {
        const s = new Set(prev);
        s.delete(userId);
        return s;
      });

    const onGroupUpdated = (payload) => {
      if (payload.groupId === conversation._id) {
        refreshConversations?.();
      }
    };

    socket.on("new_message", onNew);
    socket.on("message_edited", onEdited);
    socket.on("message_deleted", onDeleted);
    socket.on("messages_seen", onSeen);
    socket.on("typing", onTyping);
    socket.on("stop_typing", onStopTyping);
    socket.on("group_updated", onGroupUpdated);

    socket.emit("mark_seen", { conversationId: conversation._id });

    return () => {
      socket.emit("leave_conversation", { conversationId: conversation._id });
      socket.off("new_message", onNew);
      socket.off("message_edited", onEdited);
      socket.off("message_deleted", onDeleted);
      socket.off("messages_seen", onSeen);
      socket.off("typing", onTyping);
      socket.off("stop_typing", onStopTyping);
      socket.off("group_updated", onGroupUpdated);
    };
  }, [conversation, token, refreshConversations, user]);

  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  const handleSendAck = (msg) => {
    if (!msg) return;
    setMessages((prev) =>
      prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
    );
  };

  const editMessage = (messageId, newText) =>
    getSocket()?.emit("edit_message", { messageId, content: newText });

  const deleteMessage = (messageId) =>
    getSocket()?.emit("delete_message", { messageId });

  const openForwardModal = (messageId) =>
    setForwardModal({ open: true, messageId });

  const renameGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const res = await fetch(`${BACKEND}/api/chat/rename-group/${conversation._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newGroupName }),
      });
      if (res.ok) {
        setRenameMode(false);
        setNewGroupName("");
        refreshConversations?.();
      } else {
        const data = await res.json();
        alert(data?.message || "Rename failed");
      }
    } catch (err) {
      console.error("renameGroup error:", err);
    }
  };
  // --- LOGIC ENDS HERE ---

  // Placeholder for empty state
  if (!conversation) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">💬</span>
            </div>
            <p className="text-sm font-medium">Select a conversation to start messaging</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* 1. Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img
            src={
              isGroup
                ? "https://ui-avatars.com/api/?name=Group&background=random" // Fallback icon for groups
                : getAvatarUrl(otherUser?.avatarUrl, otherUser?.name, BACKEND)
            }
            alt="avatar"
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <h3 className="font-bold text-gray-900 leading-tight">
              {isGroup ? conversation.name : otherUser?.name}
            </h3>
            {isGroup ? (
              <span className="text-xs text-gray-500">{conversation.participants?.length || 0} members</span>
            ) : typingUsers.size > 0 ? (
              <span className="text-xs text-green-600 font-medium animate-pulse">typing...</span>
            ) : (
                <span className="text-xs text-gray-400">Online</span> // Placeholder
            )}
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1">
            {/* Visual-only action buttons for polish */}
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition hidden sm:block">
                <Phone size={20} />
            </button>
            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition hidden sm:block">
                <Video size={20} />
            </button>
            
            {/* Group Menu */}
            {isGroup && (
                <div className="flex items-center">
                    <button 
                        onClick={() => setShowGroupInfo(true)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                        title="Group Info"
                    >
                        <Info size={20} />
                    </button>
                    {String(conversation.admin) === String(user._id) && (
                        <button
                            onClick={() => {
                                setRenameMode(true);
                                setNewGroupName(conversation.name || "");
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition"
                            title="Rename Group"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                </div>
            )}
            {!isGroup && (
                 <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
                    <MoreVertical size={20} />
                 </button>
            )}
        </div>
      </div>

      {/* 2. Messages List */}
      <div 
        ref={messagesRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50 custom-scrollbar scroll-smooth"
        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      >
        {messages.map((m, index) => {
          const isMine = m.sender && (m.sender._id || m.sender) === (user._id || user.id);
          // Check if previous message was from same sender to group visually
          const isSequence = index > 0 && messages[index - 1].sender?._id === m.sender?._id;

          return (
            <div 
                key={m._id} 
                className={`flex w-full ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div className={`relative group max-w-[85%] sm:max-w-[70%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                
                {/* Sender Name in Group (if not me and not sequence) */}
                {isGroup && !isMine && !isSequence && m.sender?.name && (
                    <span className="text-[10px] text-gray-500 mb-1 ml-1 font-medium">{m.sender.name}</span>
                )}

                {/* Message Bubble */}
                <div 
                    className={`relative px-4 py-2 text-sm shadow-sm
                        ${isMine 
                            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm" 
                            : "bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-tl-sm"
                        }
                    `}
                >
                  {/* Deleted State */}
                  {m.deletedAt ? (
                    <span className="italic opacity-60 flex items-center gap-1">
                        <Trash2 size={12} /> Message deleted
                    </span>
                  ) : (
                    <>
                        {/* Text Content */}
                        {m.content && <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>}

                        {/* Shared Post Card */}
                        {m.type === "shared_post" && m.sharedPost && (
                            <div
                                onClick={() => {
                                    const authorId = m.sharedPost.originalAuthorId;
                                    const myId = user?._id || user?.id;
                                    if(authorId) navigate(`/profile/${authorId === myId ? '' : authorId}`);
                                }}
                                className={`mt-2 mb-1 cursor-pointer border rounded-lg overflow-hidden transition-colors ${
                                    isMine ? "bg-white/10 border-white/20 hover:bg-white/20" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                                }`}
                            >
                                <div className="p-3">
                                    <div className="text-xs opacity-70 mb-1">
                                        Shared post by <b>{m.sharedPost.originalAuthorName}</b>
                                    </div>
                                    <div className="font-semibold text-sm mb-1 line-clamp-1">{m.sharedPost.title}</div>
                                    {m.sharedPost.content && (
                                        <div className="text-xs opacity-80 line-clamp-2 mb-2">{m.sharedPost.content}</div>
                                    )}
                                    {/* Mini Media Preview */}
                                    {m.sharedPost.media?.length > 0 && (
                                        <div className="h-24 w-full bg-black/20 rounded flex items-center justify-center overflow-hidden">
                                            {m.sharedPost.media[0].endsWith(".mp4") ? (
                                                <span className="text-xs">▶ Video</span>
                                            ) : (
                                                <img src={`${BACKEND}${m.sharedPost.media[0]}`} className="w-full h-full object-cover"/>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Media Attachments */}
                        {m.media && m.media.url && !m.deletedAt && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                                {m.media.mimeType?.startsWith("image/") ? (
                                    <img src={m.media.url} alt="attachment" className="max-w-full max-h-60 object-cover" />
                                ) : m.media.mimeType?.startsWith("video/") ? (
                                    <video src={m.media.url} controls className="max-w-full max-h-60" />
                                ) : null}
                            </div>
                        )}
                    </>
                  )}

                  {/* Metadata (Time & Read Receipts) */}
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMine ? "text-blue-100" : "text-gray-400"}`}>
                    <span>
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {m.editedAt && <span>(edited)</span>}
                    {isMine && (
                        <span className="ml-0.5">
                            {m.seenBy?.length > 1 ? <CheckCheck size={12} /> : <Check size={12} />}
                        </span>
                    )}
                  </div>
                </div>

                {/* Hover Actions (Only visible on hover) */}
                {isMine && !m.deletedAt && (
                    <div className="absolute top-0 right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white shadow-sm border border-gray-100 rounded-lg p-1">
                        <button 
                            onClick={() => {
                                const newText = prompt("Edit message:", m.content);
                                if (newText) editMessage(m._id, newText);
                            }}
                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                        >
                            <Edit2 size={12} />
                        </button>
                        <button 
                            onClick={() => { if (confirm("Delete message?")) deleteMessage(m._id); }}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                        <button 
                            onClick={() => openForwardModal(m._id)}
                            className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                            title="Forward"
                        >
                            <ArrowRightCircle size={12} />
                        </button>
                    </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Input Area */}
      <ChatInput conversation={conversation} onSend={handleSendAck} />

      {/* Modals */}
      {renameMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white p-6 rounded-2xl w-80 shadow-2xl animate-fade-in-up">
            <h3 className="font-bold text-gray-800 mb-4">Rename Group</h3>
            <input
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all mb-4"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRenameMode(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={renameGroup}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {forwardModal.open && (
        <ForwardMessageModal
          messageId={forwardModal.messageId}
          onClose={() => setForwardModal({ open: false, messageId: null })}
          onForward={(msg) => setMessages((prev) => [...prev, msg])}
        />
      )}

      {showGroupInfo && (
        <GroupInfoModal
          group={conversation}
          onClose={() => setShowGroupInfo(false)}
          refreshConversations={refreshConversations}
        />
      )}
    </div>
  );
};

export default ChatWindow;