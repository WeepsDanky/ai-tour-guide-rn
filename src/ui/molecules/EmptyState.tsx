import React from 'react';
import { View, Text, ViewProps } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Button } from '../atoms';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Props for the EmptyState component
 */
export interface EmptyStateProps extends ViewProps {
  /** FontAwesome icon name to display */
  icon?: keyof typeof FontAwesome.glyphMap;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button text */
  actionText?: string;
  /** Callback when action button is pressed */
  onAction?: () => void;
}

/**
 * An empty state component for displaying when there's no content to show.
 * Provides a consistent way to show empty states with optional actions.
 * 
 * @example
 * ```tsx
 * <EmptyState
 *   icon="compass"
 *   title="No Tours Available"
 *   description="It looks like there are no tours available right now."
 *   actionText="Create Your First Tour"
 *   onAction={() => navigate('/create')}
 * />
 * ```
 */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionText,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <View 
      className={cn('flex-1 items-center justify-center p-8', className)}
      {...props}
    >
      <View className="items-center space-y-4 max-w-sm">
        {/* Icon */}
        <View className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center">
          <FontAwesome name={icon} size={24} color="#9CA3AF" />
        </View>
        
        {/* Text Content */}
        <View className="items-center space-y-2">
          <Text className="text-lg font-semibold text-gray-900 text-center">
            {title}
          </Text>
          {description && (
            <Text className="text-gray-500 text-center leading-relaxed">
              {description}
            </Text>
          )}
        </View>
        
        {/* Action Button */}
        {actionText && onAction && (
          <View className="mt-4">
            <Button 
              title={actionText} 
              onPress={onAction}
              className="px-6"
            />
          </View>
        )}
      </View>
    </View>
  );
} 