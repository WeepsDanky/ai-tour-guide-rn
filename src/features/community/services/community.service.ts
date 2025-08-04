import { CommunityPost } from "../types";

// TODO: Replace with real endpoint
export const fetchCommunityPosts = async (page = 1): Promise<CommunityPost[]> => {
  // 👇 demo stub (20 posts):
  return Array.from({ length: 20 }).map((_, i) => ({
    id: `${page}-${i}`,
    title: "上海必玩项目—迪士尼乐园！",
    image: `https://picsum.photos/seed/${page}-${i}/600/900`,
    location: "上海",
  }));
};