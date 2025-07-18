import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Button variants for different visual styles
 */
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

/**
 * Button sizes for consistent spacing
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Props for the Button component
 */
export interface ButtonProps extends Omit<TouchableOpacityProps, 'children'> {
  /** Button text content */
  title: string;
  /** Visual variant of the button */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * A reusable button component with consistent styling and behavior.
 * 
 * @example
 * ```tsx
 * <Button title="Click me" variant="primary" size="large" onPress={() => {}} />
 * ```
 */
export const Button = forwardRef<View, ButtonProps>(({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  className,
  ...touchableProps
}, ref) => {
  const getVariantStyles = (): string => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-100 border border-gray-300';
      case 'outline':
        return 'bg-transparent border border-blue-500';
      case 'ghost':
        return 'bg-transparent';
      default:
        return 'bg-blue-500 shadow-md';
    }
  };

  const getSizeStyles = (): string => {
    switch (size) {
      case 'small':
        return 'px-3 py-2 rounded-lg';
      case 'large':
        return 'px-6 py-4 rounded-2xl';
      default:
        return 'px-4 py-3 rounded-xl';
    }
  };

  const getTextVariantStyles = (): string => {
    switch (variant) {
      case 'secondary':
        return 'text-gray-700';
      case 'outline':
        return 'text-blue-500';
      case 'ghost':
        return 'text-blue-500';
      default:
        return 'text-white';
    }
  };

  const getTextSizeStyles = (): string => {
    switch (size) {
      case 'small':
        return 'text-sm font-medium';
      case 'large':
        return 'text-lg font-semibold';
      default:
        return 'text-base font-medium';
    }
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      ref={ref}
      disabled={isDisabled}
      {...touchableProps}
      className={cn(
        'items-center justify-center',
        getVariantStyles(),
        getSizeStyles(),
        isDisabled && 'opacity-50',
        className
      )}
    >
      <Text className={cn(
        'text-center',
        getTextVariantStyles(),
        getTextSizeStyles()
      )}>
        {loading ? 'Loading...' : title}
      </Text>
    </TouchableOpacity>
  );
});

Button.displayName = 'Button'; 