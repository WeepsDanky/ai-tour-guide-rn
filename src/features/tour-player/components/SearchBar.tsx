import React, { useState } from 'react';
import { View, TextInput, Pressable, TextInputProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface SearchBarProps extends Omit<TextInputProps, 'onChangeText'> {
  onSearch: (query: string) => void;
  onClear?: () => void;
  placeholder?: string;
  showFilter?: boolean;
  onFilterPress?: () => void;
}

export function SearchBar({
  onSearch,
  onClear,
  placeholder = 'Search tours...',
  showFilter = false,
  onFilterPress,
  value,
  ...textInputProps
}: SearchBarProps) {
  const [query, setQuery] = useState(value || '');

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    onClear?.();
  };

  return (
    <View className="flex-row items-center bg-gray-50 rounded-full px-4 py-3 mx-4 mb-4">
      <FontAwesome name="search" size={16} color="#9CA3AF" className="mr-3" />
      
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        className="flex-1 text-gray-900 text-base"
        returnKeyType="search"
        onSubmitEditing={() => onSearch(query)}
        {...textInputProps}
      />
      
      {query.length > 0 && (
        <Pressable onPress={handleClear} className="ml-2">
          <FontAwesome name="times-circle" size={16} color="#9CA3AF" />
        </Pressable>
      )}
      
      {showFilter && (
        <Pressable 
          onPress={onFilterPress}
          className="ml-3 w-8 h-8 items-center justify-center rounded-full bg-blue-100"
        >
          <FontAwesome name="sliders" size={14} color="#3B82F6" />
        </Pressable>
      )}
    </View>
  );
} 