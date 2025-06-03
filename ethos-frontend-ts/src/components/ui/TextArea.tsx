import React from 'react';
import clsx from 'clsx';

// Define props for the TextArea component
export interface TextAreaProps {
  id?: string; // Optional ID for accessibility and form association
  name?: string; // Optional name for form submission
  value: string; // Current value of the textarea
  placeholder?: string; // Placeholder text
  rows?: number; // Number of rows (height)
  className?: string; // Additional custom class names
  disabled?: boolean; // Disable input
  required?: boolean; // Make field required
  readOnly?: boolean; // Prevent editing
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; // Change handler
}

/**
 * TextArea - A reusable, accessible, styled <textarea> element for user input.
 * Commonly used in forms such as post creation, quest logs, and descriptions.
 *
 * Design Consideration:
 * - Extendable with validation styles (error, success)
 * - Accessible by default via `id` and `aria-*` props
 * - Supports native HTML features: disabled, required, readOnly
 */
const TextArea: React.FC<TextAreaProps> = ({
  id,
  name,
  value,
  placeholder = '',
  rows = 4,
  className,
  disabled = false,
  required = false,
  readOnly = false,
  onChange,
}) => {
  return (
    <textarea
      id={id}
      name={name}
      value={value}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      required={required}
      readOnly={readOnly}
      onChange={onChange}
      className={clsx(
        'w-full p-3 rounded-md border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y text-sm text-gray-900',
        {
          'bg-gray-100 cursor-not-allowed': disabled || readOnly,
        },
        className
      )}
    />
  );
};

export default TextArea;