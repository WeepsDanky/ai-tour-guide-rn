import React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { EmptyState, LoadingIndicator, TourCard } from '../../../ui';
import { Tour } from '~/types';

/**
 * Props for the SearchResults component
 */
export interface SearchResultsProps {
  /** Search query string */
  query: string;
  /** Array of tour results from search */
  results: Tour[];
  /** Whether search is in progress */
  loading?: boolean;
  /** Callback when a tour is pressed */
  onTourPress: (tour: Tour) => void;
  /** Optional callback to clear search */
  onClearSearch?: () => void;
}

/**
 * Component displaying search results for tours.
 * Handles loading, empty states, and result display.
 * 
 * @example
 * ```tsx
 * <SearchResults
 *   query="Central Park"
 *   results={searchResults}
 *   loading={isSearching}
 *   onTourPress={(tour) => navigate('tour', { id: tour.id })}
 *   onClearSearch={() => setSearchQuery('')}
 * />
 * ```
 */
export function SearchResults({ 
  query, 
  results, 
  loading = false, 
  onTourPress, 
  onClearSearch 
}: SearchResultsProps) {
  if (loading) {
    return (
      <View className="flex-1 px-4">
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            Searching for &ldquo;{query}&rdquo;...
          </Text>
        </View>
        
        <LoadingIndicator 
          text="Finding tours for you..." 
          variant="inline"
        />
      </View>
    );
  }

  if (results.length === 0) {
    return (
      <View className="flex-1 px-4">
        <View className="mb-4">
          <Text className="text-lg font-semibold text-gray-900">
            Search Results for &ldquo;{query}&rdquo;
          </Text>
          <Text className="text-sm text-gray-600">
            No tours found
          </Text>
        </View>
         
        <EmptyState
          icon="search"
          title="No tours found"
          description={`We couldn't find any tours matching &ldquo;${query}&rdquo;. Try different keywords or browse our recommended tours instead.`}
          actionText="Clear Search"
          onAction={onClearSearch}
        />
      </View>
    );
  }

  const renderTourItem = ({ item }: { item: Tour }) => (
    <View className="mb-4">
      <TourCard 
        tour={item} 
        onPress={() => onTourPress(item)}
      />
    </View>
  );

  return (
    <View className="flex-1">
      {/* Search Results Header */}
      <View className="px-4 mb-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-semibold text-gray-900">
              Search Results for &ldquo;{query}&rdquo;
            </Text>
            <View className="flex-row items-center mt-1">
              <FontAwesome name="search" size={12} color="#6B7280" />
              <Text className="text-sm text-gray-600 ml-1">
                {results.length} tour{results.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          </View>
          
          {onClearSearch && (
            <Pressable onPress={onClearSearch}>
              <Text className="text-blue-500 font-medium">Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderTourItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </View>
  );
} 