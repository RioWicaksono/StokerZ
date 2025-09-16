import React from 'react';
import { XMarkIcon } from './icons/Icons';

interface StartTourModalProps {
  isOpen: boolean;
  onStart: () => void;
  onSkip: () => void;
}

const StartTourModal: React.FC<StartTourModalProps> = ({ isOpen, onStart, onSkip }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[999] flex justify-center items-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 text-center animate-pop-in relative">
        <button onClick={onSkip} className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Skip tour">
            <XMarkIcon className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Welcome to StockerZ!</h2>
        <p className="mt-2 text-slate-600">
          Would you like a quick tour of the main features?
        </p>
        <div className="mt-6 flex justify-center">
          <button onClick={onStart} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700">
            Start Tour
          </button>
        </div>
      </div>
       <style>{`
        @keyframes pop-in {
            0% {
                opacity: 0;
                transform: scale(0.9);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        .animate-pop-in {
            animation: pop-in 0.3s ease-out forwards;
        }
    `}</style>
    </div>
  );
};

export default StartTourModal;