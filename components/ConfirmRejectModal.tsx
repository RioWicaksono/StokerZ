import React, { useState } from 'react';
import { Request } from '../types';
import { XCircleIcon, LoadingIcon } from './icons/Icons';

interface ConfirmRejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  request: Request;
}

const ConfirmRejectModal: React.FC<ConfirmRejectModalProps> = ({ isOpen, onClose, onConfirm, request }) => {
  const [isRejecting, setIsRejecting] = useState(false);
  
  if (!isOpen) return null;

  const handleConfirm = async () => {
      setIsRejecting(true);
      try {
          await onConfirm();
      } catch (error) {
          // Parent handles error toast and closing, but we reset state in case it doesn't close.
          if (document.getElementById('reject-modal-title')) {
             setIsRejecting(false);
          }
      }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 id="reject-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Reject Request?</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to reject the request for <span className="font-bold">"{request.productName}"</span> from the <span className="font-bold">{request.requestingDivision}</span> division? This action cannot be undone.
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isRejecting}
            className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isRejecting}
            className="w-full flex justify-center items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400"
          >
            {isRejecting ? <LoadingIcon className="w-5 h-5 animate-spin"/> : 'Yes, Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRejectModal;