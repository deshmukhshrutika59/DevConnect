import React from "react";
import { X, User, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAvatarUrl } from "../utils/avatar";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const UserListModal = ({ users = [], type, onClose }) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      {/* Modal Container */}
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="text-lg font-bold text-gray-800 capitalize">
            {type === "followers" ? "Followers" : "Following"}
            <span className="ml-2 text-sm text-gray-500 font-normal">({users.length})</span>
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
          {users.length > 0 ? (
            <div className="space-y-1">
              {users.map((u) => {
                // Handle potentially populated or flat user objects
                const userData = u.user || u; 
                const avatar = userData.avatarUrl;
                const name = userData.name || "Unknown User";
                const email = userData.email;
                const userId = userData._id;

                return (
                  <div
                    key={userId}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group"
                    onClick={() => {
                      navigate(`/profile/${userId}`);
                      onClose();
                    }}
                  >
                    <img
                      src={getAvatarUrl(avatar, name, BACKEND)}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200 group-hover:border-blue-200 transition-colors"
                      alt={name}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {email}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                 <User size={32} className="opacity-20" />
              </div>
              <p className="text-sm">No users found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserListModal;