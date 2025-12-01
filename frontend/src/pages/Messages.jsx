

import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { initSocket, getSocket, disconnectSocket } from "../utils/socket";
import NewChatModal from "../components/NewChatModal";
import CreateGroupModal from "../components/CreateGroupModal";
import ChatWindow from "../components/ChatWindow";
import ChatList from "../components/ChatList";
import { 
  Users, 
  Plus, 
  MessageSquare, 
  ArrowLeft, 
  MoreVertical 
} from "lucide-react";

const Messages = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return setConversations([]);
  
      let data = await res.json();
  
      // ✅ Remove duplicates (only keep one DM per unique participant pair)
      const uniqueMap = new Map();
  
      for (const c of data) {
        if (c.isGroup) {
          uniqueMap.set(c._id, c);
          continue;
        }
  
        // build unique key based on both participant IDs
        const ids = c.participants.map((p) => p._id).sort().join("-");
        if (!uniqueMap.has(ids)) uniqueMap.set(ids, c);
      }
  
      const uniqueConvs = Array.from(uniqueMap.values());
      setConversations(uniqueConvs);
    } catch (err) {
      console.error("fetchConversations error:", err);
    }
  };
  

  useEffect(() => {
    if (!token) return;
    initSocket(token);
    fetchConversations();
    return () => disconnectSocket();
  }, [token]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
  
    socket.on("conversation_updated", ({ conversationId, lastMessage }) => {
      setConversations((prev) =>
        prev.map((c) =>
          c._id === conversationId ? { ...c, lastMessage } : c
        )
      );
    });
  
    // ✅ Prevent duplicate when receiving new conversation
    socket.on("new_conversation", (conv) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === conv._id);
        return exists ? prev : [conv, ...prev];
      });
    });
  
    return () => {
      socket.off("conversation_updated");
      socket.off("new_conversation");
    };
  }, []);
  
  const openConversation = (conv) => setSelected(conv);
  const handleBack = () => setSelected(null);
  // --- LOGIC ENDS HERE ---

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden relative">
      
      {/* SIDEBAR (List) */}
      <div
        className={`${
          selected ? "hidden md:flex" : "flex"
        } w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex-col z-10`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} />
            Chats
          </h2>
          <div className="flex gap-1">
            <button
              onClick={() => setShowGroupModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
              title="Create Group"
            >
              <Users size={20} />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 rounded-full transition-colors"
              title="New Chat"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400 mt-10">
                <MessageSquare size={40} className="mb-2 opacity-20" />
                <span className="text-sm">No conversations yet.</span>
            </div>
          ) : (
            <ChatList
              conversations={conversations}
              activeConversation={selected}
              setActiveConversation={openConversation}
            />
          )}
        </div>
      </div>

      {/* CHAT WINDOW AREA */}
      <div
        className={`flex-1 flex flex-col bg-gray-50 relative ${
          !selected ? "hidden md:flex" : "flex w-full h-full fixed inset-0 md:static z-20 md:z-0"
        }`}
      >
        {selected ? (
          <>
            {/* Mobile Header (Only visible on mobile when chat is open) */}
            <div className="md:hidden flex items-center gap-3 p-3 border-b bg-white shadow-sm sticky top-0 z-10">
              <button
                onClick={handleBack}
                className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="flex-1 truncate">
                 <h3 className="font-bold text-gray-900 truncate">
                    {selected?.isGroup
                    ? selected?.name || "Group Chat"
                    : selected?.participants?.find(
                        (p) => p._id !== user._id
                        )?.name || "Chat"}
                 </h3>
              </div>
              
              {/* Optional: Menu icon for mobile context */}
              <button className="p-2 text-gray-400">
                 <MoreVertical size={20} />
              </button>
            </div>

            {/* Actual Chat Component */}
            <div className="flex-1 overflow-hidden">
                <ChatWindow
                key={selected._id}
                conversation={selected}
                refreshConversations={fetchConversations}
                />
            </div>
          </>
        ) : (
          /* Desktop Empty State */
          <div className="hidden md:flex flex-col items-center justify-center h-full text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageSquare size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Your Messages</h3>
            <p className="text-sm text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal && (
        <NewChatModal
          onClose={() => setShowModal(false)}
          onStartChat={(conv) => {
            fetchConversations();
            setSelected(conv);
            setShowModal(false);
          }}
        />
      )}
      {showGroupModal && (
        <CreateGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(group) => {
            setConversations((prev) => [group, ...prev]);
            setSelected(group);
          }}
        />
      )}
    </div>
  );
};

export default Messages;