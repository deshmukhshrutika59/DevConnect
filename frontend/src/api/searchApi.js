// src/api/searchApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || `${import.meta.env.VITE_API_BASE_URL}`;

export const semanticSearch = async (query, type = "posts", token) => {
  const res = await axios.post(
    `${API_URL}/search/semantic`,
    { query, type },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return res.data;
};
