import { View, Text, Image, ActivityIndicator } from 'react-native';
import { ChatBubbleProps } from '../types';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';
import { Card, CardContent } from '@/ui/molecules/Card';
import { FontAwesome } from '@expo/vector-icons';
import TourSummaryCard from './TourSummaryCard';
import TourSegmentsCard from './TourSegmentsCard';

export default function ChatBubble({ message }: ChatBubbleProps) {
  // Tour summary message
  if (message.type === 'tour_summary' && message.tourData) {
    return <TourSummaryCard tourData={message.tourData} />;
  }

  // Tour segments message
  if (message.type === 'tour_segments' && message.tourData) {
    return <TourSegmentsCard tourData={message.tourData} />;
  }

  // Loading state
  if (message.status === 'loading') {
    return (
      <View className="mx-4 my-2">
        <Card variant="default" className="bg-blue-50 border-blue-100">
          <CardContent className="py-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                <FontAwesome name="magic" size={14} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#3B82F6" className="mr-2" />
                  <Text className="text-blue-700 font-medium text-sm">AI正在识别您的照片</Text>
                </View>
                <Text className="text-blue-600 text-xs mt-1">请稍候片刻...</Text>
              </View>
            </View>
          </CardContent>
        </Card>
      </View>
    );
  }

  // Progress state
  if (message.status === 'progress') {
    return (
      <View className="mx-4 my-2">
        <Card variant="elevated" className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
          <CardContent className="py-5">
            {/* Header with icon */}
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center mr-3">
                <FontAwesome name="cogs" size={16} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 font-semibold text-base">
                  AI正在生成您的专属导览
                </Text>
                <Text className="text-gray-600 text-sm mt-0.5">
                  {message.progressText || '正在处理中...'}
                </Text>
              </View>
            </View>
            
            {/* Progress indicator */}
            <View className="mb-3">
              <ProgressIndicator
                progress={message.progress || 0}
                variant="linear"
                size="medium"
                showPercentage={true}
                className="mb-2"
              />
            </View>
            
            {/* Description */}
            <View className="bg-white/60 rounded-lg p-3">
              <Text className="text-gray-700 text-sm text-center leading-5">
                🎯 正在为您创建个性化的游览体验
              </Text>
              <Text className="text-gray-500 text-xs text-center mt-1">
                这可能需要几十秒
              </Text>
            </View>
          </CardContent>
        </Card>
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
    <View 
      className="mx-4 my-2 flex-row justify-start" >
      <View 
        className="bg-gray-100 rounded-lg p-3 max-w-xs" 
        style={{ 
          minHeight: 60,
          minWidth: 200,
          flex: 1
        }}
      >
        {/* AI Avatar */}
        <View className="flex-row items-start">
          <View className="w-6 h-6 bg-blue-500 rounded-full mr-2 mt-1 items-center justify-center">
            <Text className="text-white text-xs font-bold">AI</Text>
          </View>
          <View className="flex-1">
            {message.text && (
              <Text 
                className="text-gray-800 text-sm leading-5" 
                style={{ 
                  color: 'black', 
                  fontSize: 16,
                  lineHeight: 24
                }}
              >
                {message.text}
              </Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}