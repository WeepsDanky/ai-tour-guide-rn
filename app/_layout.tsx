import '../global.css';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { CreateTourProvider } from '../src/context/CreateTourContext';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <CreateTourProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          <Stack.Screen name="map" options={{ title: 'Tour Map', presentation: 'fullScreenModal' }} />
          <Stack.Screen name="tour" options={{ title: 'Tour Details' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="modal" options={{ title: 'Modal', presentation: 'modal' }} />
        </Stack>
      </CreateTourProvider>
    </GestureHandlerRootView>
  );
}
