import { Image, Text, View, Pressable } from "react-native";
import { CommunityPost } from "../types";

interface Props { 
  post: CommunityPost;
  onPress?: (post: CommunityPost) => void;
}

export default function MasonryCard({ post, onPress }: Props) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '今天';
    if (diffDays === 2) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <Pressable 
      onPress={() => onPress?.(post)}
      className="m-1 bg-white rounded-lg overflow-hidden shadow-sm active:opacity-80"
    >
      <Image 
        source={{ uri: post.image }} 
        className="w-full h-48" 
        resizeMode="cover"
      />
      <View className="p-3">
        <Text className="text-sm font-medium text-gray-900 mb-1" numberOfLines={2}>
          {post.title}
        </Text>
        {post.summary && (
          <Text className="text-xs text-gray-600 mb-2" numberOfLines={2}>
            {post.summary}
          </Text>
        )}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-gray-500" numberOfLines={1}>
            {post.authorName || '匿名用户'}
          </Text>
          <Text className="text-xs text-gray-400">
            {formatDate(post.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}