import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  const router = useRouter();
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
      {/* Log identify state changes for debugging empty candidates */}
      {/* {__DEV__ && console.log('[camera] identifyResult:', state.identifyResult, 'isIdentifying:', state.isIdentifying)} */}
      {CameraComp && (
        <CameraComp
          ref={refs.camera}
          style={StyleSheet.absoluteFill}
          device={state.device}
          isActive={state.isFocused && state.isActive}
          photo={true}
          onInitialized={() => {
            actions.scheduleIdentification();
          }}
          onError={(error: Error) => {
            Alert.alert('Camera Error', error.message);
          }}
        />
      )}

      <CameraTopBar 
        onImportPress={actions.handleImport} 
        onProfilePress={() => router.push('/profile')} 
      />

      <Viewfinder
        identifyResult={state.identifyResult || undefined}
        isIdentifying={state.isIdentifying}
        onFramePress={() => {
          if (!state.isIdentifying) actions.startIdentification();
        }}
      />

      <CameraBottomBar
        onShutterPress={actions.takePhoto}
        onImportPress={actions.handleImport}
        onHistoryPress={() => router.push('/history')}
        isCapturing={state.isCapturing}
        shutterDisabled={!state.device}
      />
    </View>
  );
}
