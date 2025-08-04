import { Image, Text, View } from "react-native";
import { CommunityPost } from "../types";

interface Props { post: CommunityPost }

export default function MasonryCard({ post }: Props) {
  return (
    <View className="m-1 bg-white rounded-lg overflow-hidden shadow-sm">
      <Image source={{ uri: post.image }} className="w-full h-48" />
      <Text className="p-2 text-sm font-medium" numberOfLines={2}>
        {post.title}
      </Text>
    </View>
  );
}