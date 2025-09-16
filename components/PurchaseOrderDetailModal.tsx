import React from 'react';
import { PurchaseOrder, Vendor } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { XMarkIcon } from './icons/Icons';

interface PurchaseOrderDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: PurchaseOrder;
  vendors: Vendor[];
}

const getStatusBadge = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'Pending Approval': return 'bg-amber-100 text-amber-800';
    case 'Approved': return 'bg-green-100 text-green-800';
    case 'Rejected': return 'bg-red-100 text-red-800';
    default: return 'bg-slate-100 text-slate-800';
  }
};

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <div className="text-slate-800 font-semibold mt-1">{children}</div>
  </div>
);

const PurchaseOrderDetailModal: React.FC<PurchaseOrderDetailModalProps> = ({ isOpen, onClose, purchaseOrder, vendors }) => {
  if (!isOpen || !purchaseOrder) return null;

  const vendor = vendors.find(v => v.id === purchaseOrder.vendorId);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="po-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 id="po-detail-title" className="text-xl font-bold text-slate-800">
            Purchase Order Details
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <DetailItem label="PO ID">{purchaseOrder.id}</DetailItem>
          <DetailItem label="Vendor">{vendor?.name || 'Unknown'}</DetailItem>
          <DetailItem label="Product Name">{purchaseOrder.productName}</DetailItem>
          <DetailItem label="Quantity Ordered">{formatNumber(purchaseOrder.quantity)} units</DetailItem>
          <DetailItem label="Request Date">{formatDate(purchaseOrder.requestDate)}</DetailItem>
          <DetailItem label="Requested By">
            <span className="capitalize">{purchaseOrder.requestedBy}</span>
          </DetailItem>
          <div className="sm:col-span-2">
            <DetailItem label="Status">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(purchaseOrder.status)}`}>
                {purchaseOrder.status}
              </span>
            </DetailItem>
          </div>
          {purchaseOrder.approvedBy && purchaseOrder.actionDate && (
            <div className="sm:col-span-2">
              <DetailItem label={`${purchaseOrder.status} By`}>
                <span className="capitalize">{purchaseOrder.approvedBy}</span> on {formatDate(purchaseOrder.actionDate)}
              </DetailItem>
            </div>
          )}
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-slate-500">Notes</p>
            <p className="text-slate-800 font-semibold mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[50px]">
              {purchaseOrder.notes || <span className="italic text-slate-400">No notes provided.</span>}
            </p>
          </div>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// FIX: Added default export for the component.
export default PurchaseOrderDetailModal;
