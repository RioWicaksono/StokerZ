import React, { useState } from 'react';
import { LogoutIcon, LoadingIcon } from './icons/Icons';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
        onConfirm();
    }, 500);
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="logout-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-amber-100">
                <LogoutIcon className="h-6 w-6 text-amber-600" />
            </div>
            <h2 id="logout-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Confirm Logout</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to log out of your account?
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="w-full flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400"
          >
            {isLoggingOut ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLogoutModal;
