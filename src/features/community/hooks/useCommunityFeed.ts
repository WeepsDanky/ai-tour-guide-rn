import { useState, useEffect, useCallback } from "react";
import { CommunityPost } from "../types";
import { fetchCommunityPosts } from "../services/community.service";

export const useCommunityFeed = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const loadNext = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    const next = await fetchCommunityPosts(page);
    setPosts((prev) => [...prev, ...next]);
    setPage((p) => p + 1);
    setLoading(false);
  }, [page, loading]);

  useEffect(() => {
    // initial fetch
    loadNext();
  }, []);

  return { posts, loadNext };
};