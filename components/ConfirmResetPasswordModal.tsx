import React, { useState } from 'react';
import { User } from '../types';
import { KeyIcon, LoadingIcon } from './icons/Icons';

interface ConfirmResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User;
}

const ConfirmResetPasswordModal: React.FC<ConfirmResetPasswordModalProps> = ({ isOpen, onClose, onConfirm, user }) => {
  const [isConfirming, setIsConfirming] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      // Parent handles closing and toast
      if (document.getElementById('reset-password-modal-title')) {
         setIsConfirming(false);
      }
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="reset-password-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-100">
                <KeyIcon className="h-6 w-6 text-sky-600" />
            </div>
            <h2 id="reset-password-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Reset User Password</h2>
            <p className="mt-2 text-sm text-gray-600">
                An email with a password reset link will be sent to <span className="font-bold">"{user.username}"</span>.
                Are you sure you want to proceed?
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isConfirming}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isConfirming}
            className="w-full flex justify-center items-center px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-sky-400"
          >
            {isConfirming ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Send Link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetPasswordModal;