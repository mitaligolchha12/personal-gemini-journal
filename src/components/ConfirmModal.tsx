import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs"
        />

        {/* Modal dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative bg-white rounded-2xl shadow-2xl border border-stone-200 p-6 max-w-md w-full z-10"
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl shrink-0 ${isDanger ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-stone-900 font-serif">{title}</h3>
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">{message}</p>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-xs transition-colors ${
                    isDanger
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-stone-900 hover:bg-stone-800'
                  }`}
                >
                  {confirmText}
                </button>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
