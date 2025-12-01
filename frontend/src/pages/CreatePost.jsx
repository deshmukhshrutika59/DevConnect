
import React, { useState } from "react";
import { createPost } from "../api/posts";
import { Image, Video, X, Send } from "lucide-react";

const CreatePost = ({ onPostCreated }) => {
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    setMediaFiles((prev) => [...prev, ...newFiles]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", content);
    mediaFiles.forEach((file) => formData.append("media", file));

    const res = await createPost(formData);
    setContent("");
    setMediaFiles([]);
    onPostCreated(res.data);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 transition-all duration-200 hover:shadow-md">
      {/* Text Input Area */}
      <div className="w-full">
        <textarea
          className="w-full resize-none border-none focus:ring-0 text-gray-800 placeholder-gray-400 text-base min-h-[80px] bg-transparent outline-none"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {/* Divider */}
      {mediaFiles.length > 0 && <div className="border-t border-gray-100 my-3"></div>}

      {/* Selected File Chips (No preview logic added, just styling names) */}
      {mediaFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {mediaFiles.map((m, i) => (
            <div 
              key={i} 
              className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium border border-blue-100 animate-fade-in"
            >
              <span className="truncate max-w-[150px]">{m.name}</span>
              <button 
                className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                onClick={() => setMediaFiles(mediaFiles.filter((_, idx) => idx !== i))}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-gray-100 my-2"></div>

      {/* Actions Toolbar */}
      <div className="flex justify-between items-center mt-2">
        <div className="flex gap-2">
          <label className="cursor-pointer group flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors" title="Add Image">
            <Image size={20} className="text-gray-500 group-hover:text-blue-500" />
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </label>

          <label className="cursor-pointer group flex items-center justify-center p-2 hover:bg-gray-100 rounded-full transition-colors" title="Add Video">
            <Video size={20} className="text-gray-500 group-hover:text-green-500" />
            <input
              type="file"
              accept="video/*"
              multiple
              hidden
              onChange={handleFileChange}
            />
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() && mediaFiles.length === 0}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
        >
          <span>Post</span>
          <Send size={16} className="hidden sm:block" />
        </button>
      </div>
    </div>
  );
};

export default CreatePost;