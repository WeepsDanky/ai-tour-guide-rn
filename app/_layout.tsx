import '../global.css';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CreateTourProvider } from '@/features/create-tour/context/CreateTourContext';
import SplashScreen from './splash'; // Import the splash screen component


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