import React from 'react';
import { View, Text, ViewProps } from 'react-native';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Progress indicator variants
 */
export type ProgressVariant = 'linear' | 'circular';

/**
 * Progress indicator sizes
 */
export type ProgressSize = 'small' | 'medium' | 'large';

/**
 * Props for the ProgressIndicator component
 */
export interface ProgressIndicatorProps extends ViewProps {
  /** Progress value from 0-100 */
  progress: number;
  /** Optional descriptive text */
  text?: string;
  /** Whether to show percentage value */
  showPercentage?: boolean;
  /** Visual variant of the progress indicator */
  variant?: ProgressVariant;
  /** Size of the progress indicator */
  size?: ProgressSize;
}

/**
 * A progress indicator component supporting both linear and circular variants.
 * 
 * @example
 * ```tsx
 * <ProgressIndicator 
 *   progress={75} 
 *   text="Download progress" 
 *   variant="linear" 
 *   size="medium" 
 * />
 * ```
 */
export function ProgressIndicator({
  progress,
  text,
  showPercentage = true,
  variant = 'linear',
  size = 'medium',
  className,
  ...props
}: ProgressIndicatorProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  
  if (variant === 'circular') {
    return (
      <CircularProgress 
        progress={clampedProgress} 
        size={size} 
        text={text} 
        className={className} 
        {...props} 
      />
    );
  }

  const getSizeStyles = (): string => {
    switch (size) {
      case 'small':
        return 'h-1';
      case 'large':
        return 'h-3';
      default:
        return 'h-2';
    }
  };

  return (
    <View className={cn(className)} {...props}>
      {(text || showPercentage) && (
        <View className="flex-row justify-between items-center mb-2">
          {text && (
            <Text className="text-sm font-medium text-gray-700">
              {text}
            </Text>
          )}
          {showPercentage && (
            <Text className="text-sm text-gray-500">
              {Math.round(clampedProgress)}%
            </Text>
          )}
        </View>
      )}
      
      <View className={cn('bg-gray-200 rounded-full overflow-hidden', getSizeStyles())}>
        <View 
          className="bg-blue-500 rounded-full transition-all duration-300 ease-out h-full"
          style={{ width: `${clampedProgress}%` }}
        />
      </View>
    </View>
  );
}

/**
 * Props for the CircularProgress component
 */
interface CircularProgressProps extends ViewProps {
  progress: number;
  size: ProgressSize;
  text?: string;
}

/**
 * Internal circular progress component
 */
function CircularProgress({ progress, size, text, className, ...props }: CircularProgressProps) {
  const getDimensions = () => {
    switch (size) {
      case 'small':
        return { size: 40, strokeWidth: 3 };
      case 'large':
        return { size: 80, strokeWidth: 6 };
      default:
        return { size: 60, strokeWidth: 4 };
    }
  };

  const { size: diameter, strokeWidth } = getDimensions();

  return (
    <View className={cn('items-center', className)} {...props}>
      <View 
        style={{ 
          width: diameter, 
          height: diameter, 
          borderRadius: diameter / 2,
          borderWidth: strokeWidth,
          borderColor: '#E5E7EB',
          borderRightColor: '#3B82F6',
          transform: [{ rotate: `${(progress / 100) * 360}deg` }]
        }}
        className="items-center justify-center"
      >
        <View className="absolute inset-0 items-center justify-center">
          <Text className="text-sm font-semibold text-gray-700">
            {Math.round(progress)}%
          </Text>
        </View>
      </View>
      
      {text && (
        <Text className="text-sm text-gray-600 mt-2 text-center">
          {text}
        </Text>
      )}
    </View>
  );
} 