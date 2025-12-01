import React, { useState } from 'react';
import { X, Search, User, MessageSquarePlus } from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const StartConversationModal = ({ isOpen, onClose, users = [], onSelectUser, onlineUsers = new Set() }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;
  
  const filteredUsers = users.filter(user => 
    (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
    >
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
                <h2 className="text-lg font-bold text-gray-800">New Message</h2>
                <p className="text-xs text-gray-500">Start a conversation</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search people by name or email..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
        </div>
        
        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {filteredUsers.length > 0 ? (
                <div className="space-y-1">
                    {filteredUsers.map(user => {
                        const isOnline = onlineUsers.has(user._id);
                        return (
                            <div
                                key={user._id}
                                onClick={() => onSelectUser(user._id)}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group border border-transparent hover:border-blue-100"
                            >
                                <div className="relative">
                                    <img
                                      src={getAvatarUrl(user.avatarUrl, user.name, BACKEND)}
                                      alt={user.name}
                                      className="w-10 h-10 rounded-full object-cover border border-gray-200 group-hover:border-blue-200 transition-colors"
                                    />
                                    {isOnline && (
                                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                                        {user.name}
                                    </h3>
                                    <p className="text-xs text-gray-500 truncate group-hover:text-blue-500/70">
                                        {user.email}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <User size={32} className="opacity-20 mb-2"/>
                    <p className="text-sm">No users found.</p>
                </div>
            )}
        </div>
        
        {/* Footer (Optional, mostly for canceling) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
            <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-lg transition-colors"
            >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default StartConversationModal;