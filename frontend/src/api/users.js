import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const connectUser = async (id, token) => {
  const res = await axios.post(
    `${API_BASE}/users/${id}/connect`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const disconnectUser = async (id, token) => {
  const res = await axios.post(
    `${API_BASE}/users/${id}/disconnect`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const getUserById = async (id, token) => {
  const res = await axios.get(`${API_BASE}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
