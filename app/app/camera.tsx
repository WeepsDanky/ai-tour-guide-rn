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
let useCameraDevices: any = null;
let useCameraPermission: any = null;

if (isCameraSupported()) {
  try {
    const visionCamera = require('react-native-vision-camera');
    Camera = visionCamera.Camera;
    useCameraDevices = visionCamera.useCameraDevices;
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
  const router = useRouter();
  const camera = useRef<any>(null);
  const identifyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const appState = useRef(AppState.currentState);
  
  // 权限和设备 - only if camera is supported
  const cameraSupported = isCameraSupported();
  const cameraHooks = cameraSupported && useCameraPermission ? useCameraPermission() : { hasPermission: false, requestPermission: () => {} };
  const { hasPermission, requestPermission } = cameraHooks;
  const devices = cameraSupported && useCameraDevices ? useCameraDevices() : {};
  const device = devices?.back;
  
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });
        } catch (error) {
          console.warn('Failed to get location:', error);
        }
      }
    })();
  }, []);
  
  // 应用状态监听
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
      appState.current = nextAppState;
    });
    
    return () => subscription?.remove();
  }, []);
  
  // 请求相机权限
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);
  
  // 预识别逻辑
  const startIdentification = async () => {
    if (!camera.current || !device || !currentLocation || isIdentifying) {
      return;
    }
    
    setIsIdentifying(true);
    setIdentifyResult(null);
    
    try {
      // 拍摄低清快照
      const photo = await camera.current.takePhoto({
        quality: 30, // 低质量用于预识别
        skipMetadata: true,
      });
      
      // 模拟识别API调用
      await mockDelay();
      const result = mockIdentifyResponse.result as IdentifyResult;
      
      setIdentifyResult(result);
      
      // 根据置信度给出提示
      if (result && result.confidence < 0.6) {
        setShowAlignmentHint(true);
        setTimeout(() => setShowAlignmentHint(false), 3000);
      }
      
    } catch (error) {
      console.error('Identification failed:', error);
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
      return;
    }
    
    setIsCapturing(true);
    cancelIdentification();
    
    try {
      // 拍摄高清照片
      const photo = await camera.current.takePhoto({
        quality: 90,
        skipMetadata: false,
      });
      
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
      router.push('/lecture');
      
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('拍照失败', '请重试');
    } finally {
      setIsCapturing(false);
    }
  };
  
  // 相册导入
  const handleImport = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
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
        router.push('/lecture');
      }
    } catch (error) {
      console.error('Import failed:', error);
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
  
  if (!device) {
    return (
      <SafeAreaProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <View style={styles.fallbackContainer}>
            <Text style={styles.fallbackTitle}>Camera Not Available</Text>
            <Text style={styles.fallbackMessage}>No camera device found</Text>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }
  
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
              // 相机初始化后开始预识别
              scheduleIdentification();
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