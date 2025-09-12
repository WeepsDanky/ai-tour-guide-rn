import React from 'react';
import { View, Image, Text } from 'react-native';
import { lectureStyles } from '../../styles/lecture.styles';

type CoverProps = {
  imageUri: string;
  title?: string;
};

export function Cover({ imageUri, title }: CoverProps) {
  return (
    <View style={lectureStyles.coverContainer}>
      <Image source={{ uri: imageUri }} style={lectureStyles.coverImage} resizeMode="cover" />
      <View style={lectureStyles.coverOverlay} />
      {title ? (
        <View style={lectureStyles.titleContainer}>
          <Text style={lectureStyles.title}>{title}</Text>
        </View>
      ) : null}
    </View>
  );
}


