import React from 'react';
import { View, Text, ActivityIndicator, ViewProps } from 'react-native';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Loading indicator variants for different display contexts
 */
export type LoadingVariant = 'fullscreen' | 'inline' | 'overlay';

/**
 * Loading indicator sizes
 */
export type LoadingSize = 'small' | 'large';

/**
 * Props for the LoadingIndicator component
 */
export interface LoadingIndicatorProps extends ViewProps {
  /** Size of the activity indicator */
  size?: LoadingSize;
  /** Optional text to display below the indicator */
  text?: string;
  /** Display variant affecting positioning and background */
  variant?: LoadingVariant;
}

/**
 * A loading indicator component with consistent styling across the app.
 * 
 * @example
 * ```tsx
 * <LoadingIndicator size="large" text="Loading tours..." variant="fullscreen" />
 * ```
 */
export function LoadingIndicator({
  size = 'large',
  text,
  variant = 'inline',
  className,
  ...props
}: LoadingIndicatorProps) {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'fullscreen':
        return 'flex-1 items-center justify-center bg-white';
      case 'overlay':
        return 'absolute inset-0 items-center justify-center bg-white/80 z-10';
      default:
        return 'items-center justify-center p-8';
    }
  };

  return (
    <View 
      className={cn(getVariantStyles(), className)}
      {...props}
    >
      <ActivityIndicator 
        size={size} 
        color="#3B82F6" 
        className="mb-2"
      />
      {text && (
        <Text className="text-gray-600 text-center mt-2">
          {text}
        </Text>
      )}
    </View>
  );
} 