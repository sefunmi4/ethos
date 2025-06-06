import React from 'react';
import clsx from 'clsx';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertBoxProps {
  type: AlertType;
  message?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * ✅ AlertBox Component
 * Displays a contextual alert message with appropriate styling.
 *
 * @param {AlertBoxProps} props - Component props
 * @returns {JSX.Element} The rendered alert box
 */
const AlertBox: React.FC<AlertBoxProps> = ({
  type,
  message,
  children,
  className = '',
}) => {
  const baseStyles =
    'rounded px-4 py-3 text-sm font-medium shadow-sm border-l-4';
  const typeStyles: Record<AlertType, string> = {
    success: 'bg-green-50 text-green-800 border-green-400',
    error: 'bg-red-50 text-red-800 border-red-400',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-400',
    info: 'bg-blue-50 text-blue-800 border-blue-400',
  };

  return (
    <div className={clsx(baseStyles, typeStyles[type], className)}>
      {children || message}
    </div>
  );
};

export default AlertBox;