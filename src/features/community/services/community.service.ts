// 删除或注释掉旧的 mock 数据
// import { CommunityPost } from "../types";
// export const fetchCommunityPosts = async (page = 1): Promise<CommunityPost[]> => { ... };

// 引入新的依赖和类型
import { getCommunityTravelogues } from '@/services/travelogue.service';
import type { PaginatedResponse, TravelogueDetail } from '@/types';
import { CommunityPost } from '../types';

// 创建数据映射函数
function mapTravelogueToPost(travelogue: TravelogueDetail): CommunityPost {
  return {
    id: travelogue.uid,
    title: travelogue.title,
    // 从 TravelogueDetail 中寻找封面图，如果不存在则使用占位符
    image: travelogue.pois?.[0]?.photos?.[0]?.photoUrl || `https://picsum.photos/seed/${travelogue.uid}/600/900`,
    authorName: travelogue.userName || '匿名用户',
    summary: travelogue.summary,
    isPublic: travelogue.isPublic,
    createdAt: travelogue.createdAt,
  };
}

// 实现新的 API 调用函数
export const fetchCommunityPosts = async (page = 1, size = 10): Promise<PaginatedResponse<CommunityPost>> => {
  try {
    // 现在 getCommunityTravelogues 返回 PaginatedResponse<TravelogueDetail>
    const response = await getCommunityTravelogues(page, size);
     
    // 如果后端返回的是UID列表，则需要下面的逻辑
    /* 
    const uidResponse = await getCommunityTravelogues(page, size);
    const details = await Promise.all(
      uidResponse.content.map(uid => getTravelogueDetail(uid))
    );
    const response = { ...uidResponse, content: details };
    */

    // 确保数据存在再进行映射
    const items = response.content || [];
    return {
      ...response,
      content: items.map(mapTravelogueToPost),
    };
  } catch (error) {
    console.error('Failed to fetch community posts:', error);
    // 返回一个空的 PaginatedResponse 结构以避免崩溃
    return {
      content: [],
      totalElements: 0,
      totalPages: 0,
      size: size,
      number: page - 1,
      first: page === 1,
      last: true,
    };
  }
};