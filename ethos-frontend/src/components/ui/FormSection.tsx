import React from 'react';
import clsx from 'clsx';

/**
 * Props for the FormSection component.
 */
export interface FormSectionProps {
  /**
   * Title of the section displayed as a heading.
   */
  title: string;

  /**
   * Optional class name for the outer wrapper.
   */
  className?: string;

  /**
   * Section content, typically form fields.
   */
  children: React.ReactNode;
}

/**
 * FormSection – A reusable container for grouping related form inputs.
 *
 * 💡 Design Considerations:
 * - Should be used to organize form areas (e.g., "Board Details", "Access Settings")
 * - Enhances readability and accessibility by providing consistent spacing and section headers
 * - Can be styled independently via `className` prop if needed
 */
const FormSection: React.FC<FormSectionProps> = ({ title, className, children }) => {
  return (
    <section className={clsx('mb-6', className)}>
      {/* Section Header */}
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">{title}</h2>

      {/* Section Body */}
      <div className="space-y-4">{children}</div>
    </section>
  );
};

export default FormSection;