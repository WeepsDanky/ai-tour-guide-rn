import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { reverseGeocodeWithCache } from '../../../src/lib/geocoding';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { Container } from '@/ui/atoms/Container';
import { LoadingIndicator } from '@/ui/atoms/LoadingIndicator';
import { ShutterButton, FlipButton, ChooseFromLibraryButton } from '@/ui/atoms';
import { EmptyState } from '@/ui/molecules/EmptyState';
import { LocationPill } from '@/ui/molecules/LocationPill';

export default function CapturePhotoScreen() {
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [locationFetched, setLocationFetched] = useState(false);
  
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const { setPhotoUri, locationLabel, setLocationLabel } = useCreateTour();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission && !locationFetched && locationLabel === '') {
      getCurrentLocation();
    }
  }, [locationPermission, locationFetched]);

  const requestLocationPermission = async () => {
    // Prevent multiple permission requests
    if (locationPermission !== null) {
      return;
    }
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission || locationFetched || locationLabel !== '') {
      return;
    }

    try {
      setLocationFetched(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10
      });
      const { latitude, longitude } = location.coords;
      
      // 使用带缓存和重试的地理编码
      const formattedAddress = await reverseGeocodeWithCache(latitude, longitude, {
        maxRetries: 2,
        retryDelay: 1500,
        fallbackToCoordinates: true
      });
      
      setLocationLabel(formattedAddress);
    } catch (error) {
      setLocationLabel('Location unavailable');
      setLocationFetched(true); // Mark as fetched even on error to prevent retries
    }
  };

  const handleClose = () => {
    router.dismiss();
  };

  const handleFlipCamera = () => {
    const newType = cameraType === 'back' ? 'front' : 'back';
    setCameraType(newType);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isCapturing) {
      return;
    }

    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        router.push('/create-photo/confirm');
      } else {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        router.push('/create-photo/confirm');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  // Show permission request screen if camera permission is not granted
  if (permission === null) {
    return (
      <Container>
        <Stack.Screen 
          options={{ 
            title: 'Camera Access',
            headerShown: true,
            presentation: 'modal'
          }} 
        />
        <LoadingIndicator 
          variant="fullscreen" 
          text="Checking camera permissions..." 
          size="large"
        />
      </Container>
    );
  }

  if (!permission.granted) {
    return (
      <Container>
        <Stack.Screen 
          options={{ 
            title: 'Camera Access',
            headerShown: true,
            presentation: 'modal'
          }} 
        />
        <EmptyState
          icon="camera"
          title="Camera Access Required"
          description="Please allow camera access to capture photos for your tour."
          actionText="Enable Camera"
          onAction={requestPermission}
        />
      </Container>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen 
        options={{ 
          title: '',
          headerShown: false,
          presentation: 'fullScreenModal'
        }} 
      />

      {/* Camera View */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={cameraType}
        mode="picture"
      />

      {/* Overlay Layer */}
      <View 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0,
          pointerEvents: 'box-none'
        }}
      >
        {/* Header with close button */}
        <View 
          style={{ 
            position: 'absolute',
            top: insets.top + 12,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            pointerEvents: 'auto'
          }}
        >
          <Pressable
            onPress={handleClose}
            style={{
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <FontAwesome name="times" size={20} color="white" />
          </Pressable>
        </View>

        {/* Location Pill */}
        <View 
          style={{ 
            position: 'absolute',
            top: insets.top + 60,
            left: 0,
            right: 0,
            alignItems: 'center',
            pointerEvents: 'auto'
          }}
        >
          <LocationPill 
            location={locationLabel} 
            loading={locationPermission === null || locationLabel === ''}
          />
        </View>

        {/* Footer Controls */}
        <View 
          style={{ 
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            paddingBottom: insets.bottom + 20,
            pointerEvents: 'auto'
          }}
        >
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 32,
            paddingVertical: 24
          }}>
            {/* Flip Button */}
            <FlipButton 
              onPress={handleFlipCamera}
              disabled={isCapturing}
            />

            {/* Shutter Button */}
            <ShutterButton 
              onPress={handleTakePhoto}
              disabled={isCapturing}
              loading={isCapturing}
            />

            {/* Choose from Library Button */}
            <ChooseFromLibraryButton 
              onPress={handleChooseFromLibrary}
              disabled={isCapturing}
            />
          </View>
        </View>
      </View>
    </View>
  );
}