import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import type { TourDataResponse } from '@/types';

interface TourSegmentsCardProps {
  tourData: TourDataResponse;
}

interface TourSegment {
  mode: string;
  to_id: string;
  from_id: string;
  id_name: string;
  polyline: string;
  distance_m: number;
  description: string;
  duration_min: number;
  direction_ref: string;
}

interface TourPlan {
  segments: TourSegment[];
  warnings: any[];
  citations: Record<string, string>;
  route_uid: string;
  ordered_pois: string[];
  total_distance_m: number;
  total_duration_min: number;
}

export default function TourSegmentsCard({ tourData }: TourSegmentsCardProps) {
  // 解析 tourPlan JSON 字符串
  let tourPlan: TourPlan | null = null;
  try {
    tourPlan = JSON.parse(tourData.tourPlan);
  } catch (error) {
    console.error('Failed to parse tour plan:', error);
    return (
      <View className="mx-4 my-2">
        <View className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <Text className="text-red-500 text-sm">无法解析游览数据</Text>
        </View>
      </View>
    );
  }

  if (!tourPlan || !tourPlan.segments) {
    return (
      <View className="mx-4 my-2">
        <View className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
          <Text className="text-gray-500 text-sm">暂无游览地点信息</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="mx-4 my-2">
      <View className="bg-white rounded-lg p-4 shadow-md border border-gray-100">
        {/* Header */}
        <View className="flex-row items-start mb-4">
          <View className="w-8 h-8 bg-green-500 rounded-full mr-3 mt-1 items-center justify-center">
            <FontAwesome name="map-marker" size={16} color="white" />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-green-600 font-semibold">游览地点详情</Text>
            <Text className="text-gray-600 text-xs mt-1">
              共 {tourPlan.segments.length} 个地点 • 总时长 {tourPlan.total_duration_min} 分钟
            </Text>
          </View>
        </View>

        {/* Segments List */}
        <ScrollView className="max-h-80" showsVerticalScrollIndicator={false}>
          {tourPlan.segments.map((segment, index) => (
            <View key={index} className="mb-4 last:mb-0">
              <View className="flex-row items-start">
                <View className="w-6 h-6 bg-blue-100 rounded-full mr-3 mt-1 items-center justify-center">
                  <Text className="text-blue-600 text-xs font-bold">{index + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900 mb-1">
                    {segment.id_name}
                  </Text>
                  <Text className="text-gray-600 text-sm leading-5 mb-2">
                    {segment.description}
                  </Text>
                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-4">
                      <FontAwesome name="clock-o" size={12} color="#9CA3AF" className="mr-1" />
                      <Text className="text-gray-500 text-xs ml-1">{segment.duration_min} 分钟</Text>
                    </View>
                    <View className="flex-row items-center">
                      <FontAwesome name="road" size={12} color="#9CA3AF" className="mr-1" />
                      <Text className="text-gray-500 text-xs ml-1">{segment.distance_m}m</Text>
                    </View>
                  </View>
                </View>
              </View>
              {/* Divider */}
              {index < tourPlan.segments.length - 1 && (
                <View className="ml-9 mt-3 border-l border-gray-200 h-4" />
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}