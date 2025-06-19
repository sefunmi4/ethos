import React from 'react';
import clsx from 'clsx';

/**
 * Props for the Label component.
 */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  /**
   * Optional ID of the element this label is for (used for accessibility).
   */
  htmlFor?: string;

  /**
   * Custom class name(s) for styling overrides.
   */
  className?: string;

  /**
   * Optional label text (can also pass children).
   */
  children: React.ReactNode;
}

/**
 * Label - A reusable, accessible label component for form fields.
 *
 * ✨ Design Considerations:
 * - Tied to input via `htmlFor` to improve accessibility (screen readers, keyboard nav)
 * - Can be customized with `className` to support theme overrides
 * - Always place directly above or beside input fields
 * - Keep labels short, descriptive, and action-oriented (e.g., “Title”, “Visibility”)
 */
const Label: React.FC<LabelProps> = ({ htmlFor, className, children, ...props }) => {
  return (
    <label
      htmlFor={htmlFor}
        className={clsx(
          'block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1',
          className
        )}
      {...props}
    >
      {children}
    </label>
  );
};

export default Label;