
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  Camera,
  Edit2,
  Send,
  X,
  Image,
  Video,
  Heart,
  Share2,
  MessageCircle,
  MoreHorizontal
} from "lucide-react";
import SuggestedProfiles from "../components/SuggestedProfiles";
import SearchProfiles from "../components/SearchProfiles";
import ConnectedProfiles from "../components/ConnectedProfiles";
import SharePostModal from "../components/SharePostModal";
import { getAvatarUrl } from "../utils/avatar";

const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const Dashboard = () => {
  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [feed, setFeed] = useState([]);
  const [commentMap, setCommentMap] = useState({});
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [processing, setProcessing] = useState(null);
  const [sharePost, setSharePost] = useState(null);
  const [recommendedFeed, setRecommendedFeed] = useState([]);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchFeed();
      fetchRecommendedPosts();
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch profile");
      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRecommendedPosts = async () => {
    try {
      const res = await fetch(`${BACKEND}/api/recommend/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) return;

      setRecommendedFeed(data.results || []);
    } catch (err) {
      console.error("AI Recommended posts error:", err);
      setRecommendedFeed([]);
    }
  };

  const fetchFeed = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setFeed([]);
        return;
      }
      const data = await res.json();
      setFeed(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setFeed([]);
    }
  };

  const handleMediaChange = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newMedia = files.map((f) => ({ file: f, type }));
    setMediaFiles((prev) => [...prev, ...newMedia]);
    const newPreviews = files.map((f) => ({
      url: URL.createObjectURL(f),
      type,
    }));
    setMediaPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title && !newPost.content && mediaFiles.length === 0) return;
    try {
      const form = new FormData();
      form.append("title", newPost.title);
      form.append("content", newPost.content);
      mediaFiles.forEach((m) => form.append("media", m.file));
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error("Post creation failed");
      setNewPost({ title: "", content: "" });
      setMediaFiles([]);
      setMediaPreviews([]);
      fetchFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLike = async (postId) => {
    const uid = user?.id || user?._id;
    if (!uid) return;

    try {
      const toggleLocal = (list) =>
        list.map((p) => {
          if (p._id !== postId) return p;
          const has = p.likes?.some((id) => id.toString() === uid.toString());
          return {
            ...p,
            likes: has
              ? p.likes.filter((id) => id.toString() !== uid.toString())
              : [...p.likes, uid],
          };
        });

      setFeed((prev) => toggleLocal(prev));
      setRecommendedFeed((prev) => toggleLocal(prev));

      const res = await fetch(`${BACKEND}/api/posts/${postId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Like failed");

      const liked = data.liked === true;

      const applyServer = (list) =>
        list.map((p) => {
          if (p._id !== postId) return p;
          return {
            ...p,
            likes: liked
              ? Array.from(new Set([...p.likes, uid]))
              : p.likes.filter((id) => id.toString() !== uid.toString()),
          };
        });

      setFeed((prev) => applyServer(prev));
      setRecommendedFeed((prev) => applyServer(prev));
      fetchRecommendedPosts();
    } catch (err) {
      console.error("Like error:", err);
      fetchFeed();
      fetchRecommendedPosts();
    }
  };

  const handleShare = (post) => setSharePost(post);

  const handleAddComment = async (postId) => {
    const content = commentMap[postId];
    if (!content) return;

    try {
      const res = await fetch(`${BACKEND}/api/posts/${postId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error("Comment failed");

      const newComment = await res.json();
      setCommentMap({ ...commentMap, [postId]: "" });

      const addLocalComment = (list) =>
        list.map((p) =>
          p._id === postId
            ? { ...p, comments: [...p.comments, newComment] }
            : p
        );

      setFeed((prev) => addLocalComment(prev));
      setRecommendedFeed((prev) => addLocalComment(prev));
      fetchRecommendedPosts();

    } catch (err) {
      console.error("Comment error:", err);
      fetchFeed();
      fetchRecommendedPosts();
    }
  };


  const handleDisconnect = async (targetId) => {
    if (processing) return;
    setProcessing(targetId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/users/${targetId}/disconnect`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Disconnection failed");
      await refreshUser(); // Assuming this is defined in context or parent, kept as is
    } catch (err) {
      console.error("Disconnect error:", err);
      // alert(err.message || "Disconnection failed"); 
    } finally {
      setProcessing(null);
    }
  };
  // --- LOGIC ENDS HERE ---

  if (!token) return <div className="p-6 text-center text-gray-500">Please login to view dashboard.</div>;
  if (!profile) return <div className="p-6 flex justify-center text-blue-600">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT SIDEBAR - Profile (Hidden on mobile, block on Desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="sticky top-24 space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="px-6 pb-6 relative">
                  <div className="relative -mt-12 mb-4 flex justify-center">
                    <img
                      src={getAvatarUrl(user.avatarUrl, user.name, BACKEND)}
                      alt="avatar"
                      className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
                    />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {profile.bio || "Passionate Developer & Creator"}
                    </p>
                  </div>
                  <div className="mt-6 border-t pt-4 flex justify-around text-center">
                     <div>
                        <span className="block font-bold text-gray-800">{user.connections?.length || 0}</span>
                        <span className="text-xs text-gray-500">Connections</span>
                     </div>
                     <div>
                        <span className="block font-bold text-gray-800">0</span>
                        <span className="text-xs text-gray-500">Posts</span>
                     </div>
                  </div>
                </div>
              </div>
              
              {/* Copyright/Footer tiny text */}
              <div className="text-xs text-gray-400 text-center px-4">
                &copy; 2024 DevConnect. All rights reserved.
              </div>
            </div>
          </div>

          {/* CENTER FEED - (Full width on mobile, center on Desktop) */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Create Post Widget */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
              <div className="flex gap-4 mb-4">
                 <img
                    src={getAvatarUrl(user.avatarUrl, user.name, BACKEND)}
                    alt="Me"
                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                  />
                  <div className="flex-1 space-y-2">
                     <input
                      type="text"
                      placeholder="Post Title (Optional)"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="w-full bg-gray-50 border-none rounded-lg px-4 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-100 outline-none"
                    />
                    <textarea
                      placeholder={`What's on your mind, ${profile.name.split(' ')[0]}?`}
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="w-full bg-transparent resize-none outline-none text-gray-700 text-base min-h-[60px]"
                    />
                  </div>
              </div>

              {/* Media Previews */}
              {mediaPreviews.length > 0 && (
                <div className="flex gap-3 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                  {mediaPreviews.map((m, i) => (
                    <div key={i} className="relative flex-shrink-0 group">
                      {m.type === "image" ? (
                        <img
                          src={m.url}
                          alt="preview"
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <video
                          src={m.url}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200 bg-black"
                        />
                      )}
                      <button
                        className="absolute -top-2 -right-2 bg-white text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md border border-gray-200 transition"
                        onClick={() => {
                          setMediaFiles((prev) => prev.filter((_, idx) => idx !== i));
                          setMediaPreviews((prev) => prev.filter((_, idx) => idx !== i));
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="border-t pt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  >
                    <Image size={18} className="text-blue-500" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                  >
                    <Video size={18} className="text-green-500" />
                    <span className="hidden sm:inline">Video</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  {/* Hidden inputs */}
                  <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleMediaChange(e, "image")} />
                  <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => handleMediaChange(e, "video")} />
                  
                  {mediaFiles.length > 0 && (
                    <button
                      onClick={() => { setMediaFiles([]); setMediaPreviews([]); }}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={handleCreatePost}
                    disabled={!newPost.content && !newPost.title && mediaFiles.length === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* AI Recommendations Banner (if exists) */}
            {recommendedFeed.length > 0 && (
               <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-4 text-white shadow-md flex items-center justify-between">
                  <div>
                     <h3 className="font-bold text-lg">Recommended for you</h3>
                     <p className="text-purple-100 text-sm">Based on your interests</p>
                  </div>
                  <div className="bg-white/20 p-2 rounded-lg">
                     <Heart className="fill-white text-white" size={20} />
                  </div>
               </div>
            )}

            {/* FEED POSTS */}
            <div className="space-y-6">
              {[...feed, ...recommendedFeed].map((post) => {
                 // De-duplicate logic if needed, simplifed here for styling
                 return (
                <div key={post._id} className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow duration-300">
                  {/* Post Header */}
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={getAvatarUrl(post.user?.avatarUrl, post.user?.name, BACKEND)}
                        alt="avatar"
                        className="w-10 h-10 rounded-full object-cover border border-gray-100"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm">{post.user?.name || "Unknown"}</h4>
                        <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    {/* Connect Button Logic */}
                    {post.user?._id && post.user._id !== (user?._id || user?.id) && (
                        <button
                          onClick={() =>
                            (user?.connections || []).includes(post.user?._id)
                              ? handleDisconnect(post.user._id)
                              : handleConnect(post.user._id) // Assuming handleConnect exists in scope or needs to be imported/defined
                          }
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                            (user?.connections || []).includes(post.user?._id)
                              ? "border-red-200 text-red-600 hover:bg-red-50"
                              : "border-blue-200 text-blue-600 hover:bg-blue-50"
                          }`}
                        >
                          {(user?.connections || []).includes(post.user?._id) ? "Disconnect" : "+ Connect"}
                        </button>
                    )}
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-2">
                    {post.title && <h3 className="font-bold text-lg text-gray-900 mb-1">{post.title}</h3>}
                    {post.content && <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>}
                  </div>

                  {/* Post Media */}
                  {post.media?.length > 0 && (
                    <div className="mt-2">
                       {/* Simple grid for multiple images could go here, keeping stack for now */}
                      {post.media.map((m, idx) => {
                        const src = typeof m === "string" ? `${BACKEND}${m}` : `${BACKEND}${m.url}`;
                        const type = typeof m === "string" ? (m.endsWith(".mp4") ? "video" : "image") : m.type;
                        
                        return type === "video" ? (
                          <video key={idx} src={src} controls className="w-full max-h-[500px] bg-black" />
                        ) : (
                          <img key={idx} src={src} alt="post" className="w-full h-auto object-cover max-h-[600px]" />
                        );
                      })}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                         <div className="flex -space-x-1">
                            {/* Fake likes overlap visuals */}
                            {post.likes?.length > 0 && <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center"><Heart size={8} className="fill-white text-white"/></div>}
                         </div>
                         <span>{post.likes?.length || 0} Likes</span>
                      </div>
                      <div className="text-sm text-gray-500">
                         {post.comments?.length || 0} Comments
                      </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="px-2 py-2 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleLike(post._id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
                        (post.likes || []).includes(user?._id || user?.id)
                          ? "text-red-500 bg-red-50"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Heart
                        size={20}
                        className={(post.likes || []).includes(user?._id || user?.id) ? "fill-current" : ""}
                      />
                      <span className="font-medium text-sm">Like</span>
                    </button>

                    <button
                      onClick={() => document.getElementById(`comment-input-${post._id}`)?.focus()}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <MessageCircle size={20} />
                      <span className="font-medium text-sm">Comment</span>
                    </button>

                    <button
                      onClick={() => handleShare(post)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 size={20} />
                      <span className="font-medium text-sm">Share</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  <div className="px-4 pb-4 bg-gray-50/50">
                    {post.comments?.length > 0 && (
                      <div className="space-y-3 pt-3 mb-3">
                        {post.comments.map((c) => (
                          <div key={c._id} className="flex gap-2">
                            <img
                              src={getAvatarUrl(c.user?.avatarUrl, c.user?.name, `${import.meta.env.VITE_BACKEND_URL}`)}
                              alt="user"
                              className="w-8 h-8 rounded-full object-cover mt-1"
                            />
                            <div className="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-2">
                              <span className="font-bold text-xs text-gray-900 block">{c.user?.name || "Unknown"}</span>
                              <span className="text-sm text-gray-700">{c.content}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex gap-2 mt-2">
                      <img 
                        src={getAvatarUrl(user.avatarUrl, user.name, BACKEND)} 
                        className="w-8 h-8 rounded-full object-cover border border-gray-200" 
                        alt="me"
                      />
                      <div className="flex-1 relative">
                        <input
                          id={`comment-input-${post._id}`}
                          type="text"
                          placeholder="Write a comment..."
                          className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          value={commentMap[post._id] || ""}
                          onChange={(e) => setCommentMap({ ...commentMap, [post._id]: e.target.value })}
                          onKeyDown={(e) => e.key === "Enter" && handleAddComment(post._id)}
                        />
                        <button 
                           onClick={() => handleAddComment(post._id)}
                           className="absolute right-2 top-1.5 text-blue-600 hover:bg-blue-50 p-1 rounded-full transition"
                        >
                           <Send size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
            
          </div>

          {/* RIGHT SIDEBAR - Widgets (Hidden on mobile, block on Desktop) */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
             <div className="sticky top-24 space-y-6">
                <SearchProfiles />
                <SuggestedProfiles />
                <ConnectedProfiles />
             </div>
          </div>
        </div>
      </div>

      {/* Share Post Modal (Unchanged logic, just ensure styling matches) */}
      {sharePost && (
        <SharePostModal
          post={sharePost}
          onClose={() => setSharePost(null)}
          onShared={() => {
            alert("✅ Post shared successfully!");
            setSharePost(null);
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;