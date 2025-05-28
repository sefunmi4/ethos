// src/components/ui/Modal.jsx
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import clsx from 'clsx';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = '',
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEscape);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div
        className={clsx(
          'bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 overflow-hidden',
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
        )}

        <div className="px-6 py-4 overflow-y-auto max-h-[75vh]">
          {children}
        </div>

        {footer && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 text-right">
            {footer}
          </div>
        )}
      </div>

      <button
        onClick={onClose}
        className="absolute top-0 left-0 w-full h-full cursor-default"
        aria-label="Close modal"
      />
    </div>,
    document.body
  );
};

export default Modal;
