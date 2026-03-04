import axios from "axios";

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`; // adjust if backend URL is different

export const getUserProfile = async (id) => {
  const res = await axios.get(`${API_BASE}/users/${id}`);
  return res.data;
};

export const updateUserProfile = async (id, formData) => {
  const res = await axios.put(`${API_BASE}/users/${id}`, formData, {
    headers: { "Content-Type": "application/json" },
  });
  return res.data;
};
