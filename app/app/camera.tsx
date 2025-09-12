import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Alert, AppState, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { isCameraSupported, getCameraStatusMessage } from '../lib/expo-go-detector';

// Conditionally import camera components only if supported
let Camera: any = null;
let useCameraDevice: any = null; // FIX: Changed from useCameraDevices
let useCameraPermission: any = null;

if (isCameraSupported()) {
  try {
    const visionCamera = require('react-native-vision-camera');
    Camera = visionCamera.Camera;
    useCameraDevice = visionCamera.useCameraDevice; // FIX: Import the correct hook for v4
    useCameraPermission = visionCamera.useCameraPermission;
  } catch (error) {
    console.warn('react-native-vision-camera not available:', error);
  }
}

import { tokens } from '../lib/tokens';
import { useGuideStore } from '../state/guide.store';
import { useHistoryStore } from '../state/history.store';
import { mockIdentifyResponse, mockDelay } from '../data/data';
import { CameraTopBar } from '../components/camera/CameraTopBar';
import { CameraBottomBar } from '../components/camera/CameraBottomBar';
import { Viewfinder } from '../components/camera/Viewfinder';
import { HistoryBar } from '../components/camera/HistoryBar';
import { IdentifyResult, GeoLocation } from '../types/schema';

const IDENTIFY_DELAY = 800; // 预识别延迟
const IDENTIFY_TIMEOUT = 5000; // 预识别超时

export default function CameraScreen() {
  console.log('[CameraScreen] Component rendering...');
  const router = useRouter();
  const camera = useRef<any>(null);
  const identifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);
  
  // 权限和设备 - only if camera is supported
  const cameraSupported = isCameraSupported();
  const cameraHooks = cameraSupported && useCameraPermission ? useCameraPermission() : { hasPermission: false, requestPermission: () => Promise.resolve(false) };
  const { hasPermission, requestPermission } = cameraHooks;
  
  // FIX: Use the correct hook from Vision Camera v4
  const device = cameraSupported && useCameraDevice ? useCameraDevice('back') : null;

  console.log(`[CameraScreen] Status - Supported: ${cameraSupported}, Permission: ${hasPermission}`);
  console.log(`[CameraScreen] Selected device (back): ${device ? `ID: ${device.id}, Name: ${device.name}` : 'None'}`);

  // 状态
  const [isActive, setIsActive] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identifyResult, setIdentifyResult] = useState<IdentifyResult | null>(null);
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [lightingCondition, setLightingCondition] = useState<'good' | 'poor' | 'backlight'>('good');
  const [showAlignmentHint, setShowAlignmentHint] = useState(false);
  
  // Store
  const { setMeta, setPrefs } = useGuideStore();
  const { items: historyItems, addItem } = useHistoryStore();
  
  // 获取位置权限和当前位置
  useEffect(() => {
    (async () => {
      console.log('[CameraScreen] Requesting location permission...');
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log(`[CameraScreen] Location permission status: ${status}`);
      if (status === 'granted') {
        try {
          console.log('[CameraScreen] Getting current location...');
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
          console.log(`[CameraScreen] Location obtained: ${location.coords.latitude}, ${location.coords.longitude}`);
        } catch (error) {
          console.error('[CameraScreen] Failed to get location:', error);
        }
      }
    })();
  }, []);
  
  // 应用状态监听
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log(`[CameraScreen] AppState changed to: ${nextAppState}`);
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
      appState.current = nextAppState;
    });
    
    return () => {
      console.log('[CameraScreen] Removing AppState listener.');
      subscription?.remove();
    };
  }, []);
  
  // 请求相机权限
  useEffect(() => {
    console.log(`[CameraScreen] Camera permission check: hasPermission = ${hasPermission}`);
    if (!hasPermission) {
      console.log('[CameraScreen] Requesting camera permission...');
      requestPermission().then((granted) => {
        console.log(`[CameraScreen] Camera permission request result: ${granted}`);
      });
    }
  }, [hasPermission, requestPermission]);
  
  // 预识别逻辑
  const startIdentification = async () => {
    if (!camera.current || !device || !currentLocation || isIdentifying) {
      console.log('[CameraScreen] Pre-identification skipped (camera/device/location not ready or already identifying).');
      return;
    }
    
    console.log('[CameraScreen] Starting identification...');
    setIsIdentifying(true);
    setIdentifyResult(null);
    
    try {
      // 拍摄低清快照
      console.log('[CameraScreen] Taking pre-identification photo...');
      const photo = await camera.current.takePhoto({
        quality: 30, // 低质量用于预识别
        skipMetadata: true,
      });
      console.log(`[CameraScreen] Pre-identification photo taken: ${photo.path}`);
      
      // 模拟识别API调用
      console.log('[CameraScreen] Simulating API call for identification...');
      await mockDelay();
      const result = mockIdentifyResponse.result as IdentifyResult;
      console.log('[CameraScreen] Identification result received:', result);
      
      setIdentifyResult(result);
      
      // 根据置信度给出提示
      if (result && result.confidence < 0.6) {
        setShowAlignmentHint(true);
        setTimeout(() => setShowAlignmentHint(false), 3000);
      }
      
    } catch (error) {
      console.error('[CameraScreen] Identification failed:', error);
      setShowAlignmentHint(true);
      setTimeout(() => setShowAlignmentHint(false), 3000);
    } finally {
      setIsIdentifying(false);
    }
  };
  
  // 延迟预识别
  const scheduleIdentification = () => {
    if (identifyTimer.current) {
      clearTimeout(identifyTimer.current);
    }
    
    identifyTimer.current = setTimeout(() => {
      startIdentification();
    }, IDENTIFY_DELAY);
  };
  
  // 取消预识别
  const cancelIdentification = () => {
    if (identifyTimer.current) {
      clearTimeout(identifyTimer.current);
      identifyTimer.current = null;
    }
    setIsIdentifying(false);
  };
  
  // 拍照处理
  const handleShutter = async () => {
    if (!camera.current || !device || isCapturing) {
      console.log('[CameraScreen] Shutter press ignored (camera/device not ready or already capturing).');
      return;
    }
    
    console.log('[CameraScreen] Shutter pressed.');
    setIsCapturing(true);
    cancelIdentification();
    
    try {
      // 拍摄高清照片
      console.log('[CameraScreen] Taking high-quality photo...');
      const photo = await camera.current.takePhoto({
        quality: 90,
        skipMetadata: false,
      });
      console.log(`[CameraScreen] High-quality photo taken: ${photo.path}`);
      
      // 准备讲解数据
      const lectureData = {
        imageUri: photo.path,
        identifyId: identifyResult?.id,
        geo: currentLocation,
        confidence: identifyResult?.confidence || 0,
        name: identifyResult?.name || '未知对象',
      };
      
      // 设置当前讲解元数据
      setMeta({
        guideId: `guide_${Date.now()}`,
        title: lectureData.name,
        confidence: lectureData.confidence,
        bbox: identifyResult?.bbox,
        coverImage: lectureData.imageUri,
      });
      
      // 跳转到讲解页面
      console.log('[CameraScreen] Navigating to /lecture with data:', lectureData);
      router.push('/lecture');
      
    } catch (error) {
      console.error('[CameraScreen] Capture failed:', error);
      Alert.alert('拍照失败', '请重试');
    } finally {
      setIsCapturing(false);
    }
  };
  
  // 相册导入
  const handleImport = async () => {
    console.log('[CameraScreen] Handling import from library...');
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // 设置导入的图片数据
        setMeta({
          guideId: `guide_${Date.now()}`,
          title: '导入的图片',
          confidence: 0,
          coverImage: asset.uri,
        });
        
        // 跳转到讲解页面
        console.log('[CameraScreen] Image imported, navigating to /lecture with URI:', asset.uri);
        router.push('/lecture');
      } else {
        console.log('[CameraScreen] Image import cancelled.');
      }
    } catch (error) {
      console.error('[CameraScreen] Import failed:', error);
      Alert.alert('导入失败', '请重试');
    }
  };
  
  // 偏好设置
  const handlePreferences = () => {
    // TODO: 实现偏好设置弹窗
    Alert.alert('偏好设置', '功能开发中...');
  };
  
  // 对齐帮助
  const handleAlignmentHelp = () => {
    if (lightingCondition === 'poor') {
      Alert.alert('光线提示', '当前光线较暗，建议开启闪光灯或移至光线充足的地方。');
    } else if (lightingCondition === 'backlight') {
      Alert.alert('光线提示', '检测到逆光，建议调整角度避免强光直射。');
    } else if (showAlignmentHint) {
      Alert.alert('对齐提示', '请尝试：\n• 靠近目标对象\n• 调整拍摄角度\n• 避免反光和阴影');
    }
  };
  
  // 历史记录点击
  const handleHistoryItemPress = (item: any) => {
    setMeta({
      guideId: item.id,
      title: item.title,
      confidence: item.confidence || 0,
      coverImage: item.coverImage,
    });
    
    router.push('/lecture');
  };
  
  // 打开历史抽屉
  const handleHistorySwipeUp = () => {
    router.push('/(modals)/history');
  };
  
  // 取景框点击触发预识别
  const handleViewfinderPress = () => {
    if (!isIdentifying) {
      startIdentification();
    }
  };
  
  // Render Expo Go fallback if camera is not supported
  if (!cameraSupported) {
    console.log('[CameraScreen] Rendering fallback: Camera not supported (likely Expo Go).');
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          
          {/* Expo Go Fallback UI */}
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackTitle}>Camera Not Available</Text>
            <Text style={styles.fallbackMessage}>{getCameraStatusMessage()}</Text>
            
            {/* Import from gallery button */}
            <View style={styles.fallbackActions}>
              <Text style={styles.fallbackSubtitle}>You can still use the app by importing images:</Text>
              {/* Use existing import functionality */}
            </View>
          </View>
          
          {/* Top bar with import */}
          <CameraTopBar onImportPress={handleImport} />
          
          {/* Bottom bar without camera controls */}
          <View style={styles.fallbackBottomBar}>
            <Text style={styles.fallbackBottomText}>Import photos to get started</Text>
          </View>
          
          {/* History bar */}
          <HistoryBar
            recentItems={historyItems.slice(0, 3)}
            onSwipeUp={handleHistorySwipeUp}
            onItemPress={handleHistoryItemPress}
          />
        </View>
      </SafeAreaProvider>
    );
  }
  
  if (!hasPermission) {
    console.log('[CameraScreen] Rendering fallback: Camera permission not granted.');
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackTitle}>Camera Permission Required</Text>
            <Text style={styles.fallbackMessage}>Please grant camera permission to use this feature</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }
  
  // FIX: Show a loading state while the device is being initialized, instead of an error.
  if (device == null) {
    console.log('[CameraScreen] Rendering loading screen: Waiting for camera device...');
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackTitle}>Initializing Camera</Text>
            <Text style={styles.fallbackMessage}>Searching for a camera device...</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }
  
  console.log('[CameraScreen] Rendering main camera view.');
  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* 相机视图 - only render if Camera component is available */}
        {Camera && (
          <Camera
            ref={camera}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isActive && !isCapturing}
            photo={true}
            onInitialized={() => {
              console.log('[CameraScreen] Camera initialized.');
              // 相机初始化后开始预识别
              scheduleIdentification();
            }}
            onError={(error) => {
              console.error('[CameraScreen] Camera runtime error:', error);
              Alert.alert('Camera Error', error.message);
            }}
          />
        )}
        
        {/* 顶部栏 */}
        <CameraTopBar onImportPress={handleImport} />
        
        {/* 取景器 */}
        <Viewfinder
          identifyResult={identifyResult || undefined}
          isIdentifying={isIdentifying}
          onFramePress={handleViewfinderPress}
        />
        
        {/* 底部控制栏 */}
        <CameraBottomBar
          onShutterPress={handleShutter}
          onPreferencesPress={handlePreferences}
          onAlignmentHelpPress={handleAlignmentHelp}
          isCapturing={isCapturing}
          shutterDisabled={!device}
          showAlignmentHint={showAlignmentHint}
          lightingCondition={lightingCondition}
        />
        
        {/* 历史条 */}
        <HistoryBar
          recentItems={historyItems.slice(0, 3)}
          onSwipeUp={handleHistorySwipeUp}
          onItemPress={handleHistoryItemPress}
        />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tokens.colors.background,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.xl,
  },
  fallbackTitle: {
    fontSize: tokens.typography.fontSize.h2,
    fontWeight: '700',
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  fallbackMessage: {
    fontSize: tokens.typography.fontSize.body,
    color: tokens.colors.text,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: tokens.spacing.lg,
  },
  fallbackActions: {
    alignItems: 'center',
  },
  fallbackSubtitle: {
    fontSize: tokens.typography.fontSize.caption,
    color: tokens.colors.text,
    textAlign: 'center',
    marginBottom: tokens.spacing.md,
  },
  fallbackBottomBar: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.lg,
  },
  fallbackBottomText: {
    fontSize: tokens.typography.fontSize.caption,
    color: tokens.colors.text,
    textAlign: 'center',
  },
});