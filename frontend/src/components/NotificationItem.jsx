import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Check, Trash2, ExternalLink, Bell, User } from "lucide-react";

const NotificationItem = ({ n, onMarkRead, onDelete }) => {
  return (
    <div 
      className={`group relative p-4 rounded-xl border transition-all duration-200 flex gap-4 
        ${!n.read 
          ? "bg-blue-50/40 border-blue-200 shadow-sm" 
          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
        }`}
    >
      {/* Unread Indicator Dot */}
      {!n.read && (
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}

      {/* Icon / Avatar Area */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border shadow-sm
        ${!n.read ? "bg-white border-blue-100" : "bg-gray-50 border-gray-100"}`}
      >
         {n.sender && n.sender.name ? (
            <div className="font-bold text-blue-600 text-sm">
                {n.sender.name[0].toUpperCase()}
            </div>
         ) : (
            <Bell size={18} className="text-gray-400" />
         )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className={`text-sm leading-snug ${!n.read ? "text-gray-900 font-semibold" : "text-gray-700"}`}>
          {n.message}
        </p>
        
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          {n.sender?.name && (
            <span className="flex items-center gap-1 font-medium text-gray-600">
                <User size={10} /> {n.sender.name}
            </span>
          )}
          <span>·</span>
          <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
        </div>

        {n.link && (
          <a 
            href={n.link} 
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded-md transition-colors"
          >
            <ExternalLink size={12} /> Open Link
          </a>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity self-center">
        {!n.read && (
            <button 
                onClick={() => onMarkRead(n._id)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Mark as read"
            >
                <Check size={16} />
            </button>
        )}
        <button 
            onClick={() => onDelete(n._id)}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Delete"
        >
            <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;