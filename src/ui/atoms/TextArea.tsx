import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

export interface TextAreaProps extends Omit<TextInputProps, 'multiline'> {
  /** Number of visible rows */
  rows?: number;
  /** Maximum number of rows before scrolling */
  maxRows?: number;
  /** Auto-grow the text area */
  autoGrow?: boolean;
}

/**
 * A multi-line text input component with consistent styling.
 * Supports auto-growing functionality and row limits.
 */
export function TextArea({ 
  rows = 3, 
  maxRows, 
  autoGrow = false,
  className,
  style,
  ...props 
}: TextAreaProps) {
  const minHeight = rows * 20 + 16; // Approximate line height + padding
  const maxHeight = maxRows ? maxRows * 20 + 16 : undefined;

  return (
    <TextInput
      {...props}
      multiline
      textAlignVertical="top"
      className={`border border-gray-300 rounded-lg px-4 py-3 text-gray-900 ${className}`}
      style={[
        {
          minHeight: autoGrow ? minHeight : undefined,
          maxHeight: autoGrow ? maxHeight : undefined,
        },
        style,
      ]}
    />
  );
} 