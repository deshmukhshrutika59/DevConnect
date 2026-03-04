
import React, { useState } from "react";
import { Heart, MessageCircle, Share2, MoreHorizontal, Send } from "lucide-react";
import { toggleLike, addComment, sharePost } from "../api/posts";
import { getAvatarUrl } from "../utils/avatar";

const PostCard = ({ post, currentUser }) => {
  const [liked, setLiked] = useState(post.likes?.includes(currentUser?._id));
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState(post.comments || []);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

  const handleLike = async () => {
    try {
      const res = await toggleLike(post._id);
      setLiked(res.data.liked);
      setLikesCount(res.data.likes);
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const res = await addComment(post._id, comment);
      setComments(res.data.comments);
      setComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleShare = async () => {
    try {
      await sharePost(post._id, "Check this out!");
      alert("✅ Post shared successfully!");
    } catch (err) {
      console.error("Error sharing post:", err);
    }
  };

  // ✅ Compute avatar safely (UNCHANGED)
  const avatarSrc = post.user?.avatarUrl
    ? `${backendUrl}${post.user.avatarUrl}`
    : "/default-avatar.jpg";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6 hover:shadow-md transition-shadow duration-200">
      
      {/* Author Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img
            src={getAvatarUrl(post.user?.avatarUrl, post.user?.name, backendUrl)}
            alt={post.user?.name || "User"}
            className="w-10 h-10 rounded-full object-cover border border-gray-100"
          />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">
              {post.user?.name || "Unknown User"}
            </h3>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
            <MoreHorizontal size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="mb-4">
        {post.title && (
            <h4 className="font-bold text-gray-900 text-lg mb-2">{post.title}</h4>
        )}
        {post.content && (
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Media Gallery */}
      {post.media?.length > 0 && (
        <div className="mb-4 space-y-2">
          {post.media.map((m, i) => {
            const mediaUrl = m.url.startsWith("http")
              ? m.url
              : `${backendUrl}${m.url}`;
            
            return (
              <div key={i} className="w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                {m.type === "video" ? (
                  <video
                    src={mediaUrl}
                    controls
                    className="w-full max-h-[500px] object-contain bg-black"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="post content"
                    className="w-full max-h-[500px] object-cover hover:scale-[1.01] transition-transform duration-300"
                    onError={(e) => (e.target.src = "/default-image.png")}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Stats Bar */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100 mt-2">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors group ${
            liked ? "text-red-500 bg-red-50" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Heart size={20} className={`transition-transform group-active:scale-125 ${liked ? "fill-current" : ""}`} />
          <span className="font-medium text-sm">{likesCount}</span>
        </button>

        <button 
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            onClick={() => document.getElementById(`comment-input-${post._id}`)?.focus()}
        >
          <MessageCircle size={20} />
          <span className="font-medium text-sm">{comments.length}</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-green-600 transition-colors"
        >
          <Share2 size={20} />
          <span className="font-medium text-sm">Share</span>
        </button>
      </div>

      {/* Comments Area */}
      <div className="bg-gray-50/50 -mx-5 -mb-5 p-5 border-t border-gray-100 rounded-b-2xl">
        {comments.length > 0 && (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {comments.map((c, i) => {
                const commentAvatar = c.user?.avatarUrl
                ? `${backendUrl}${c.user.avatarUrl}`
                : "/default-avatar.png";

                return (
                <div key={i} className="flex gap-3 group">
                    <img
                        src={commentAvatar}
                        alt={c.user?.name || "User"}
                        onError={(e) => (e.target.src = "/default-avatar.png")}
                        className="w-8 h-8 rounded-full object-cover mt-1"
                    />
                    <div className="flex-1">
                        <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none shadow-sm">
                            <span className="font-bold text-gray-900 text-xs block mb-0.5">{c.user?.name || "Unknown"}</span>
                            <p className="text-sm text-gray-700">{c.content}</p>
                        </div>
                    </div>
                </div>
                );
            })}
            </div>
        )}

        {/* Comment Input */}
        <form onSubmit={handleComment} className="flex items-center gap-2 relative">
            <img
                src={getAvatarUrl(currentUser?.avatarUrl, currentUser?.name, backendUrl)}
                alt="Me"
                className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
            <div className="flex-1 relative">
                <input
                    id={`comment-input-${post._id}`}
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all shadow-sm placeholder-gray-400"
                />
                <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="absolute right-2 top-1.5 p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                    <Send size={16} />
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default PostCard;