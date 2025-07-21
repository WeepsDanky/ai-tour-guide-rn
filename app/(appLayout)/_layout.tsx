import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function AppLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="help" options={{ headerShown: false }} />
        <Stack.Screen name="create-photo/capture" options={{ 
          title: 'Camera', 
          presentation: 'fullScreenModal',
          headerShown: false 
        }} />
        <Stack.Screen name="create-photo/confirm" options={{ 
          title: 'Confirm Photo', 
          presentation: 'modal',
          headerShown: false 
        }} />
        <Stack.Screen name="create-photo/progress" options={{ 
          title: 'Generating Tour',
          presentation: 'fullScreenModal',
          headerShown: false,
          gestureEnabled: false
        }} />
        <Stack.Screen name="map" options={{ title: 'Tour Map', presentation: 'fullScreenModal', headerShown: false }} />
        <Stack.Screen name="tour" options={{ title: 'Tour Details' }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="tour-history" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}