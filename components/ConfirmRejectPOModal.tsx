import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { XCircleIcon, LoadingIcon } from './icons/Icons';

interface ConfirmRejectPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  purchaseOrder: PurchaseOrder;
}

const ConfirmRejectPOModal: React.FC<ConfirmRejectPOModalProps> = ({ isOpen, onClose, onConfirm, purchaseOrder }) => {
  const [isRejecting, setIsRejecting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsRejecting(true);
    try {
      await onConfirm();
    } catch(error) {
      // Parent will handle error and closing
       if (document.getElementById('reject-po-modal-title')) {
           setIsRejecting(false);
       }
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="reject-po-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 id="reject-po-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Reject Purchase Order?</h2>
            <p className="mt-2 text-sm text-gray-600">
                Are you sure you want to reject the purchase order for <span className="font-bold">"{purchaseOrder.productName}"</span>? This action cannot be undone.
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isRejecting} className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={isRejecting} className="w-full flex justify-center items-center px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:bg-red-400">
            {isRejecting ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRejectPOModal;