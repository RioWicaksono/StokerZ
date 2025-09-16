import React, { useState } from 'react';
import { WarningIcon, LoadingIcon } from './icons/Icons';

interface ConfirmAdminActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: React.ReactNode;
  confirmButtonText: string;
  actionType: 'reset' | 'clear';
}

const ConfirmAdminActionModal: React.FC<ConfirmAdminActionModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    message, 
    confirmButtonText,
    actionType 
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;
  
  const isClearAction = actionType === 'clear';
  const iconColor = isClearAction ? 'text-red-600' : 'text-amber-600';
  const iconBgColor = isClearAction ? 'bg-red-100' : 'bg-amber-100';
  const confirmButtonColor = isClearAction 
    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' 
    : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-400';

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
        await onConfirm();
    } catch (error) {
        // Parent handles toast and closing
        // Reset state only if modal might stay open on error
        if (document.getElementById('admin-action-modal-title')) {
           setIsConfirming(false);
        }
    }
  };

  return (
    <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="admin-action-modal-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${iconBgColor}`}>
                <WarningIcon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h2 id="admin-action-modal-title" className="text-lg font-semibold text-gray-800 mt-4">{title}</h2>
            <p className="mt-2 text-sm text-gray-600">
                {message}
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className={`w-full flex justify-center items-center px-4 py-2 text-white font-semibold rounded-lg transition-colors ${confirmButtonColor} focus:outline-none focus:ring-2 focus:ring-offset-2 ${isClearAction ? 'focus:ring-red-500' : 'focus:ring-amber-500'}`}
          >
            {isConfirming ? <LoadingIcon className="w-5 h-5 animate-spin" /> : confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAdminActionModal;