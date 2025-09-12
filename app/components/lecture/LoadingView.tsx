import React from 'react';
import { View, Text } from 'react-native';
import { lectureStyles } from '../../styles/lecture.styles';

type LoadingViewProps = {
  title: string;
};

export function LoadingView({ title }: LoadingViewProps) {
  return (
    <View style={lectureStyles.loadingContainer}>
      <Text style={lectureStyles.loadingText}>{title}</Text>
    </View>
  );
}


