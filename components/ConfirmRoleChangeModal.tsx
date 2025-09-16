import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { WarningIcon, LoadingIcon } from './icons/Icons';

interface ConfirmRoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  user: User;
  newRole: UserRole;
}

const ConfirmRoleChangeModal: React.FC<ConfirmRoleChangeModalProps> = ({ isOpen, onClose, onConfirm, user, newRole }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Role change failed:", error);
      // Parent handles toast and closing, but we reset state in case it doesn't close.
      if (document.getElementById('role-change-modal-title')) {
         setIsConfirming(false);
      }
    }
  };

  const isDemotion = (user.role === 'Super Admin' || user.role === 'Manager') && newRole !== user.role;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-change-modal-title"
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${isDemotion ? 'bg-red-100' : 'bg-amber-100'}`}>
            <WarningIcon className={`h-6 w-6 ${isDemotion ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <h2 id="role-change-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Confirm Role Change</h2>
          <p className="mt-2 text-sm text-gray-600">
            Are you sure you want to change <span className="font-bold capitalize">{user.username}</span>'s role from <span className="font-bold">{user.role}</span> to <span className="font-bold">{newRole}</span>?
          </p>
          {isDemotion && (
            <p className="mt-2 text-sm font-bold text-red-700 bg-red-50 p-3 rounded-lg">
              This user will lose significant administrative privileges.
            </p>
          )}
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
            className={`w-full flex justify-center items-center px-4 py-2 text-white font-semibold rounded-lg transition-colors ${
              isDemotion
                ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                : 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400'
            }`}
          >
            {isConfirming ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Confirm Change'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRoleChangeModal;
