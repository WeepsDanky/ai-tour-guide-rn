import { View, SafeAreaView, Text, ActivityIndicator } from "react-native";
import MasonryList from "@react-native-seoul/masonry-list";
import { useCommunityFeed } from "./hooks/useCommunityFeed";
import MasonryCard from "./components/MasonryCard";
import SearchBar from "./components/SearchBar";

export default function CommunityScreen() {
  const { posts, loadNext, loading, hasMore } = useCommunityFeed();

  const handleSearch = (query: string) => {
    console.log('搜索查询:', query);
    // TODO: 实现搜索功能
  };

  const handlePostPress = (post: any) => {
    console.log('点击了帖子:', post.title);
    // TODO: 导航到游记详情页面
    // router.push(`/travelogue/${post.id}`);
  };

  const renderFooter = () => {
    if (!loading) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" color="#3B82F6" />
        <Text className="text-gray-500 mt-2">加载中...</Text>
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && posts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="text-gray-500 mt-4">正在加载社区内容...</Text>
        </View>
      );
    }
    
    if (posts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <Text className="text-gray-500 text-lg">暂无社区内容</Text>
          <Text className="text-gray-400 mt-2">成为第一个分享旅行故事的人吧！</Text>
        </View>
      );
    }
    
    return null;
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Masonry feed */}
        <MasonryList
          data={posts}
          numColumns={2}
          keyExtractor={(item) => item.id}
          onEndReached={hasMore ? loadNext : undefined}
          onEndReachedThreshold={0.1}
          renderItem={({ item }) => (
            <MasonryCard 
              post={item} 
              onPress={handlePostPress}
            />
          )}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}