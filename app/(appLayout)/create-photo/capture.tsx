import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
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
  }, [locationPermission, locationFetched, locationLabel]);

  const requestLocationPermission = async () => {
    // Prevent multiple permission requests
    if (locationPermission !== null) {
      return;
    }
    
    console.log('[CapturePhoto] Requesting location permission...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[CapturePhoto] Location permission status:', status);
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('[CapturePhoto] Failed to request location permission:', error);
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission || locationFetched || locationLabel !== '') {
      console.log('[CapturePhoto] Skipping location fetch - permission:', locationPermission, 'fetched:', locationFetched, 'label:', locationLabel);
      return;
    }

    console.log('[CapturePhoto] Getting current location...');
    try {
      setLocationFetched(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 10
      });
      const { latitude, longitude } = location.coords;
      console.log('[CapturePhoto] Location coordinates:', latitude, longitude);
      
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      console.log('[CapturePhoto] Reverse geocode results:', addresses);
      
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        console.log('[CapturePhoto] Formatted address:', formattedAddress);
        setLocationLabel(formattedAddress);
      } else {
        console.warn('[CapturePhoto] No addresses found for coordinates');
        setLocationLabel(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('[CapturePhoto] Failed to get location:', error);
      setLocationLabel('Location unavailable');
      setLocationFetched(true); // Mark as fetched even on error to prevent retries
    }
  };

  const handleClose = () => {
    console.log('[CapturePhoto] User closed camera screen');
    router.dismiss();
  };

  const handleFlipCamera = () => {
    const newType = cameraType === 'back' ? 'front' : 'back';
    console.log('[CapturePhoto] Flipping camera from', cameraType, 'to', newType);
    setCameraType(newType);
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isCapturing) {
      console.log('[CapturePhoto] Cannot take photo - camera ref:', !!cameraRef.current, 'capturing:', isCapturing);
      return;
    }

    console.log('[CapturePhoto] Taking photo...');
    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      console.log('[CapturePhoto] Photo captured:', photo?.uri);
      if (photo?.uri) {
        setPhotoUri(photo.uri);
        console.log('[CapturePhoto] Navigating to confirm screen');
        router.push('/create-photo/confirm');
      } else {
        console.warn('[CapturePhoto] Photo capture returned no URI');
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      console.error('[CapturePhoto] Failed to take photo:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleChooseFromLibrary = async () => {
    console.log('[CapturePhoto] Opening image library...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      console.log('[CapturePhoto] Image picker result:', result);
      if (!result.canceled && result.assets[0]) {
        console.log('[CapturePhoto] Photo selected:', result.assets[0].uri);
        setPhotoUri(result.assets[0].uri);
        console.log('[CapturePhoto] Navigating to confirm screen');
        router.push('/create-photo/confirm');
      } else {
        console.log('[CapturePhoto] User cancelled image selection');
      }
    } catch (error) {
      console.error('[CapturePhoto] Failed to select photo:', error);
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