import React from 'react';
import clsx from 'clsx';
import type { option } from '../../constants/options';


/**
 * Props for the reusable Select dropdown component.
 */
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional ID for accessibility and label targeting */
  id?: string;
  /** Controlled selected value */
  value: string;
  /** Callback when value changes */
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Options to display in dropdown */
  options: option[];
  /** Optional className override */
  className?: string;
}

/**
 * ✅ Select Component
 * Reusable dropdown selector with consistent styling.
 *
 * - Accepts array of `{ value, label }` options
 * - Supports external className overrides
 * - Accessible and keyboard-friendly
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ id, value, onChange, options, className = '', ...props }, ref) => {
    return (
      <select
        id={id}
        ref={ref}
        value={value}
        onChange={onChange}
        className={clsx(
          'w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm',
          'focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }
);

Select.displayName = 'Select';
export default Select;