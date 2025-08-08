import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ChatInputProps } from '../types';

export default function ChatInput({ onSendPhoto }: ChatInputProps) {
  const router = useRouter();

  const handleCameraPress = () => {
    // Navigate to camera capture screen
    router.push('/create-photo/capture');
  };

  return (
    <View className="flex-row items-center p-4 border-t border-gray-200 bg-white">
      {/* Hint Text */}
      <View className="flex-1">
        <Text className="text-gray-500 text-sm">
          拍摄照片，让AI为您介绍景点
        </Text>
      </View>
      
      {/* Camera Button */}
      <TouchableOpacity
        onPress={handleCameraPress}
        className="w-16 h-10 bg-blue-500 rounded-full items-center justify-center ml-3"
        activeOpacity={0.7}
      >
        <FontAwesome name="camera" size={18} color="white" />
      </TouchableOpacity>
    </View>
  );
}