import React from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  Pressable,
  ModalProps as RNModalProps,
  ViewProps,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

// Simple utility function to combine class names
const cn = (...classes: (string | undefined | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};

/**
 * Modal size variants
 */
export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen';

/**
 * Props for the Modal component
 */
export interface ModalProps extends Omit<RNModalProps, 'children'> {
  /** Whether the modal is visible */
  isVisible: boolean;
  /** Callback when modal should be closed */
  onClose: () => void;
  /** Optional modal title */
  title?: string;
  /** Size variant of the modal */
  size?: ModalSize;
  /** Modal content */
  children: React.ReactNode;
  /** Whether to show the close button */
  showCloseButton?: boolean;
}

/**
 * A flexible modal component with consistent styling and behavior.
 * 
 * @example
 * ```tsx
 * <Modal
 *   isVisible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Settings"
 *   size="medium"
 * >
 *   <ModalContent>
 *     <Text>Modal content here</Text>
 *   </ModalContent>
 * </Modal>
 * ```
 */
export function Modal({
  isVisible,
  onClose,
  title,
  size = 'medium',
  children,
  showCloseButton = true,
  ...modalProps
}: ModalProps) {
  const getSizeStyles = (): string => {
    switch (size) {
      case 'small':
        return 'max-w-sm mx-4';
      case 'large':
        return 'max-w-2xl mx-4';
      case 'fullscreen':
        return 'flex-1 m-0';
      default:
        return 'max-w-lg mx-4';
    }
  };

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      statusBarTranslucent
      {...modalProps}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <Pressable 
          className="absolute inset-0" 
          onPress={onClose}
        />
        
        <View className={cn('bg-white rounded-xl overflow-hidden', getSizeStyles())}>
          {(title || showCloseButton) && (
            <ModalHeader title={title} onClose={showCloseButton ? onClose : undefined} />
          )}
          
          <View className="flex-1">
            {children}
          </View>
        </View>
      </View>
    </RNModal>
  );
}

/**
 * Props for ModalHeader component
 */
interface ModalHeaderProps {
  /** Optional header title */
  title?: string;
  /** Optional close callback */
  onClose?: () => void;
}

/**
 * Modal header with title and optional close button.
 */
export function ModalHeader({ title, onClose }: ModalHeaderProps) {
  return (
    <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
      <Text className="text-lg font-semibold text-gray-900 flex-1">
        {title || ''}
      </Text>
      {onClose && (
        <Pressable 
          onPress={onClose}
          className="w-8 h-8 items-center justify-center rounded-full bg-gray-100"
        >
          <FontAwesome name="times" size={16} color="#6B7280" />
        </Pressable>
      )}
    </View>
  );
}

/**
 * Props for Modal section components
 */
export interface ModalSectionProps extends ViewProps {
  /** Content to display */
  children: React.ReactNode;
}

/**
 * Modal content section with padding.
 */
export function ModalContent({ children, className, ...props }: ModalSectionProps) {
  return (
    <View className={cn('p-4', className)} {...props}>
      {children}
    </View>
  );
}

/**
 * Modal footer section with top border styling.
 */
export function ModalFooter({ children, className, ...props }: ModalSectionProps) {
  return (
    <View className={cn('p-4 border-t border-gray-200', className)} {...props}>
      {children}
    </View>
  );
} 