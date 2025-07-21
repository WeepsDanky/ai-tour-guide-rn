import React, { useState, useEffect, useRef } from 'react';
import { View, Alert, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCreateTour } from '../../../src/context/CreateTourContext';
import { LocationPill } from '../../../src/ui/molecules/LocationPill';
import { ShutterButton, FlipButton, ChooseFromLibraryButton } from '../../../src/ui/atoms';
import { EmptyState } from '../../../src/ui/molecules/EmptyState';
import { Container } from '../../../src/ui/atoms/Container';
import { LoadingIndicator } from '../../../src/ui/atoms/LoadingIndicator';

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
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    } catch (error) {
      console.error('Failed to request location permission:', error);
      setLocationPermission(false);
    }
  };

  const getCurrentLocation = async () => {
    if (!locationPermission || locationFetched) return;

    try {
      setLocationFetched(true);
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region
        ].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        
        setLocationLabel(formattedAddress);
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      setLocationLabel('Location unavailable');
    }
  };

  const handleClose = () => {
    router.dismiss();
  };

  const handleFlipCamera = () => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
  };

  const handleTakePhoto = async () => {
    if (!cameraRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        setPhotoUri(photo.uri);
        router.push('/create-photo/confirm');
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
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
      console.error('Failed to select photo:', error);
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