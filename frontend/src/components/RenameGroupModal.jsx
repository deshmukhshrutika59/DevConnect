
import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { X, Save, Edit3, Loader2 } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

export default function RenameGroupModal({ convoId, currentName, onClose, onDone }) {
  const { token } = useAuth();
  const [name, setName] = useState(currentName || "");
  const [loading, setLoading] = useState(false);

  const save = async () => {
    if (!name.trim()) return alert("Enter a valid name");
    
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/chat/rename-group/${convoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Rename failed");
      
      onDone && onDone(data);
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-fade-in-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Edit3 size={18} />
             </div>
             <h3 className="font-bold text-gray-800">Rename Group</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">
                New Group Name
            </label>
            <input 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-purple-100 focus:border-purple-500 outline-none text-gray-800 placeholder-gray-400 transition-all"
                placeholder="e.g. Project Team Alpha"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && save()}
            />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={save} 
            disabled={loading || !name.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium transition-all shadow-sm"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}