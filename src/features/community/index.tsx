import { View, SafeAreaView } from "react-native";
import MasonryList from "@react-native-seoul/masonry-list";
import { useCommunityFeed } from "./hooks/useCommunityFeed";
import MasonryCard from "./components/MasonryCard";
import SearchBar from "./components/SearchBar";

export default function CommunityScreen() {
  const { posts, loadNext } = useCommunityFeed();

  const handleSearch = (query: string) => {
    console.log('搜索查询:', query);
    // TODO: 实现搜索功能
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
          onEndReached={loadNext}
          renderItem={({ item }) => <MasonryCard post={item} />}
        />
      </View>
    </SafeAreaView>
  );
}