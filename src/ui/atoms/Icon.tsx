import React from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { StyleProp, TextStyle } from 'react-native';

/**
 * Icon sizes for consistent sizing
 */
export type IconSize = 'small' | 'medium' | 'large' | 'xlarge';

/**
 * Props for the Icon component
 */
export interface IconProps {
  /** FontAwesome icon name */
  name: React.ComponentProps<typeof FontAwesome>['name'];
  /** Icon color */
  color?: string;
  /** Icon size variant or custom size number */
  size?: IconSize | number;
  /** Additional styles */
  style?: StyleProp<TextStyle>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * A reusable icon component using FontAwesome icons with consistent sizing.
 * 
 * @example
 * ```tsx
 * <Icon name="home" size="large" color="#3B82F6" />
 * <Icon name="user" size={24} color="#6B7280" />
 * ```
 */
export function Icon({ 
  name, 
  color = '#6B7280', 
  size = 'medium',
  style,
  className 
}: IconProps) {
  const getIconSize = (): number => {
    if (typeof size === 'number') return size;
    
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 28;
      case 'xlarge':
        return 32;
      default:
        return 20;
    }
  };

  return (
    <FontAwesome
      name={name}
      size={getIconSize()}
      color={color}
      style={style}
      className={className}
    />
  );
} 