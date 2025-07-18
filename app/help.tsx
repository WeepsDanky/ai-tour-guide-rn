import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { ScreenLayout } from '../src/ui/layout/ScreenLayout';
import { Card, CardContent } from '../src/ui/molecules/Card';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

export default function HelpScreen() {
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: '1',
      question: 'How do I create a tour?',
      answer: 'Go to the Create tab, enter your location, add optional photos, and tap "Generate My Tour". The AI will create a personalized tour based on your preferences and location.',
    },
    {
      id: '2',
      question: 'Why is my location not being detected?',
      answer: 'Make sure you have granted location permissions to the app. Go to your device Settings > Privacy > Location Services and ensure the app has permission to access your location.',
    },
    {
      id: '3',
      question: 'Can I use the app without an internet connection?',
      answer: 'The app requires an internet connection to generate tours and access map data. However, once a tour is downloaded, you can listen to audio content offline.',
    },
    {
      id: '4',
      question: 'How do I configure my AMap API settings?',
      answer: 'Go to Settings from your Profile and enter your AMap JS API key and security code. These are required for map functionality and location services.',
    },
    {
      id: '5',
      question: 'What if a tour generation fails?',
      answer: 'If tour generation fails, check your internet connection and try again. Make sure your location is valid and you have configured your API settings correctly.',
    },
    {
      id: '6',
      question: 'How can I improve tour quality?',
      answer: 'Adding photos helps the AI understand your preferences better. Also, be specific in your location input and use the additional preferences field to mention specific interests.',
    },
  ];

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenLayout
        title="Help & Support"
        subtitle="Get help and find answers"
        showBackButton={true}
        variant="large"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4 space-y-6">
            
            {/* FAQ Section */}
            <Card>
              <CardContent>
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Frequently Asked Questions
                </Text>
                <View className="space-y-2">
                  {faqItems.map((item) => (
                    <View key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <Pressable
                        onPress={() => toggleFAQ(item.id)}
                        className="p-4 bg-gray-50 flex-row items-center justify-between"
                      >
                        <Text className="text-sm font-medium text-gray-900 flex-1 mr-2">
                          {item.question}
                        </Text>
                        <FontAwesome
                          name={expandedFAQ === item.id ? 'chevron-up' : 'chevron-down'}
                          size={14}
                          color="#6B7280"
                        />
                      </Pressable>
                      {expandedFAQ === item.id && (
                        <View className="p-4 bg-white">
                          <Text className="text-sm text-gray-700 leading-relaxed">
                            {item.answer}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </CardContent>
            </Card>

          </View>
        </ScrollView>
      </ScreenLayout>
    </>
  );
} 