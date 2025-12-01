import { useCallback, useEffect, useState } from "react";

export default function useNotifications(token) {
  const [list, setList] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(
    async (page = 1, limit = 20, type) => {
      setLoading(true);
      setError(null);
      try {
        const q = new URLSearchParams({ page, limit });
        if (type) q.set("type", Array.isArray(type) ? type.join(",") : type);
        const res = await fetch(`/api/notifications?${q.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load");
        setList(data.notifications);
        setPageInfo({ page: data.page, limit: data.limit, total: data.total, totalPages: data.totalPages });
      } catch (err) {
        setError(err.message || "Failed to fetch notifications");
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  const markRead = useCallback(
    async (id) => {
      await fetch(`/api/notifications/mark-read/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setList((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
    },
    [token]
  );

  const markAllRead = useCallback(
    async () => {
      await fetch(`/api/notifications/mark-all-read`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      setList((prev) => prev.map((n) => ({ ...n, read: true })));
    },
    [token]
  );

  const remove = useCallback(
    async (id) => {
      await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setList((prev) => prev.filter((n) => n._id !== id));
    },
    [token]
  );

  return {
    list,
    fetchPage,
    pageInfo,
    loading,
    error,
    markRead,
    markAllRead,
    remove,
    setList,
  };
}
