import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useChat } from '@/features/tour-chat/context/ChatContext';
import { ProgressIndicator } from '@/ui/atoms/ProgressIndicator';

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { messages } = useChat();

  // Find the latest progress message
  const progressMessage = messages
    .filter(msg => msg.status === 'progress')
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

  // If no progress message or generation is complete, redirect back
  React.useEffect(() => {
    if (!progressMessage) {
      router.back();
    }
  }, [progressMessage, router]);

  if (!progressMessage) {
    return null;
  }

  return (
    <View 
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
    >
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-100">
        <Text className="text-xl font-semibold text-gray-900">
          正在生成您的专属导览
        </Text>
        <Text className="text-sm text-gray-500 mt-1">
          请稍候，AI正在为您创建个性化的游览体验
        </Text>
      </View>

      {/* Progress Content */}
      <View className="flex-1 justify-center px-6">
        <View className="items-center">
          {/* Progress Indicator */}
          <View className="mb-8">
            <ProgressIndicator
              progress={progressMessage.progress || 0}
              text={progressMessage.progressText || '生成中...'}
              size="large"
            />
          </View>

          {/* Status Text */}
          <Text className="text-lg font-medium text-gray-800 text-center mb-4">
            {progressMessage.progressText || '正在生成导览内容...'}
          </Text>

          {/* Additional Info */}
          <Text className="text-sm text-gray-500 text-center leading-6">
            我们正在分析您的照片和位置信息，{"\n"}
            为您量身定制最佳的游览路线和景点介绍。
          </Text>

          {/* Progress Percentage */}
          <View className="mt-6 bg-gray-50 rounded-lg px-4 py-3">
            <Text className="text-sm text-gray-600 text-center">
              进度: {Math.round((progressMessage.progress || 0) * 100)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View className="px-6 py-4 border-t border-gray-100">
        <Text className="text-xs text-gray-400 text-center">
          生成过程通常需要30-60秒，请耐心等待
        </Text>
      </View>
    </View>
  );
}