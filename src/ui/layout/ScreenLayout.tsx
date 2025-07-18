import React from 'react';
import { View, ViewStyle } from 'react-native';
import { AppHeader, AppHeaderProps } from './AppHeader';

interface ScreenLayoutProps extends Omit<AppHeaderProps, 'style'> {
  children: React.ReactNode;
  showHeader?: boolean;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
}

export function ScreenLayout({
  children,
  showHeader = true,
  headerStyle,
  contentStyle,
  backgroundColor = '#F9FAFB',
  ...headerProps
}: ScreenLayoutProps) {
  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {showHeader && (
        <AppHeader
          {...headerProps}
          style={headerStyle}
        />
      )}
      
      <View className="flex-1" style={contentStyle}>
        {children}
      </View>
    </View>
  );
} 