
// frontend/src/pages/ChatPage.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import NewChatModal from "../components/NewChatModal";
import { initSocket, getSocket, disconnectSocket } from "../utils/socket";
import { Plus, ArrowLeft, MessageSquare } from "lucide-react"; // Added Icons

const ChatPage = () => {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNew, setShowNew] = useState(false);

  // Removed duplicate BACKEND declaration
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  const fetchConversations = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/chat/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return setConversations([]);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    const socket = initSocket(token);

    socket.on("conversation_updated", () => fetchConversations());
    socket.on("user_online", () => fetchConversations());
    socket.on("user_offline", () => fetchConversations());

    fetchConversations();

    return () => {
      socket.off("conversation_updated");
      socket.off("user_online");
      socket.off("user_offline");
      disconnectSocket();
    };
  }, [token]);

  return (
    // Main Container: adjusted height to fit viewport minus standard header height
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden relative">
      
      {/* SIDEBAR (Chat List) 
         - Hidden on mobile IF a conversation is active 
         - Always visible on desktop (md:flex)
      */}
      <div 
        className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex-col bg-white z-10 
        ${activeConversation ? "hidden md:flex" : "flex"}`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} />
            Messages
          </h2>
          <button 
            onClick={() => setShowNew(true)}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
            title="New Chat"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            <ChatList
            conversations={conversations}
            setActiveConversation={setActiveConversation}
            activeConversation={activeConversation}
            refreshConversations={fetchConversations}
            />
        </div>
      </div>

      {/* MAIN AREA (Chat Window) 
         - Hidden on mobile IF NO conversation is active 
         - Always visible on desktop (md:flex)
      */}
      <div 
        className={`flex-1 flex flex-col bg-gray-50 relative 
        ${!activeConversation ? "hidden md:flex" : "flex w-full fixed inset-0 md:static z-20 md:z-0"}`}
      >
        {/* Mobile Header: Only shows on mobile to allow going back */}
        {activeConversation && (
            <div className="md:hidden bg-white p-3 border-b flex items-center gap-3 sticky top-0 z-30 shadow-sm">
                <button 
                    onClick={() => setActiveConversation(null)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full"
                >
                    <ArrowLeft size={20} />
                </button>
                <span className="font-semibold text-gray-800 truncate">
                    {/* Assuming the logic inside ChatList/Window handles the name display, 
                        we keep this simple or let ChatWindow handle the specific header info. 
                        This is just a navigational wrapper. */}
                    Back to Chats
                </span>
            </div>
        )}

        {/* The Chat Window Component */}
        <div className="flex-1 h-full overflow-hidden">
             <ChatWindow 
                conversation={activeConversation} 
                refreshConversations={fetchConversations} 
             />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNew && (
        <NewChatModal 
            onClose={() => setShowNew(false)} 
            onStartChat={(conv) => { 
                setActiveConversation(conv); 
                setShowNew(false); 
                fetchConversations(); 
            }} 
        />
      )}
    </div>
  );
};

export default ChatPage;