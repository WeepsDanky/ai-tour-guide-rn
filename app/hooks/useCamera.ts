import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system';
import { useIsFocused } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { isCameraSupported } from '../lib/expo-go-detector';
import { useGuideStore } from '../state/guide.store';
import type { GeoLocation, IdentifyResult } from '../types/schema';
import { IdentifyApi } from '../lib/api';

// Conditionally resolve camera hooks to remain safe in Expo Go
let useCameraDeviceReal: any = null;
let useCameraPermissionReal: any = null;

if (isCameraSupported()) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const visionCamera = require('react-native-vision-camera');
    useCameraDeviceReal = visionCamera.useCameraDevice; // v4 API
    useCameraPermissionReal = visionCamera.useCameraPermission;
  } catch (error) {
    console.warn('react-native-vision-camera not available:', error);
  }
}

type UseCameraPermissionCompat = () => { hasPermission: boolean; requestPermission: () => Promise<boolean> };
const useCameraPermissionCompat: UseCameraPermissionCompat =
  useCameraPermissionReal ??
  function useCameraPermissionCompatFallback() {
    const [hasPermission] = React.useState(false);
    const requestPermission = useCallback(async () => false, []);
    return { hasPermission, requestPermission };
  };

type UseCameraDeviceCompat = (position: 'back' | 'front') => any;
const useCameraDeviceCompat: UseCameraDeviceCompat =
  useCameraDeviceReal ??
  function useCameraDeviceCompatFallback() {
    return null;
  };

const IDENTIFY_DELAY = 800;

export interface UseCameraReturn {
  state: {
    isFocused: boolean;
    hasPermission: boolean;
    device: any;
    isActive: boolean;
    isCapturing: boolean;
    isIdentifying: boolean;
    identifyResult: IdentifyResult | null;
    lightingCondition: 'good' | 'poor' | 'backlight';
    showAlignmentHint: boolean;
  };
  actions: {
    takePhoto: () => Promise<void>;
    handleImport: () => Promise<void>;
    startIdentification: () => Promise<void>;
    scheduleIdentification: () => void;
    cancelIdentification: () => void;
  };
  refs: {
    camera: React.RefObject<any>;
  };
}

export function useCamera(): UseCameraReturn {
  const router = useRouter();
  const isFocused = useIsFocused();
  const camera = useRef<any>(null);
  const identifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);

  // Permissions and device
  const { hasPermission, requestPermission } = useCameraPermissionCompat();
  const device = useCameraDeviceCompat('back');

  // Local state
  const [isActive, setIsActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [lightingCondition] = useState<'good' | 'poor' | 'backlight'>('good');
  const [showAlignmentHint, setShowAlignmentHint] = useState(false);

  // Store
  const setMeta = useGuideStore((s) => s.setMeta);

  // Request location
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({ lat: location.coords.latitude, lng: location.coords.longitude, accuracyM: location.coords.accuracy ? Math.round(location.coords.accuracy) : undefined });
        }
      } catch (error) {
        console.error('[useCamera] Failed to get location:', error);
      }
    })();
  }, []);

  // AppState listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setIsActive(true);
      } else if (nextAppState !== 'active') {
        setIsActive(false);
      }
      appState.current = nextAppState;
    });
    return () => subscription?.remove();
  }, []);

  // Focus change cancels identification (placed after cancelIdentification definition)

  // Request camera permission
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch(() => {});
    }
  }, [hasPermission, requestPermission]);

  const startIdentification = useCallback(async () => {
    if (!camera.current || !device || !currentLocation || isIdentifying || isCapturing || !hasPermission) {
      return;
    }
    setIsIdentifying(true);
    setIdentifyResult(null);
    try {
      const photo = await camera.current.takePhoto({ quality: 30, skipMetadata: true });
      const fileUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
      // Send raw base64 (no data URL prefix). Backend will add the MIME header.
      const resp = await IdentifyApi.identify(base64, currentLocation);
      const candidates = resp.candidates || [];
      if (candidates.length === 0) {
        setIdentifyResult({ id: resp.identifyId, name: '没有识别到物体', confidence: 0 });
        setShowAlignmentHint(true);
        setTimeout(() => setShowAlignmentHint(false), 3000);
        return;
      }
      const best = candidates[0];
      const result: IdentifyResult = {
        id: resp.identifyId,
        name: best ? best.spot : '未知对象',
        confidence: best ? best.confidence : 0,
      };
      setIdentifyResult(result);
      if (result.confidence < 0.6) {
        setShowAlignmentHint(true);
        setTimeout(() => setShowAlignmentHint(false), 3000);
      }
    } catch (error) {
      console.error('[useCamera] Identification failed:', error);
      setIdentifyResult({ id: '', name: '识别失败', confidence: 0 });
      setShowAlignmentHint(true);
      setTimeout(() => setShowAlignmentHint(false), 3000);
    } finally {
      setIsIdentifying(false);
    }
  }, [camera, device, currentLocation, isIdentifying, hasPermission, isCapturing]);

  const scheduleIdentification = useCallback(() => {
    if (identifyTimer.current) clearTimeout(identifyTimer.current);
    identifyTimer.current = setTimeout(() => {
      startIdentification();
    }, IDENTIFY_DELAY);
  }, [startIdentification]);

  const cancelIdentification = useCallback(() => {
    if (identifyTimer.current) {
      clearTimeout(identifyTimer.current);
      identifyTimer.current = null;
    }
    setIsIdentifying(false);
  }, []);

  const takePhoto = useCallback(async () => {
    // Allow interrupting identification: do NOT block when isIdentifying is true
    if (!camera.current || !device || isCapturing || !hasPermission) return;
    setIsCapturing(true);
    // Cancel any scheduled or in-progress identification UI state
    cancelIdentification();
    try {
      const photo = await camera.current.takePhoto({ quality: 90, skipMetadata: false });
      const imageUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
      const geoParam = currentLocation ? encodeURIComponent(JSON.stringify(currentLocation)) : undefined;
      // Optimistically set some meta info; real meta will replace after WS connects
      setMeta({
        guideId: `guide_${Date.now()}`,
        title: identifyResult?.name || '未知对象',
        confidence: identifyResult?.confidence || 0,
        bbox: identifyResult?.bbox,
        coverImage: imageUri,
      });
      router.push({ pathname: '/lecture', params: { imageUri, identifyId: identifyResult?.id, geo: geoParam } as any });
    } catch (error) {
      console.error('[useCamera] Capture failed:', error);
      const message = (error as Error)?.message || '请重试';
      Alert.alert('拍照失败', message);
    } finally {
      setIsCapturing(false);
    }
  }, [camera, device, isCapturing, hasPermission, cancelIdentification, identifyResult, currentLocation, router, setMeta]);

  const handleImport = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setMeta({ guideId: `guide_${Date.now()}`, title: '导入的图片', confidence: 0, coverImage: asset.uri });
        router.push({ pathname: '/lecture', params: { imageUri: asset.uri } });
      }
    } catch (error) {
      console.error('[useCamera] Import failed:', error);
      Alert.alert('导入失败', '请重试');
    }
  }, [router, setMeta]);

  return {
    state: {
      isFocused,
      hasPermission,
      device,
      isActive,
      isCapturing,
      isIdentifying,
      identifyResult,
      lightingCondition,
      showAlignmentHint,
    },
    actions: {
      takePhoto,
      handleImport,
      startIdentification,
      scheduleIdentification,
      cancelIdentification,
    },
    refs: { camera },
  };
}


