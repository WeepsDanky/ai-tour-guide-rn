import React, { useEffect, useCallback } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCreateTour } from '@/features/create-tour/context/CreateTourContext';
import { Button } from '@/ui/atoms/Button';

interface CreateTourModalProps {
  isVisible: boolean;
  onClose: () => void;
}

const AnimatedButton = ({
  onPress,
  icon,
  title,
  delay,
  isVisible,
}: {
  onPress: () => void;
  icon: keyof typeof FontAwesome.glyphMap;
  title: string;
  delay: number;
  isVisible: boolean;
}) => {
  const animatedY = useSharedValue(50);
  const animatedOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedOpacity.value,
    transform: [{ translateY: animatedY.value }],
  }));

  useEffect(() => {
    if (isVisible) {
      animatedY.value = withDelay(delay, withSpring(0, { damping: 15, stiffness: 120 }));
      animatedOpacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    } else {
      animatedY.value = 50;
      animatedOpacity.value = 0;
    }
  }, [isVisible, animatedY, animatedOpacity, delay]);

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center bg-white p-4 rounded-xl border border-gray-200 mb-4">
        <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-4">
          <FontAwesome name={icon} size={18} color="#3B82F6" />
        </View>
        <Text className="text-base font-semibold text-gray-800">{title}</Text>
        <FontAwesome name="chevron-right" size={14} color="#9CA3AF" className="ml-auto" />
      </Pressable>
    </Animated.View>
  );
};

export function CreateTourModal({ isVisible, onClose }: CreateTourModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setPhotoUri } = useCreateTour();

  const translateY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = useCallback(() => {
    translateY.value = withTiming(500, { duration: 300 });
    backdropOpacity.value = withTiming(0, { duration: 300 }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, translateY, backdropOpacity]);

  useEffect(() => {
    if (isVisible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 18, stiffness: 150 });
    }
  }, [isVisible, backdropOpacity, translateY]);

  const handleFromPhoto = () => {
    handleClose();
    router.push('/create-photo/capture');
  };

  const handleFromAlbum = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setPhotoUri(result.assets[0].uri);
        handleClose();
        router.push('/create-photo/confirm');
      }
    } catch (error) {
      console.error('Failed to select photo from library:', error);
      Alert.alert('Error', 'Failed to select photo. Please try again.');
    }
  };

  const handleFromBlank = () => {
    handleClose();
    router.push('/map');
  };

  return (
    <Modal visible={isVisible} transparent onRequestClose={handleClose}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleClose}>
        <Animated.View className="flex-1 bg-black/60" style={animatedBackdropStyle} />
      </Pressable>
      <Animated.View
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            paddingBottom: insets.bottom,
            minHeight: '50%',
          },
          animatedContainerStyle,
        ]}
        className="bg-gray-100 rounded-t-2xl p-6">
        <Text className="text-xl font-bold text-gray-900 mb-2 text-center">Create New Journey</Text>
        <Text className="text-gray-600 mb-6 text-center">
          How would you like to start your next adventure?
        </Text>

        <AnimatedButton
          title="From a Photo"
          icon="camera"
          onPress={handleFromPhoto}
          delay={50}
          isVisible={isVisible}
        />
        <AnimatedButton
          title="From an Album"
          icon="image"
          onPress={handleFromAlbum}
          delay={150}
          isVisible={isVisible}
        />

        <Pressable
          onPress={handleClose}
          className="w-12 h-12 bg-white rounded-full items-center justify-center self-center mt-6 shadow-md">
          <FontAwesome name="times" size={20} color="#6B7280" />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}