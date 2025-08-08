import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';

interface CurrentLocationCardProps {
  onLocationPress?: (location: string, coordinates: { lat: number; lng: number }) => void;
}

export default function CurrentLocationCard({ onLocationPress }: CurrentLocationCardProps) {
  const [location, setLocation] = useState<string>('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!hasFetched) {
      getCurrentLocation();
    }
  }, [hasFetched]);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setError(null);
      setHasFetched(true);
      
      // 请求位置权限
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('需要位置权限才能显示当前位置');
        setLoading(false);
        return;
      }

      // 获取当前位置
      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const { latitude, longitude } = locationResult.coords;
      setCoordinates({ lat: latitude, lng: longitude });
      
      // 反向地理编码获取地址
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        setLocation(formattedAddress);
      } else {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (err) {
      console.error('获取位置失败:', err);
      setError('无法获取当前位置');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationPress = () => {
    if (coordinates && location) {
      onLocationPress?.(location, coordinates);
    }
  };

  const handleRefresh = () => {
    setHasFetched(false);
    getCurrentLocation();
  };

  if (loading) {
    return (
      <View className="mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
            <FontAwesome name="map-marker" size={18} color="#3B82F6" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold mb-1">获取当前位置中...</Text>
            <Text className="text-gray-500 text-sm">正在定位您的位置</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
            <FontAwesome name="exclamation-triangle" size={18} color="#EF4444" />
          </View>
          <View className="flex-1">
            <Text className="text-gray-900 font-semibold mb-1">位置获取失败</Text>
            <Text className="text-gray-500 text-sm">{error}</Text>
          </View>
          <Pressable
            onPress={handleRefresh}
            className="bg-blue-500 px-3 py-2 rounded-lg"
          >
            <Text className="text-white text-sm font-medium">重试</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      onPress={handleLocationPress}
      className="mx-4 mb-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
          <FontAwesome name="map-marker" size={18} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-gray-900 font-semibold mb-1">当前位置</Text>
          <Text className="text-gray-600 text-sm" numberOfLines={2}>
            {location || '位置信息不可用'}
          </Text>
          {coordinates && (
            <Text className="text-gray-400 text-xs mt-1">
              {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
            </Text>
          )}
        </View>
        <View className="flex-row items-center space-x-2">
          <Pressable
            onPress={handleRefresh}
            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="refresh" size={14} color="#6B7280" />
          </Pressable>
          <FontAwesome name="chevron-right" size={14} color="#9CA3AF" />
        </View>
      </View>
    </Pressable>
  );
}