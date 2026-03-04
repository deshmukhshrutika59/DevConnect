
// src/pages/Profile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { 
  Camera, 
  Edit2, 
  X, 
  Image, 
  Video, 
  Send, 
  Heart, 
  Share2, 
  MapPin, 
  Briefcase, 
  Github, 
  Save, 
  Trash2, 
  MoreVertical 
} from "lucide-react";
import Skeleton from "@mui/material/Skeleton";
import ForwardMessageModal from "../components/ForwardMessageModal";
import { getAvatarUrl } from "../utils/avatar";

const BACKEND = `${import.meta.env.VITE_BACKEND_URL}`; // extracted for consistency

const Profile = () => {
  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const { user, token } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [formData, setFormData] = useState({
    name: "", bio: "", location: "", experienceLevel: "", githubUsername: "", techStack: []
  });
  const [posts, setPosts] = useState([]);
  const [comments, setComments] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newPost, setNewPost] = useState({ title: "", content: "" });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);
  const [commentMap, setCommentMap] = useState({});
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingPostData, setEditingPostData] = useState({ title: "", content: "" });
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [shareModal, setShareModal] = useState({ open: false, postId: null });
  const [newTech, setNewTech] = useState("");

  // Fetch profile
  useEffect(() => { if (token) fetchProfile(); }, [token]);
  
  // Fetch posts & comments
  useEffect(() => {
    const id = user?._id ?? profile?._id;
    if (id && token) {
      fetchUserPosts();
      fetchUserComments();
    }
  }, [user, profile, token]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setProfile(data);
      setFormData({
        name: data.name || "",
        bio: data.bio || "",
        location: data.location || "",
        experienceLevel: data.experienceLevel || "",
        githubUsername: data.githubUsername || "",
        techStack: data.techStack || []
      });
    } catch (err) { console.error("Profile fetch error:", err); }
  };

  const fetchUserPosts = async () => {
    setLoadingPosts(true);
    try {
      const id = user?._id ?? profile?._id;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/posts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const postsWithUser = data.map(p => ({ ...p, user: p.user || profile }));
      setPosts(Array.isArray(postsWithUser) ? postsWithUser : []);
    } catch (err) { console.error("Posts fetch error:", err); setPosts([]); }
    setLoadingPosts(false);
  };

  const fetchUserComments = async () => {
    setLoadingComments(true);
    try {
      const id = user?._id ?? profile?._id;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/comments`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (err) { console.error("Comments fetch error:", err); setComments([]); }
    setLoadingComments(false);
  };

  const handleFileChange = (e) => setPhotoFile(e.target.files[0]);

  const handleAddTech = () => {
    if (newTech.trim() && !formData.techStack.includes(newTech.trim())) {
      setFormData({ ...formData, techStack: [...formData.techStack, newTech.trim()] });
      setNewTech("");
    }
  };

  const handleRemoveTech = (tech) =>
    setFormData({ ...formData, techStack: formData.techStack.filter((t) => t !== tech) });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.keys(formData).forEach((key) => key === "techStack" ? form.append(key, JSON.stringify(formData[key])) : form.append(key, formData[key]));
    if (photoFile) form.append("photo", photoFile);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/me`, { method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: form });
      const data = await res.json();
      setProfile(data);
      setEditing(false);
      setPhotoFile(null);
    } catch (err) { console.error(err); }
  };

  // Media handlers
  const handleImageClick = () => imageInputRef.current?.click();
  const handleVideoClick = () => videoInputRef.current?.click();
  const handleMediaChange = (e, type) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newMedia = files.map(file => ({ file, type }));
    setMediaFiles(prev => [...prev, ...newMedia]);
    const newPreviews = files.map(file => ({ url: URL.createObjectURL(file), type }));
    setMediaPreviews(prev => [...prev, ...newPreviews]);
    e.target.value = "";
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPost.title && !newPost.content && mediaFiles.length === 0) return;

    try {
      const form = new FormData();
      form.append("title", newPost.title);
      form.append("content", newPost.content);
      mediaFiles.forEach(m => form.append("media", m.file));
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      setNewPost({ title: "", content: "" });
      setMediaFiles([]);
      setMediaPreviews([]);
      fetchUserPosts();
    } catch (err) { console.error(err); }
  };

  // Edit post handlers
  const startEditPost = (post) => {
    const ownerId = post.user?._id || post.user?.id || null;
    const myId = profile?._id || user?._id || user?.id || null;
    if (!myId || ownerId !== myId) return alert("You can only edit your own posts.");
    setEditingPostId(post._id);
    setEditingPostData({ title: post.title || "", content: post.content || "" });
  };

  const cancelEditPost = () => { setEditingPostId(null); setEditingPostData({ title: "", content: "" }); };

  const saveEditPost = async (postId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editingPostData),
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if (!res.ok) {
        console.error("Post update failed:", res.status, data);
        alert((data && data.message) ? data.message : (typeof data === 'string' ? data : 'Update failed'));
        return;
      }
      if (data && typeof data === 'object') {
        setPosts(prev => prev.map(p => p._id === postId ? data : p));
      }
      cancelEditPost();
      fetchUserPosts();
    } catch (err) { console.error("Post update error:", err); }
  };

  const handleAddComment = async (postId) => {
    const content = commentMap[postId];
    if (!content) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      setCommentMap({ ...commentMap, [postId]: "" });
      fetchUserPosts();
      fetchUserComments();
    } catch (err) { console.error(err); }
  };

  // Edit comment handlers
  const startEditComment = (post, comment) => {
    const ownerId = comment.user?._id || comment.user?.id || null;
    const myId = profile?._id || user?._id || user?.id || null;
    if (!myId || ownerId !== myId) return alert("You can only edit your own comments.");
    setEditingCommentId(comment._id);
    setEditingCommentText(comment.content || "");
  };

  const cancelEditComment = () => { setEditingCommentId(null); setEditingCommentText(""); };

  const saveEditComment = async (postId, commentId) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/comment/${commentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editingCommentText }),
      });
      const text = await res.text();
      let data;
      try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
      if (!res.ok) {
        console.error("Comment update failed:", res.status, data);
        alert((data && data.message) ? data.message : (typeof data === 'string' ? data : 'Comment update failed'));
        return;
      }
      if (data && typeof data === 'object') {
        setPosts(prev => prev.map(p => {
          if (p._id !== postId) return p;
          return { ...p, comments: (p.comments || []).map(c => c._id === data._id ? { ...c, content: data.content } : c) };
        }));
      }
      cancelEditComment();
      fetchUserPosts();
      fetchUserComments();
    } catch (err) { console.error("Comment update error:", err); }
  };

  const handleToggleLike = async (postId) => {
    try { 
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/like`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); 
      fetchUserPosts(); 
    } catch (err) { console.error(err); }
  };

  const handleShare = (postId) => {
    setShareModal({ open: true, postId });
  };
  
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserPosts();
    } catch (err) { console.error(err); }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/${postId}/comment/${commentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUserPosts();
      fetchUserComments();
    } catch (err) { console.error(err); }
  };
  // --- LOGIC ENDS HERE ---

  if (!profile) return (
    <div className="flex justify-center items-center min-h-screen">
       <Skeleton variant="rectangular" width="100%" height={300} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-4xl mx-auto pt-6 px-4 space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
             {/* Banner */}
             <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700"></div>

             <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    
                    {/* Avatar & Edit Overlay */}
                    <div className="-mt-16 relative group">
                        <img 
                            src={getAvatarUrl(profile.avatarUrl, profile.name, BACKEND)} 
                            alt="Profile" 
                            className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
                        />
                        {editing && (
                            <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                <Camera size={24}/>
                                <input type="file" className="hidden" onChange={handleFileChange}/>
                            </label>
                        )}
                    </div>

                    {/* Profile Details (Read Only) */}
                    {!editing && (
                        <div className="flex-1 mt-4 md:mt-2 w-full">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                    <p className="text-gray-500">{profile.email}</p>
                                </div>
                                <button 
                                    onClick={() => setEditing(true)} 
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                >
                                    <Edit2 size={16}/> Edit Profile
                                </button>
                            </div>
                            
                            <p className="mt-4 text-gray-700 leading-relaxed">{profile.bio || "No bio added yet."}</p>
                            
                            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
                                {profile.location && <div className="flex items-center gap-1"><MapPin size={16}/> {profile.location}</div>}
                                {profile.experienceLevel && <div className="flex items-center gap-1"><Briefcase size={16}/> {profile.experienceLevel}</div>}
                                {profile.githubUsername && <div className="flex items-center gap-1"><Github size={16}/> {profile.githubUsername}</div>}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {profile.techStack.map(t => (
                                    <span key={t} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                        {t}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Edit Form (Active) */}
                    {editing && (
                         <form onSubmit={handleUpdateProfile} className="flex-1 mt-4 w-full space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input 
                                    type="text" 
                                    value={formData.name} 
                                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                                    placeholder="Full Name" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={formData.location} 
                                    onChange={e => setFormData({ ...formData, location: e.target.value })} 
                                    placeholder="Location" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={formData.experienceLevel} 
                                    onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })} 
                                    placeholder="Experience (e.g., Senior Developer)" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                />
                                <input 
                                    type="text" 
                                    value={formData.githubUsername} 
                                    onChange={e => setFormData({ ...formData, githubUsername: e.target.value })} 
                                    placeholder="GitHub Username" 
                                    className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none"
                                />
                            </div>
                            <textarea 
                                value={formData.bio} 
                                onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                                placeholder="Tell us about yourself..." 
                                rows="3"
                                className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 outline-none resize-none"
                            />
                            
                            {/* Tech Stack Edit */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Tech Stack</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={newTech} 
                                        onChange={e => setNewTech(e.target.value)} 
                                        placeholder="Add skill (e.g. React)" 
                                        className="flex-1 border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none"
                                    />
                                    <button 
                                        type="button" 
                                        onClick={handleAddTech} 
                                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
                                    >
                                        Add
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formData.techStack.map(t => (
                                        <span key={t} className="px-3 py-1 bg-gray-100 rounded-full text-sm flex items-center gap-1 group">
                                            {t} 
                                            <X 
                                                size={14} 
                                                className="cursor-pointer text-gray-400 group-hover:text-red-500" 
                                                onClick={() => handleRemoveTech(t)}
                                            />
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button 
                                    type="button" 
                                    onClick={() => { setEditing(false); setPhotoFile(null); }} 
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    <Save size={18} /> Save Changes
                                </button>
                            </div>
                         </form>
                    )}
                </div>
             </div>
        </div>

        {/* Create Post Widget */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Create New Post</h3>
            <div className="flex gap-4">
                <img 
                    src={getAvatarUrl(profile.avatarUrl, profile.name, BACKEND)} 
                    alt="me" 
                    className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
                <div className="flex-1 space-y-3">
                     <input 
                        type="text" 
                        value={newPost.title} 
                        onChange={e => setNewPost({ ...newPost, title: e.target.value })} 
                        placeholder="Post Title (Optional)" 
                        className="w-full font-semibold text-gray-800 placeholder-gray-400 outline-none"
                     />
                     <textarea 
                        value={newPost.content} 
                        onChange={e => setNewPost({ ...newPost, content: e.target.value })} 
                        placeholder="What's on your mind?" 
                        className="w-full resize-none outline-none text-gray-600 placeholder-gray-400 min-h-[60px]"
                     />
                </div>
            </div>

            {/* Media Previews */}
            {mediaPreviews.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 pl-14">
                    {mediaPreviews.map((m,i) => (
                        <div key={i} className="relative group shrink-0">
                            {m.type==="image" ? (
                                <img src={m.url} className="w-24 h-24 object-cover rounded-lg border border-gray-200"/>
                            ) : (
                                <video src={m.url} className="w-24 h-24 object-cover rounded-lg bg-black border border-gray-200" />
                            )}
                            <button 
                                className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md border border-gray-200 hover:text-red-500 transition" 
                                onClick={()=>{setMediaFiles(prev=>prev.filter((_,idx)=>idx!==i));setMediaPreviews(prev=>prev.filter((_,idx)=>idx!==i));}}
                            >
                                <X size={12}/>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-between items-center mt-4 pl-14 pt-3 border-t border-gray-100">
                <div className="flex gap-2">
                     <button type="button" onClick={handleImageClick} className="p-2 text-gray-500 hover:bg-blue-50 hover:text-blue-600 rounded-full transition"><Image size={20}/></button>
                     <button type="button" onClick={handleVideoClick} className="p-2 text-gray-500 hover:bg-green-50 hover:text-green-600 rounded-full transition"><Video size={20}/></button>
                     {/* Hidden Inputs */}
                     <input ref={imageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => handleMediaChange(e, "image")}/>
                     <input ref={videoInputRef} type="file" accept="video/*" multiple className="hidden" onChange={e => handleMediaChange(e, "video")}/>
                </div>
                <div className="flex gap-2">
                     {mediaFiles.length > 0 && <button onClick={()=>{setMediaFiles([]);setMediaPreviews([]);}} className="text-gray-500 hover:text-gray-700 px-3 text-sm font-medium">Clear</button>}
                     <button onClick={handleCreatePost} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium transition shadow-sm">Post</button>
                </div>
            </div>
        </div>

        {/* Content Section: Posts & Comments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            
            {/* Main Column: Posts */}
            <div className="lg:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-gray-800">Your Posts</h3>
                
                {loadingPosts ? <Skeleton variant="rectangular" height={200}/> : posts.length===0 ? (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200 text-gray-500">
                        <Image size={48} className="mx-auto mb-2 opacity-20"/>
                        <p>You haven't posted anything yet.</p>
                    </div>
                ) : (
                posts.map(post => (
                  <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                           <img src={getAvatarUrl(post.user?.avatarUrl, post.user?.name, BACKEND)} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-gray-100"/>
                           <div>
                              <div className="font-bold text-gray-900 text-sm">{post.user?.name || profile.name}</div>
                              <div className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</div>
                           </div>
                        </div>
                        {post.user?._id === profile._id && (
                           <div className="flex items-center gap-1">
                               <button onClick={()=>startEditPost(post)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full"><Edit2 size={16}/></button>
                               <button onClick={()=>handleDeletePost(post._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full"><Trash2 size={16}/></button>
                           </div>
                        )}
                      </div>

                      {/* Post Content */}
                      {editingPostId === post._id ? (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <input className="w-full border p-2 rounded bg-white" value={editingPostData.title} onChange={e => setEditingPostData(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" />
                          <textarea className="w-full border p-2 rounded bg-white" value={editingPostData.content} onChange={e => setEditingPostData(prev => ({ ...prev, content: e.target.value }))} placeholder="Content" rows={3}/>
                          <div className="flex gap-2 justify-end">
                            <button onClick={cancelEditPost} className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                            <button onClick={() => saveEditPost(post._id)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {post.title && <h4 className="font-bold text-lg mb-2 text-gray-900">{post.title}</h4>}
                          <p className="text-gray-700 leading-relaxed">{post.content}</p>
                        </>
                      )}
                    </div>
                    
                    {/* Media Grid */}
                    {post.media?.length>0 && (
                        <div className="bg-black/5 grid grid-cols-2 gap-0.5 border-t border-b border-gray-100">
                            {post.media.map((m,idx)=> {
                                const path=typeof m==="string"?m:(m?.url||m?.path||''); if(!path)return null;
                                const ext=path.split('.').pop().toLowerCase(); const src=`${BACKEND}${path}`;
                                return ["mp4","webm","mov"].includes(ext) 
                                ? <video key={idx} src={src} controls className="w-full h-64 object-cover bg-black"/>
                                : <img key={idx} src={src} alt="media" className="w-full h-64 object-cover"/>
                            })}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                      <button className="flex items-center gap-2 hover:text-red-500 transition" onClick={()=>handleToggleLike(post._id)}><Heart size={18}/> {post.likes?.length||0}</button>
                      <button className="flex items-center gap-2 hover:text-blue-500 transition" onClick={()=>document.getElementById(`comment-input-${post._id}`)?.focus()}><Send size={18}/> {post.comments?.length||0}</button>
                      <button className="flex items-center gap-2 hover:text-gray-900 transition" onClick={()=>handleShare(post._id)}><Share2 size={18}/> {post.shares||0}</button>
                    </div>

                    {/* Comments Section */}
                    <div className="bg-gray-50/50 px-5 pb-5 pt-2 border-t border-gray-100">
                      <div className="space-y-3 mb-4">
                        {Array.isArray(post.comments) && post.comments.length>0 ? post.comments.map(c=>(
                          <div key={c._id} className="flex gap-3 text-sm group">
                            <img src={getAvatarUrl(c.user?.avatarUrl, c.user?.name, BACKEND)} alt="avatar" className="w-8 h-8 rounded-full object-cover"/>
                            <div className="flex-1">
                                <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none">
                                    <span className="font-bold text-gray-900 block text-xs">{c.user?.name || profile.name}</span>
                                    
                                    {editingCommentId === c._id ? (
                                        <div className="mt-2 space-y-2">
                                            <input className="w-full border p-1 rounded text-sm" value={editingCommentText} onChange={e=>setEditingCommentText(e.target.value)} />
                                            <div className="flex gap-2 text-xs">
                                                <button onClick={()=>saveEditComment(post._id, c._id)} className="text-blue-600 font-bold">Save</button>
                                                <button onClick={cancelEditComment} className="text-gray-500">Cancel</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-700">{c.content}</p>
                                    )}
                                </div>
                                {/* Comment Actions */}
                                <div className="flex items-center gap-3 mt-1 ml-2 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {c.user?._id===profile._id && (
                                         <>
                                            <button className="hover:text-blue-600" onClick={()=>startEditComment(post, c)}>Edit</button>
                                            <button className="hover:text-red-600" onClick={()=>handleDeleteComment(post._id, c._id)}>Delete</button>
                                         </>
                                     )}
                                </div>
                            </div>
                          </div>
                        )) : null}
                      </div>

                      {/* Comment Input */}
                      <div className="flex items-center gap-2">
                        <img src={getAvatarUrl(profile.avatarUrl, profile.name, BACKEND)} className="w-8 h-8 rounded-full"/>
                        <div className="flex-1 relative">
                            <input 
                                id={`comment-input-${post._id}`} 
                                type="text" 
                                value={commentMap[post._id]||""} 
                                onChange={e=>setCommentMap({...commentMap,[post._id]:e.target.value})} 
                                placeholder="Write a comment..." 
                                className="w-full border border-gray-300 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-blue-500"
                            />
                            <button onClick={()=>handleAddComment(post._id)} className="absolute right-2 top-1.5 text-blue-600 p-1 hover:bg-blue-50 rounded-full">
                                <Send size={16}/>
                            </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )))}
            </div>

            {/* Right Column: Your Comments Activity */}
            <div className="space-y-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sticky top-24">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MoreVertical size={20} className="text-gray-400"/> Activity Log
                    </h3>
                    
                    {loadingComments ? <Skeleton variant="rectangular" height={100}/> : comments.length===0 ? <p className="text-gray-500 text-sm">No recent activity.</p> :
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {comments.map(c => (
                        <div key={c._id} className="text-sm border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                            <p className="text-gray-500 text-xs mb-1">Commented on <span className="font-medium text-gray-700">{c.postTitle}</span></p>
                            
                            {editingCommentId === c._id ? (
                                <div className="mt-1 space-y-2">
                                    <input className="w-full border p-1 rounded text-xs" value={editingCommentText} onChange={e=>setEditingCommentText(e.target.value)} />
                                    <div className="flex gap-2 text-xs">
                                        <button onClick={()=>saveEditComment(c.postId, c._id)} className="text-blue-600">Save</button>
                                        <button onClick={cancelEditComment} className="text-gray-400">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-2 rounded-lg text-gray-700 italic border border-gray-100 relative group">
                                    "{c.content}"
                                    <div className="absolute top-1 right-1 hidden group-hover:flex bg-white shadow rounded border border-gray-100">
                                        <button className="p-1 hover:text-blue-600" onClick={()=>startEditComment({ _id: c.postId }, c)}><Edit2 size={10}/></button>
                                        <button className="p-1 hover:text-red-600" onClick={()=>handleDeleteComment(c.postId, c._id)}><Trash2 size={10}/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                        ))}
                    </div>
                    }
                </div>
            </div>
        </div>

      </div>
      
      {/* Share Modal */}
      {shareModal.open && (
        <ForwardMessageModal
          postId={shareModal.postId}
          onClose={() => setShareModal({ open: false, postId: null })}
          onForward={() => {
            alert("Post shared successfully!");
            setShareModal({ open: false, postId: null });
            fetchUserPosts();
          }}
        />
      )}
    </div>
  );
};

export default Profile;