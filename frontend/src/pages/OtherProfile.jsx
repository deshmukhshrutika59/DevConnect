
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { 
  Heart, 
  Send, 
  Share2, 
  UserPlus, 
  UserMinus, 
  UserCheck, 
  MapPin, 
  Calendar 
} from "lucide-react";
import { getAvatarUrl } from "../utils/avatar";
const BACKEND = import.meta.env.VITE_BACKEND_URL || `${import.meta.env.VITE_BACKEND_URL}`;

const OtherProfile = () => {
  // --- LOGIC STARTS HERE (UNCHANGED) ---
  const { id } = useParams();
  const { token, user, refreshUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [posts, setPosts] = useState([]);
  const [mutualConnections, setMutualConnections] = useState([]);
  const [processing, setProcessing] = useState(null);

  // Fetch profile and check connection
  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load profile");
        const data = await res.json();
        setProfile(data);

        const refreshedUser = await refreshUser();
        const connectedIds = refreshedUser?.connections?.map(c => c._id || c) || [];
        setIsConnected(connectedIds.includes(data._id));

        // Compute mutual connections
        const profileConnections = data.connections?.map(c => c._id || c) || [];
        const mutual = profileConnections.filter(cId => connectedIds.includes(cId));
        setMutualConnections(mutual);

        // Fetch posts of the viewed profile
        const postsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/posts/user/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(postsData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, token, refreshUser]);

  const handleConnect = async () => {
    if (processing) return;
    setProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/connect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Connection failed");
      await refreshUser();
      setIsConnected(true);
      alert(data.message || "Connected successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDisconnect = async () => {
    if (processing) return;
    setProcessing(id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/${id}/disconnect`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Disconnection failed");
      await refreshUser();
      setIsConnected(false);
      alert(data.message || "Disconnected successfully");
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessing(null);
    }
  };
  // --- LOGIC ENDS HERE ---

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="p-6 text-center">
        <div className="inline-block p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
            {error}
        </div>
    </div>
  );
  
  if (!profile) return <div className="p-6 text-center text-gray-500">Profile not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full max-w-4xl mx-auto pt-6 px-4 space-y-6">
        
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Banner */}
            <div className="h-40 bg-gradient-to-r from-blue-600 to-indigo-700"></div>
            
            <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Avatar (Overlapping banner) */}
                    <div className="-mt-16 relative">
                        <img
                            src={getAvatarUrl(profile?.avatarUrl, profile?.name, BACKEND)}
                            alt={profile?.name || "User avatar"}
                            className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-md bg-white"
                        />
                    </div>

                    {/* Profile Stats & Actions */}
                    <div className="flex-1 mt-4 md:mt-2 w-full">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
                                <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                                    {/* Placeholder location/date if you add them later to DB */}
                                    <MapPin size={14}/> Earth • <Calendar size={14} /> Joined recently
                                </p>
                            </div>

                            {/* Action Buttons */}
                            {user && user._id !== profile._id && (
                                <div className="flex gap-3">
                                    {isConnected ? (
                                    <>
                                        <button className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium flex items-center gap-2 cursor-default">
                                            <UserCheck size={18} />
                                            <span>Connected</span>
                                        </button>
                                        <button
                                            onClick={handleDisconnect}
                                            disabled={processing === id}
                                            className="px-4 py-2 bg-white text-gray-600 border border-gray-200 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex items-center gap-2"
                                            title="Disconnect"
                                        >
                                            <UserMinus size={18} />
                                        </button>
                                    </>
                                    ) : (
                                    <button
                                        onClick={handleConnect}
                                        disabled={processing === id}
                                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 font-medium"
                                    >
                                        {processing === id ? (
                                            <span className="animate-pulse">Connecting...</span>
                                        ) : (
                                            <>
                                                <UserPlus size={18} />
                                                Connect
                                            </>
                                        )}
                                    </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100 text-gray-700 leading-relaxed">
                            {profile.bio || "This user hasn't written a bio yet."}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Column: Mutuals & Info */}
            <div className="space-y-6">
                 {/* Mutual Connections */}
                {mutualConnections.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCheck size={18} className="text-blue-600"/>
                        Mutual Connections
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {mutualConnections.map(mc => (
                        <div key={mc._id || mc} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                            {mc.name || "User"}
                        </div>
                        ))}
                    </div>
                    </div>
                )}
                
                {/* Placeholder for other sidebar items (Skills, etc) */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                     <h3 className="font-semibold text-gray-900 mb-2">Stats</h3>
                     <div className="flex justify-between text-sm text-gray-600 py-1">
                         <span>Posts</span>
                         <span className="font-medium text-gray-900">{posts.length}</span>
                     </div>
                     <div className="flex justify-between text-sm text-gray-600 py-1">
                         <span>Connections</span>
                         <span className="font-medium text-gray-900">{profile.connections?.length || 0}</span>
                     </div>
                </div>
            </div>

            {/* Right Column: Posts Feed */}
            <div className="md:col-span-2 space-y-6">
                <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                
                {posts.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                    <p>No posts available.</p>
                </div>
                ) : (
                posts.map(post => (
                    <div key={post._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <img 
                                    src={getAvatarUrl(profile?.avatarUrl, profile?.name, BACKEND)} 
                                    className="w-10 h-10 rounded-full object-cover border border-gray-100"
                                    alt="avatar"
                                />
                                <div>
                                    <span className="font-bold text-gray-900 text-sm block">{profile.name}</span>
                                    <span className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {post.title && <h4 className="font-bold text-lg mb-2 text-gray-900">{post.title}</h4>}
                            {post.content && <p className="text-gray-700 leading-relaxed mb-4">{post.content}</p>}
                        </div>

                        {post.media?.length > 0 && (
                            <div className="border-t border-gray-100">
                            {post.media.map((m, idx) => {
                                let src = typeof m === "string" ? `${import.meta.env.VITE_BACKEND_URL}${m}` : `${import.meta.env.VITE_BACKEND_URL}${m.url}`;
                                let type = typeof m === "string" ? (m.endsWith(".mp4") ? "video" : "image") : m.type;
                                return type === "video" ? (
                                <video key={idx} src={src} controls className="w-full max-h-[500px] bg-black" />
                                ) : (
                                <img key={idx} src={src} alt="post-media" className="w-full object-cover max-h-[500px]" />
                                );
                            })}
                            </div>
                        )}

                        <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between text-gray-600 text-sm">
                            <button className="flex items-center gap-2 hover:text-red-500 transition-colors">
                                <Heart size={18}/> 
                                <span>{post.likes?.length || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 hover:text-blue-500 transition-colors">
                                <Send size={18}/> 
                                <span>{post.comments?.length || 0}</span>
                            </button>
                            <button className="flex items-center gap-2 hover:text-gray-900 transition-colors">
                                <Share2 size={18}/>
                            </button>
                        </div>
                    </div>
                ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OtherProfile;