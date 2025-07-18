/**
 * UI Atoms - Basic, reusable UI primitives
 * 
 * These are the smallest building blocks of the UI system.
 * They should have no dependencies on business logic or data.
 */

export { Button } from './Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './Button';

export { Container } from './Container';

export { Icon } from './Icon';
export type { IconProps, IconSize } from './Icon';

export { LoadingIndicator } from './LoadingIndicator';
export type { LoadingIndicatorProps, LoadingVariant, LoadingSize } from './LoadingIndicator';

export { ProgressIndicator } from './ProgressIndicator';
export type { ProgressIndicatorProps, ProgressVariant, ProgressSize } from './ProgressIndicator';

export { ShutterButton } from './ShutterButton';
export type { ShutterButtonProps } from './ShutterButton';

export { CameraControlButton, FlipButton, ChooseFromLibraryButton } from './CameraControlButton';
export type { CameraControlButtonProps, FlipButtonProps, ChooseFromLibraryButtonProps } from './CameraControlButton';

export { TextArea } from './TextArea';
export type { TextAreaProps } from './TextArea'; 