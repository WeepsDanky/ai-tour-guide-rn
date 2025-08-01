import '../global.css';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CreateTourProvider } from '@/features/create-tour/context/CreateTourContext';
import SplashScreen from './splash'; // Import the splash screen component
import { AMapSdk } from 'react-native-amap3d'; // <-- 1. 导入 AMapSdk
import { Platform } from 'react-native'; // <-- 2. 导入 Platform

// Custom hook to protect routes
const useProtectedRoute = () => {
  const segments = useSegments();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If authentication state is still loading, do nothing.
    // The splash screen will be displayed.
    if (isLoading) {
      return;
    }

    const inAppGroup = segments[0] === '(appLayout)';

    // If the user is signed in but is on the login screen, redirect them to home.
    if (user && !inAppGroup) {
      router.replace('/');
    } 
    // If the user is not signed in and is trying to access a protected screen,
    // redirect them to the login screen.
    else if (!user && inAppGroup) {
      router.replace('/login');
    }
  }, [user, isLoading, segments, router]);
};

// Main navigation component
function RootLayoutNav() {
  useProtectedRoute();
  const { isLoading } = useAuth();

  // Display the splash screen while checking for an existing user session
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Stack>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(appLayout)" options={{ headerShown: false }} />
    </Stack>
  );
}

// Root component with context providers
export default function RootLayout() {
  // 3. 添加 useEffect 来初始化高德地图
  useEffect(() => {
    // 修正: 移除 setPrivacyShow 和 setPrivacyAgree 的调用
    // 这些操作已在 init 函数的原生代码中自动处理
    
    // 只需调用 init 即可，它会处理所有初始化包括隐私协议
    AMapSdk.init(
      Platform.select({
        android: "152b694485af4a4c9e1fadd092ca03aa",
        ios: "a7bf780ba78369242c5ddda4f3deed21",
      })
    );
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <CreateTourProvider>
          <RootLayoutNav />
        </CreateTourProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}