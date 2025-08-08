import { View, Text, Image, ActivityIndicator } from 'react-native';
import { ChatBubbleProps } from '../types';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';
import TourSummaryCard from './TourSummaryCard';

export default function ChatBubble({ message }: ChatBubbleProps) {
  // Tour summary message
  if (message.type === 'tour_summary' && message.tourData) {
    return <TourSummaryCard tourData={message.tourData} />;
  }

  // Loading state
  if (message.status === 'loading') {
    return (
      <View className="bg-gray-100 rounded-lg p-3 mx-4 my-2 flex-row items-center">
        <ActivityIndicator size="small" color="#6B7280" className="mr-2" />
        <Text className="text-gray-500">识别中…</Text>
      </View>
    );
  }

  // Progress state
  if (message.status === 'progress') {
    return (
      <View className="mx-4 my-2">
        <View className="bg-gray-100 rounded-lg p-4">
          <ProgressIndicator
            progress={message.progress || 0}
            text={message.progressText || '生成中...'}
            size="medium"
          />
          <Text className="text-gray-600 text-sm mt-2 text-center">
            正在为您创建个性化的游览体验...
          </Text>
        </View>
      </View>
    );
  }

  // User message
  if (message.type === 'user') {
    return (
      <View className="mx-4 my-2 flex-row justify-end">
        <View className="bg-blue-500 rounded-lg p-3 max-w-xs">
          {message.image && (
            <Image 
              source={{ uri: message.image }}
              className="w-48 h-48 rounded-lg mb-2"
              resizeMode="cover"
            />
          )}
          {message.text && (
            <Text className="text-white text-sm">{message.text}</Text>
          )}
        </View>
      </View>
    );
  }

  // AI message
  return (
    <View className="mx-4 my-2 flex-row justify-start">
      <View className="bg-gray-100 rounded-lg p-3 max-w-xs">
        {/* AI Avatar */}
        <View className="flex-row items-start">
          <View className="w-6 h-6 bg-blue-500 rounded-full mr-2 mt-1 items-center justify-center">
            <Text className="text-white text-xs font-bold">AI</Text>
          </View>
          <View className="flex-1">
            {message.text && (
              <Text className="text-gray-800 text-sm leading-5">
                {message.text}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}