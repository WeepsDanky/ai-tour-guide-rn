import { View, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import type { TourDataResponse } from '@/types';

export default function MapScreen() {
  const params = useLocalSearchParams<{ tourData?: string; tourId?: string }>();
  const [tour, setTour] = useState<TourDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTourData = () => {
      try {
        if (params.tourData) {
          const parsedTour = JSON.parse(params.tourData) as TourDataResponse;
          setTour(parsedTour);
          console.log('[MapScreen] Tour data loaded:', parsedTour);
        } else if (params.tourId) {
          // 如果只有tourId，可以在这里调用API获取数据
          console.log('[MapScreen] Only tourId provided:', params.tourId);
          setError('Tour data not provided');
        } else {
          setError('No tour data or ID provided');
        }
      } catch (err) {
        console.error('[MapScreen] Failed to parse tour data:', err);
        setError('Failed to load tour data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTourData();
  }, [params.tourData, params.tourId]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0066cc" />
        <Text className="text-gray-600 mt-4">正在加载游览地图...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center p-4">
        <Text className="text-xl font-bold text-red-600">加载失败</Text>
        <Text className="text-gray-600 mt-2 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  if (!tour) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="text-xl font-bold">没有可显示的游览</Text>
      </SafeAreaView>
    );
  }

  // 渲染真实的地图和游览信息
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-2">{tour.title || '游览地图'}</Text>
        <Text className="text-gray-600 mb-4">{tour.description || '正在为您展示游览路线'}</Text>
        
        <View className="flex-1 bg-gray-100 rounded-lg p-4 items-center justify-center">
          <Text className="text-lg font-semibold mb-2">游览状态: {tour.status}</Text>
          <Text className="text-gray-600 mb-4">Tour ID: {tour.tourUid}</Text>
          
          {tour.tourPlan && (
            <View className="w-full">
              <Text className="text-lg font-semibold mb-2">游览计划:</Text>
              <View className="bg-white p-3 rounded border">
                <Text className="text-sm text-gray-700">
                  {typeof tour.tourPlan === 'string' ? tour.tourPlan.substring(0, 200) + '...' : '游览计划已生成'}
                </Text>
              </View>
            </View>
          )}
          
          <Text className="text-gray-500 mt-4">地图组件和音频播放器即将推出</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}