// 删除或注释掉旧的 CommunityPost 类型
// export interface CommunityPost {
//   id: string;
//   title: string;
//   image: string;
//   location: string;
// }

// 新增与后端 TravelogueSummary 对应的类型
export interface CommunityPost {
  id: string; // 将 uid 映射为 id
  title: string;
  image: string; // 将 thumbnailUrl 映射为 image
  authorName?: string;
  summary?: string;
  isPublic: boolean;
  createdAt: string;
}
