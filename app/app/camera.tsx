import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { isCameraSupported, getCameraStatusMessage } from '../lib/expo-go-detector';
import { useHistoryStore } from '../state/history.store';
import { CameraTopBar } from '../components/camera/CameraTopBar';
import { CameraBottomBar } from '../components/camera/CameraBottomBar';
import { Viewfinder } from '../components/camera/Viewfinder';
import { HistoryBar } from '../components/camera/HistoryBar';
import { FallbackStatus } from '../components/camera/FallbackStatus';
import { cameraStyles } from '../styles/camera.styles';
import { useCamera } from '../hooks/useCamera';

// Camera component is provided by the hook via refs; keep typing minimal here
let CameraComp: any = null;
try {
  const visionCamera = require('react-native-vision-camera');
  CameraComp = visionCamera.Camera;
} catch {}

export default function CameraScreen() {
  const { items: historyItems } = useHistoryStore();
  const { state, actions, refs } = useCamera();

  const cameraSupported = isCameraSupported();

  if (!cameraSupported) {
    return (
      <View style={cameraStyles.container}>
        <StatusBar style="light" />
        <FallbackStatus
          title="Camera Not Available"
          message={getCameraStatusMessage()}
          subtitle="You can still use the app by importing images:"
          bottomText="Import photos to get started"
          renderTopBar={<CameraTopBar onImportPress={actions.handleImport} />}
        />
        <HistoryBar
          recentItems={historyItems.slice(0, 3)}
          onSwipeUp={() => {
            // history modal route
            // handled externally in HistoryBar
          }}
          onItemPress={(item: any) => {
            // Navigate via HistoryCard internal action; kept for compatibility
            Alert.alert('历史记录', '请从历史页面进入重播');
          }}
        />
      </View>
    );
  }

  if (!state.hasPermission) {
    return (
      <View style={cameraStyles.container}>
        <StatusBar style="light" />
        <FallbackStatus title="Camera Permission Required" message="Please grant camera permission to use this feature" />
      </View>
    );
  }

  if (state.device == null) {
    return (
      <View style={cameraStyles.container}>
        <StatusBar style="light" />
        <FallbackStatus title="Initializing Camera" message="Searching for a camera device..." />
      </View>
    );
  }

  if (!state.isFocused) {
    return <View style={cameraStyles.container} />;
  }

  return (
    <View style={cameraStyles.container}>
      <StatusBar style="light" />
      {CameraComp && (
        <CameraComp
          ref={refs.camera}
          style={StyleSheet.absoluteFill}
          device={state.device}
          isActive={state.isFocused && state.isActive && !state.isCapturing}
          photo={true}
          onInitialized={() => {
            actions.scheduleIdentification();
          }}
          onError={(error: Error) => {
            Alert.alert('Camera Error', error.message);
          }}
        />
      )}

      <CameraTopBar onImportPress={actions.handleImport} />

      <Viewfinder
        identifyResult={state.identifyResult || undefined}
        isIdentifying={state.isIdentifying}
        onFramePress={() => {
          if (!state.isIdentifying) actions.startIdentification();
        }}
      />

      <CameraBottomBar
        onShutterPress={actions.takePhoto}
        onPreferencesPress={() => Alert.alert('偏好设置', '功能开发中...')}
        onAlignmentHelpPress={() => {
          if (state.lightingCondition === 'poor') {
            Alert.alert('光线提示', '当前光线较暗，建议开启闪光灯或移至光线充足的地方。');
          } else if (state.lightingCondition === 'backlight') {
            Alert.alert('光线提示', '检测到逆光，建议调整角度避免强光直射。');
          } else if (state.showAlignmentHint) {
            Alert.alert('对齐提示', '请尝试：\n• 靠近目标对象\n• 调整拍摄角度\n• 避免反光和阴影');
          }
        }}
        isCapturing={state.isCapturing}
        shutterDisabled={!state.device}
        showAlignmentHint={state.showAlignmentHint}
        lightingCondition={state.lightingCondition}
      />

      <HistoryBar
        recentItems={historyItems.slice(0, 3)}
        onSwipeUp={() => {
          // handled in history modal route
          // keep UI consistent
        }}
        onItemPress={(item: any) => {
          Alert.alert('历史记录', '请从历史页面进入重播');
        }}
      />
    </View>
  );
}
