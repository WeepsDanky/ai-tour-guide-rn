import { View, Text, SafeAreaView } from 'react-native';

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 justify-center items-center">
        <Text className="text-xl font-bold">Tour Map</Text>
        <Text className="text-gray-600 mt-2">Map functionality coming soon</Text>
      </View>
    </SafeAreaView>
  );
}