import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokens } from '../lib/tokens';

// 防止启动画面自动隐藏
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // 加载字体
  const [fontsLoaded, fontError] = useFonts({
    // FIX: Load the fonts defined in your tokens. Assuming they exist in assets/fonts.
    // You will need to add these font files to your project.
    'SourceHanSans': require('../assets/fonts/SourceHanSans-Regular.ttf'),
    'Inter': require('../assets/fonts/Inter-VariableFont_opsz,wght.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // 字体加载完成后或加载失败后隐藏启动画面
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={tokens.colors.background} />
        
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: tokens.colors.background,
            },
            animation: 'slide_from_right',
            animationDuration: 280,
          }}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}