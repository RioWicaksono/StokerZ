import React, { useState } from 'react';
import { WarningIcon, LoadingIcon } from './icons/Icons';

interface ConfirmBulkDeleteVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  itemCount: number;
}

const ConfirmBulkDeleteVendorModal: React.FC<ConfirmBulkDeleteVendorModalProps> = ({ isOpen, onClose, onConfirm, itemCount }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch(error) {
      // Parent handles closing and toast
      if (document.getElementById('bulk-delete-vendor-modal-title')) {
         setIsDeleting(false);
      }
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-vendor-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <WarningIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 id="bulk-delete-vendor-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Delete Multiple Vendors</h2>
            <div className="mt-2 text-sm text-gray-600 space-y-2">
                <p>
                    You are about to permanently delete:
                </p>
                <p className="text-2xl font-bold text-red-600 bg-red-50 py-2 rounded-lg">
                    {itemCount} {itemCount === 1 ? 'vendor' : 'vendors'}
                </p>
                <p>
                    This action cannot be undone.
                </p>
            </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full flex justify-center items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400"
          >
            {isDeleting ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmBulkDeleteVendorModal;