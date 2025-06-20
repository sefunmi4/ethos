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
    success: 'bg-success text-success border-success',
    error: 'bg-error text-error border-error',
    warning: 'bg-warning text-warning border-warning',
    info: 'bg-accent/10 text-accent border-accent',
  };

  return (
    <div className={clsx(baseStyles, typeStyles[type], className)}>
      {children || message}
    </div>
  );
};

export default AlertBox;