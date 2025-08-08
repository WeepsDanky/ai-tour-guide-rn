import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import type { TourDataResponse } from '@/types';

interface TourSummaryCardProps {
  tourData: TourDataResponse;
}

export default function TourSummaryCard({ tourData }: TourSummaryCardProps) {
  const router = useRouter();

  const handleViewMap = () => {
    router.push({
      pathname: '/(appLayout)/(map)/map',
      params: {
        tourData: JSON.stringify(tourData),
        tourId: tourData.tourUid,
      },
    });
  };

  return (
    <View className="mx-4 my-2">
      <View className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
        <View className="flex-row items-start">
          <View className="w-8 h-8 bg-blue-500 rounded-full mr-3 mt-1 items-center justify-center">
            <FontAwesome name="map-signs" size={16} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-blue-600 font-semibold">游览已生成！</Text>
            <Text className="text-lg font-bold text-gray-900 mt-1">{tourData.title || '您的新游览'}</Text>
            <Text className="text-gray-600 mt-2 text-sm leading-5">
              {tourData.description || '我已经为您规划好了路线和讲解，点击下方按钮开始探索吧！'}
            </Text>
          </View>
        </View>
        <View className="mt-4">
          <Pressable
            onPress={handleViewMap}
            className="bg-blue-500 rounded-lg py-3 px-4 items-center active:bg-blue-600"
          >
            <Text className="text-white font-semibold text-base">在地图上查看</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}