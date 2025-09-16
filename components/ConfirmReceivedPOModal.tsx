import React, { useState } from 'react';
import { PurchaseOrder } from '../types';
import { CubeIcon, LoadingIcon } from './icons/Icons';
import { formatNumber } from '../utils/helpers';

interface ConfirmReceivedPOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  purchaseOrder: PurchaseOrder;
}

const ConfirmReceivedPOModal: React.FC<ConfirmReceivedPOModalProps> = ({ isOpen, onClose, onConfirm, purchaseOrder }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      if (document.getElementById('receive-po-modal-title')) {
        setIsConfirming(false);
      }
    }
  };

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true" aria-labelledby="receive-po-modal-title">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-sky-100">
                <CubeIcon className="h-8 w-8 text-sky-600" />
            </div>
            <h2 id="receive-po-modal-title" className="text-lg font-semibold text-gray-800 mt-4">Confirm Receipt?</h2>
            <p className="mt-2 text-sm text-gray-600">
                You are about to mark the PO for <span className="font-bold">{formatNumber(purchaseOrder.quantity)} units</span> of <span className="font-bold">"{purchaseOrder.productName}"</span> as received.
            </p>
            <p className="mt-2 text-sm text-gray-600">
                The product stock will be increased accordingly. This action cannot be undone.
            </p>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-center gap-3 rounded-b-xl">
          <button type="button" onClick={onClose} disabled={isConfirming} className="w-full px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleConfirm} disabled={isConfirming} className="w-full flex justify-center items-center px-4 py-2 bg-sky-600 text-white font-semibold rounded-lg hover:bg-sky-700 disabled:bg-sky-400">
            {isConfirming ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Yes, Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReceivedPOModal;
