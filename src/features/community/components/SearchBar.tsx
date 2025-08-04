import { View, TextInput, Text, TouchableOpacity } from "react-native";
import { useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "按目的地搜索" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-2">
      <Text className="font-medium">📍 上海 ▼</Text>
      <View className="flex-1 mx-2 bg-gray-100 rounded-full px-3 py-1 flex-row items-center">
        <TextInput 
          placeholder={placeholder} 
          className="text-sm flex-1" 
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          onPress={handleSearch}
          className="ml-2 bg-blue-500 rounded-full px-3 py-1"
        >
          <Text className="text-white text-xs font-medium">搜索</Text>
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center space-x-1">
        <Text>☀️</Text>
        <Text className="text-sm">26℃</Text>
      </View>
    </View>
  );
}