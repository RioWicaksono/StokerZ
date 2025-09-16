import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons/Icons';

interface ToastProps {
  toast: ToastMessage;
}

const Toast: React.FC<ToastProps> = ({ toast }) => {
  const isSuccess = toast.type === 'success';
  const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

  return (
    <div className={`flex items-start p-4 rounded-lg shadow-lg bg-white border-l-4 ${isSuccess ? 'border-green-500' : 'border-red-500'} animate-fade-in-right`}>
      <div className={`flex-shrink-0 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="ml-3 w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-slate-900">{isSuccess ? 'Success' : 'Error'}</p>
        <p className="mt-1 text-sm text-slate-600">{toast.message}</p>
      </div>
    </div>
  );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
    return (
        <div className="fixed top-5 right-5 z-[100] w-full max-w-sm space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} />
            ))}
             <style>{`
                @keyframes fade-in-right {
                    from {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-fade-in-right {
                    animation: fade-in-right 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};


export default ToastContainer;