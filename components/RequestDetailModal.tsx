import React from 'react';
import { Request } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { XMarkIcon } from './icons/Icons';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request?: Request;
}

const getStatusBadge = (status: Request['status']) => {
  switch (status) {
    case 'Pending Approval':
      return 'bg-amber-100 text-amber-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Collected':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getPriorityBadge = (priority: Request['priority']) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'Low':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-slate-500">{label}</p>
    <div className="text-slate-800 font-semibold mt-1">{children}</div>
  </div>
);


const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ isOpen, onClose, request }) => {
  if (!isOpen || !request) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto"
      >
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <h2 id="request-detail-title" className="text-xl font-bold text-slate-800">
            Request Details
          </h2>
           <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          <DetailItem label="Request ID">{request.id}</DetailItem>
          <DetailItem label="Requesting Division">{request.requestingDivision}</DetailItem>
          <DetailItem label="Product Name">{request.productName}</DetailItem>
          <DetailItem label="Quantity Requested">{formatNumber(request.quantity)} units</DetailItem>
          <DetailItem label="Request Date">{formatDate(request.requestDate)}</DetailItem>
          <DetailItem label="Priority">
             <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(request.priority)}`}>
              {request.priority}
            </span>
          </DetailItem>
          <div className="sm:col-span-2">
             <DetailItem label="Status">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}>
                {request.status}
              </span>
            </DetailItem>
          </div>
           {request.approvedBy && request.actionDate && (
             <div className="sm:col-span-2">
                <DetailItem label={`Action Taken By (${request.status === 'Collected' ? 'Approved' : request.status})`}>
                  <span className="capitalize">{request.approvedBy}</span> on {formatDate(request.actionDate)}
                </DetailItem>
             </div>
           )}
           {request.collectedBy && (
             <div className="sm:col-span-2">
                <DetailItem label="Collected By">
                  <span className="capitalize">{request.collectedBy}</span>
                  {request.collectionDate && ` on ${formatDate(request.collectionDate)}`}
                </DetailItem>
             </div>
           )}
          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-slate-500">Notes</p>
             <p className="text-slate-800 font-semibold mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200 min-h-[50px]">
              {request.notes || <span className="italic text-slate-400">No notes provided.</span>}
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

export default RequestDetailModal;