
import React from "react";
import { getAvatarUrl } from "../utils/avatar";
import { Github, ExternalLink, MapPin } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const ProfileSidebar = ({ user }) => {
  if (!user) return null;

  return (
    <div className="w-full md:w-64 bg-white border-r border-gray-200 h-full p-6 flex flex-col items-center">
      {/* Avatar Section */}
      <div className="relative mb-4 group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 transition duration-200 blur-sm"></div>
        <img
          src={getAvatarUrl(user.avatarUrl, user.name, BACKEND)}
          alt={user.name}
          className="relative w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
        />
      </div>

      {/* Name & Bio */}
      <h2 className="text-lg font-bold text-gray-900 text-center">{user.name}</h2>
      {user.location && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin size={12} />
            <span>{user.location}</span>
        </div>
      )}
      
      <p className="text-center text-sm text-gray-600 mt-3 leading-relaxed px-2">
        {user.bio || "No bio available yet."}
      </p>

      <div className="w-full border-t border-gray-100 my-6"></div>

      {/* Links Section */}
      <div className="w-full">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Socials & Links
        </h3>
        <ul className="space-y-2">
          {user.githubUsername ? (
            <li>
              <a
                href={`https://github.com/${user.githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 text-gray-700 transition-all group"
              >
                <div className="p-1.5 bg-gray-100 rounded-md group-hover:bg-white group-hover:shadow-sm transition-all">
                    <Github size={18} className="text-gray-800" />
                </div>
                <span className="text-sm font-medium">GitHub Profile</span>
                <ExternalLink size={14} className="ml-auto text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </li>
          ) : (
            <li className="text-sm text-gray-400 italic text-center py-2">
                No links added
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default ProfileSidebar;