import React from 'react';
import { View, Text } from 'react-native';
import { cameraStyles } from '../../styles/camera.styles';

type FallbackStatusProps = {
  title: string;
  message: string;
  subtitle?: string;
  bottomText?: string;
  renderTopBar?: React.ReactNode;
  renderBottomBar?: React.ReactNode;
};

export function FallbackStatus({ title, message, subtitle, bottomText, renderTopBar, renderBottomBar }: FallbackStatusProps) {
  return (
    <View style={cameraStyles.container}>
      {renderTopBar}
      <View style={cameraStyles.fallbackContainer}>
        <Text style={cameraStyles.fallbackTitle}>{title}</Text>
        <Text style={cameraStyles.fallbackMessage}>{message}</Text>
        {subtitle ? (
          <View style={cameraStyles.fallbackActions}>
            <Text style={cameraStyles.fallbackSubtitle}>{subtitle}</Text>
          </View>
        ) : null}
      </View>
      {bottomText ? (
        <View style={cameraStyles.fallbackBottomBar}>
          <Text style={cameraStyles.fallbackBottomText}>{bottomText}</Text>
        </View>
      ) : null}
      {renderBottomBar}
    </View>
  );
}


