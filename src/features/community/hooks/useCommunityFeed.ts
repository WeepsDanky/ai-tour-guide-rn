import { useState, useEffect, useCallback } from "react";
import { CommunityPost } from "../types";
import { fetchCommunityPosts } from "../services/community.service";

export const useCommunityFeed = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true); // 新增状态，判断是否还有更多数据

  const loadNext = useCallback(async () => {
    // 如果正在加载或没有更多数据了，则直接返回
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const response = await fetchCommunityPosts(page);
      
      // 使用函数式更新，避免依赖旧的 posts 状态
      setPosts(prevPosts => [...prevPosts, ...response.content]);
      
      // 更新分页信息
      setPage(prevPage => prevPage + 1);
      setHasMore(!response.last); // 后端返回 last 字段表示是否是最后一页
    } catch (error) {
      console.error("Failed to load community feed:", error);
      // 可以在这里设置错误状态
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    // 组件挂载时加载第一页数据
    loadNext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 空依赖数组确保只在挂载时执行一次

  return { posts, loadNext, loading, hasMore }; // 返回加载和分页状态
};