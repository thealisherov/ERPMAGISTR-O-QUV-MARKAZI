import { useEffect, useRef } from 'react';
import { FiAlertTriangle, FiX } from 'react-icons/fi';

/**
 * ConfirmDialog - React-based confirmation dialog
 * window.confirm o'rniga ishlatiladi
 * 
 * Props:
 * - isOpen: boolean
 * - title: string
 * - message: string
 * - confirmText: string (default: "Ha, davom etish")
 * - cancelText: string (default: "Bekor qilish")
 * - variant: 'danger' | 'warning' | 'info' (default: 'danger')
 * - onConfirm: () => void
 * - onCancel: () => void
 * - loading: boolean (optional)
 */
const ConfirmDialog = ({
  isOpen,
  title = "Tasdiqlash",
  message = "Haqiqatan ham davom etmoqchimisiz?",
  confirmText = "Ha, davom etish",
  cancelText = "Bekor qilish",
  variant = 'danger',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Focus on cancel to prevent accidental confirm
      setTimeout(() => confirmBtnRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: 'bg-red-100 text-red-600',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      icon: 'bg-orange-100 text-orange-600',
      button: 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500',
    },
    info: {
      icon: 'bg-blue-100 text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in-down"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FiX className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${styles.icon}`}>
            <FiAlertTriangle className="h-7 w-7" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Jarayonda...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
