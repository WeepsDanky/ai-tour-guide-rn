import React from 'react';
import { View, ViewProps } from 'react-native';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Card variants for different visual styles
 */
export type CardVariant = 'default' | 'elevated' | 'outlined';

/**
 * Props for the Card component
 */
export interface CardProps extends ViewProps {
  /** Content to display inside the card */
  children: React.ReactNode;
  /** Visual variant of the card */
  variant?: CardVariant;
}

/**
 * A flexible card container component for grouping related content.
 * 
 * @example
 * ```tsx
 * <Card variant="elevated">
 *   <CardHeader>
 *     <Text>Card Title</Text>
 *   </CardHeader>
 *   <CardContent>
 *     <Text>Card content goes here</Text>
 *   </CardContent>
 * </Card>
 * ```
 */
export function Card({ children, variant = 'default', className, ...props }: CardProps) {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'elevated':
        return 'bg-white shadow-lg border border-gray-100';
      case 'outlined':
        return 'bg-white border-2 border-gray-200';
      default:
        return 'bg-white shadow-sm border border-gray-200';
    }
  };

  return (
    <View 
      className={cn('rounded-lg overflow-hidden', getVariantStyles(), className)}
      {...props}
    >
      {children}
    </View>
  );
}

/**
 * Props for Card sub-components
 */
export interface CardSectionProps extends ViewProps {
  /** Content to display */
  children: React.ReactNode;
}

/**
 * Card header section with bottom border styling.
 */
export function CardHeader({ children, className, ...props }: CardSectionProps) {
  return (
    <View className={cn('p-4 border-b border-gray-100', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * Card main content section with padding.
 */
export function CardContent({ children, className, ...props }: CardSectionProps) {
  return (
    <View className={cn('p-4', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * Card footer section with top border styling.
 */
export function CardFooter({ children, className, ...props }: CardSectionProps) {
  return (
    <View className={cn('p-4 border-t border-gray-100', className)} {...props}>
      {children}
    </View>
  );
} 