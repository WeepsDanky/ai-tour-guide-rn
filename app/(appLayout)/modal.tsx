import { StatusBar } from 'expo-status-bar';
import { Platform, View, Text } from 'react-native';

export default function Modal() {
  return (
    <>
      <View className="flex-1 items-center justify-center bg-gray-50 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Modal</Text>
        <Text className="text-gray-600">app/modal.tsx</Text>
      </View>
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </>
  );
}
