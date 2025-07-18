import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Alert, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { Container } from '../../src/ui/atoms/Container';
import { Button } from '../../src/ui/atoms/Button';
import { Card, CardContent } from '../../src/ui/molecules/Card';
import { Modal, ModalContent, ModalFooter } from '../../src/ui/molecules/Modal';
import { ProgressIndicator } from '../../src/ui/atoms/ProgressIndicator';
import { LoadingIndicator } from '../../src/ui/atoms/LoadingIndicator';
import { mockTourGeneration, mockProgressCheck, TourGenerationTask } from '../../src/lib/mock-data';
import { TourRequest } from '~/types';

export default function CreateScreen() {
  const [location, setLocation] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [preferences, setPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  
  // Progress modal state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [generationTask, setGenerationTask] = useState<TourGenerationTask | null>(null);
  
  const router = useRouter();

  const getCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      
      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location access to use this feature.');
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addresses.length > 0) {
        const address = addresses[0];
        const formattedAddress = [
          address.name,
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        
        setLocation(formattedAddress);
      } else {
        setLocation(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const selectPhotos = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: 5,
      });

      if (!result.canceled) {
        const newPhotos = result.assets.map(asset => asset.uri);
        setPhotos(prev => [...prev, ...newPhotos].slice(0, 5)); // Maximum 5 photos
      }
    } catch (error) {
      console.error('Failed to select photos:', error);
      Alert.alert('Error', 'Failed to select photos. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const startTourGeneration = async () => {
    if (!location.trim()) {
      Alert.alert('Location Required', 'Please enter a location or use your current location.');
      return;
    }

    try {
      setLoading(true);
      
      const request: TourRequest = {
        location: location.trim(),
        photos,
      };

      // Start tour generation
      const { taskId } = await mockTourGeneration(request);
      
      // Show progress modal and start polling
      setShowProgressModal(true);
      setLoading(false);
      
      pollGenerationProgress(taskId);
      
    } catch (error) {
      setLoading(false);
      console.error('Failed to generate tour:', error);
      Alert.alert('Error', 'Failed to start tour generation. Please try again.');
    }
  };

  const pollGenerationProgress = async (taskId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // 1 minute with 2-second intervals
    
    const poll = async () => {
      try {
        const task = await mockProgressCheck(taskId);
        setGenerationTask(task);
        
        if (task.phase === 'audio_ready' && task.payload) {
          // Tour generation complete
          setShowProgressModal(false);
          Alert.alert(
            'Tour Ready!',
            'Your personalized tour has been generated successfully.',
            [
              { text: 'View Tour', onPress: () => handleTourComplete(task.payload!) },
              { text: 'Later', style: 'cancel' }
            ]
          );
          return;
        }
        
        if (task.phase === 'error') {
          setShowProgressModal(false);
          Alert.alert('Generation Failed', task.error || 'An error occurred during tour generation.');
          return;
        }
        
        // Continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setShowProgressModal(false);
          Alert.alert('Timeout', 'Tour generation is taking longer than expected. Please try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        setShowProgressModal(false);
        Alert.alert('Error', 'Failed to check generation progress.');
      }
    };
    
    poll();
  };

  const handleTourComplete = (tour: any) => {
    // Navigate to map screen with the generated tour
    router.push({
      pathname: '/map',
      params: { tourData: JSON.stringify(tour) }
    });
  };

  const closeProgressModal = () => {
    setShowProgressModal(false);
    setGenerationTask(null);
  };

  return (
    <Container>
      <Stack.Screen options={{ title: 'Create Tour' }} />
      
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4 space-y-6">
          {/* Location Section */}
          <Card>
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Location
              </Text>
              <View className="space-y-3">
                <TextInput
                  value={location}
                  onChangeText={setLocation}
                  placeholder="Enter a location or city"
                  className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                  multiline
                />
                <Button
                  title={fetchingLocation ? "Getting Location..." : "Use Current Location"}
                  onPress={getCurrentLocation}
                  disabled={fetchingLocation}
                  className="bg-blue-100"
                />
              </View>
            </CardContent>
          </Card>

          {/* Photos Section */}
          <Card>
            <CardContent>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-lg font-semibold text-gray-900">
                  Photos ({photos.length}/5)
                </Text>
                <Pressable onPress={selectPhotos} className="p-2">
                  <FontAwesome name="plus" size={20} color="#3B82F6" />
                </Pressable>
              </View>
              
              {photos.length > 0 ? (
                <View className="flex-row flex-wrap gap-2">
                  {photos.map((photo, index) => (
                    <View key={index} className="relative">
                      <Image 
                        source={{ uri: photo }}
                        className="w-20 h-20 rounded-lg"
                        resizeMode="cover"
                      />
                      <Pressable
                        onPress={() => removePhoto(index)}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                      >
                        <FontAwesome name="times" size={12} color="white" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <Pressable 
                  onPress={selectPhotos}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 items-center"
                >
                  <FontAwesome name="camera" size={32} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2 text-center">
                    Add photos to help personalize your tour
                  </Text>
                </Pressable>
              )}
            </CardContent>
          </Card>

          {/* Additional Preferences */}
          <Card>
            <CardContent>
              <Text className="text-lg font-semibold text-gray-900 mb-3">
                Additional Preferences (Optional)
              </Text>
              <TextInput
                value={preferences}
                onChangeText={setPreferences}
                placeholder="Any specific requests or preferences..."
                multiline
                numberOfLines={3}
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900"
                textAlignVertical="top"
              />
            </CardContent>
          </Card>

          {/* Generate Button */}
          <View className="pb-8">
            <Button
              title={loading ? "Starting Generation..." : "Generate My Tour"}
              onPress={startTourGeneration}
              disabled={loading || !location.trim()}
              className="py-4"
            />
          </View>
        </View>
      </ScrollView>

      {/* Progress Modal */}
      <Modal
        isVisible={showProgressModal}
        onClose={closeProgressModal}
        title="Generating Your Tour"
        size="medium"
        showCloseButton={false}
      >
        <ModalContent>
          {generationTask ? (
            <View className="space-y-4">
              <ProgressIndicator
                progress={generationTask.progress}
                text={generationTask.message}
                size="large"
              />
              
              <View className="bg-gray-50 rounded-lg p-4">
                <Text className="text-sm text-gray-600 text-center">
                  This may take a few moments while we create your personalized tour...
                </Text>
              </View>
            </View>
          ) : (
            <LoadingIndicator text="Initializing..." />
          )}
        </ModalContent>
        
        <ModalFooter>
          <Button
            title="Cancel"
            onPress={closeProgressModal}
            className="bg-gray-200 text-gray-700"
          />
        </ModalFooter>
      </Modal>
    </Container>
  );
} 