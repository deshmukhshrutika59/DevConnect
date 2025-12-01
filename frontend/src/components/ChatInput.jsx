import React, { useRef, useState } from "react";
import { Send, Image as ImageIcon, Video as VideoIcon, Smile, X, Loader2, Paperclip } from "lucide-react";
import { getSocket } from "../utils/socket";
import { useAuth } from "../contexts/AuthContext";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";

const ChatInput = ({ conversation, onSend }) => {
  const { user, token } = useAuth();
  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const typingRef = useRef(null);
  const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const handleInput = (e) => {
    setMessage(e.target.value);
    const socket = getSocket();
    if (!socket || !conversation) return;
    socket.emit("typing", { conversationId: conversation._id });

    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: conversation._id });
    }, 1200);
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + (emoji.native || emoji.colons || ""));
  };

  const handleFileUpload = async (file) => {
    if (!file || !conversation) return;
    try {
      const fd = new FormData();
      fd.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BACKEND}/api/upload/message-file`);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setUploadProgress(0);
        if (xhr.status !== 200 && xhr.status !== 201) {
          console.error("Upload failed", xhr.responseText);
          return;
        }

        const uploaded = JSON.parse(xhr.responseText);
        const mediaPayload = {
          ...uploaded,
          url: uploaded.url.startsWith("http")
            ? uploaded.url
            : `${BACKEND}${uploaded.url}`,
        };

        const socket = getSocket();
        const recipient =
          !conversation.isGroup &&
          conversation.participants.find((p) => p._id !== (user._id || user.id));

        socket.emit(
          "send_message",
          {
            conversationId: conversation._id,
            recipientId: recipient?._id || null,
            content: "",
            media: mediaPayload,
          },
          (ack) => {
            if (ack?.success) onSend && onSend(ack.message);
          }
        );
      };

      xhr.onerror = (e) => {
        setUploadProgress(0);
        console.error("Upload error", e);
      };

      xhr.send(fd);
    } catch (err) {
      console.error("File upload failed:", err);
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || !conversation) return;
    const socket = getSocket();

    const recipient =
      !conversation.isGroup &&
      conversation.participants.find((p) => p._id !== (user._id || user.id));

    socket.emit(
      "send_message",
      {
        conversationId: conversation._id,
        recipientId: recipient?._id || null,
        content: trimmed,
      },
      (ack) => {
        if (ack?.success) onSend && onSend(ack.message);
      }
    );
    setMessage("");
  };
  // --- LOGIC ENDS HERE ---

  return (
    <div className="relative border-t border-gray-200 bg-white px-4 py-3">
      
      {/* Upload Progress Bar */}
      {uploadProgress > 0 && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300 ease-out"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmoji && (
        <div className="absolute bottom-full left-4 mb-2 z-20 shadow-2xl rounded-2xl border border-gray-200 overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-500 uppercase">Pick an emoji</span>
                <button onClick={() => setShowEmoji(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            </div>
            <Picker 
                data={data} 
                onEmojiSelect={handleEmojiSelect} 
                theme="light" 
                previewPosition="none"
                skinTonePosition="none"
            />
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Actions Group */}
        <div className="flex items-center gap-1 mb-1">
            <button
                onClick={() => setShowEmoji((s) => !s)}
                className={`p-2 rounded-full transition-colors ${showEmoji ? 'bg-amber-100 text-amber-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
                title="Emoji"
            >
                <Smile size={20} />
            </button>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            <label
                htmlFor="imageUpload"
                className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full cursor-pointer transition-colors"
                title="Upload Image"
            >
                <ImageIcon size={20} />
                <input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="hidden"
                />
            </label>

            <label
                htmlFor="videoUpload"
                className="p-2 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-full cursor-pointer transition-colors"
                title="Upload Video"
            >
                <VideoIcon size={20} />
                <input
                    id="videoUpload"
                    type="file"
                    accept="video/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="hidden"
                />
            </label>
        </div>

        {/* Input Field */}
        <div className="flex-1 relative">
            <input
                className="w-full bg-gray-100 text-gray-800 placeholder-gray-500 border-none rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all outline-none resize-none"
                placeholder="Type a message..."
                value={message}
                onChange={handleInput}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            />
        </div>

        {/* Send Button */}
        <button
            onClick={handleSend}
            disabled={!message.trim() && uploadProgress === 0}
            className="mb-1 p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex-shrink-0"
        >
            {uploadProgress > 0 ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <Send size={18} className={message.trim() ? "translate-x-0.5" : ""} />
            )}
        </button>
      </div>
    </div>
  );
};

export default ChatInput;