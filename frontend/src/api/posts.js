import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL;

// ✅ Create Post
export const createPost = async (postData) => {
  const res = await axios.post(`${API_URL}/api/posts`, postData, { withCredentials: true });
  return res.data;
};

// ✅ Get Single Post
export const getPost = async (postId) => {
  const res = await axios.get(`${API_URL}/api/posts/${postId}`, { withCredentials: true });
  return res.data;
};

// ✅ Update Post
export const updatePost = async (postId, updatedData) => {
  const res = await axios.put(`${API_URL}/api/posts/${postId}`, updatedData, { withCredentials: true });
  return res.data;
};

// ✅ Delete Post
export const deletePost = async (postId) => {
  const res = await axios.delete(`${API_URL}/api/posts/${postId}`, { withCredentials: true });
  return res.data;
};

// ✅ Toggle Like
export const toggleLike = async (postId) => {
  const res = await axios.post(`${API_URL}/api/posts/${postId}/like`, {}, { withCredentials: true });
  return res.data; // likes count & liked status
};

// ✅ Add Comment
export const addComment = async (postId, content) => {
  const res = await axios.post(
    `${API_URL}/api/posts/${postId}/comment`,
    { content },
    { withCredentials: true }
  );
  return res.data; // comment added with user info
};

// ✅ Share Post
export const sharePost = async (postId, message) => {
  const res = await axios.post(
    `${API_URL}/api/posts/${postId}/share`,
    { message },
    { withCredentials: true }
  );
  return res.data;
};

// ✅ Get Feed (with user info)
export const getFeed = async () => {
  const res = await axios.get(`${API_URL}/api/posts/feed`, { withCredentials: true });
  return res.data; // posts include user name, avatar, and images
};

// ✅ Get Posts by User (with user info)
export const getUserPosts = async (userId) => {
  const res = await axios.get(`${API_URL}/api/posts/user/${userId}`, { withCredentials: true });
  return res.data; // posts include user name, avatar, and images
};
