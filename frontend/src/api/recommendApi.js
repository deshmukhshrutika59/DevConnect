import axios from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const getRecommendedUsers = async (token) => {
  const res = await axios.get(`${API_URL}/api/recommend/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.results;
};
