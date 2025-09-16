import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from './icons/Icons';

declare global {
    interface Window {
        Html5QrcodeScanner: any;
    }
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string, decodedResult: any) => void;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      if (!scannerRef.current) {
        const html5QrcodeScanner = new window.Html5QrcodeScanner(
          "reader",
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            rememberLastUsedCamera: true,
          },
          false // verbose
        );
        scannerRef.current = html5QrcodeScanner;
      }
      
      scannerRef.current.render(onScanSuccess, (error: string) => {
        // console.warn(`Code scan error = ${error}`);
      });
    }

    return () => {
      if (scannerRef.current && scannerRef.current.getState() !== 1 /* NOT_STARTED */) {
         scannerRef.current.clear().catch((error: any) => {
            console.error("Failed to clear html5-qrcode-scanner.", error);
         });
      }
    };
  }, [isOpen, onScanSuccess]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-80 z-[100] flex flex-col justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-4 relative">
        <h2 className="text-lg font-bold text-slate-800 text-center mb-2">Scan Barcode</h2>
        <div id="reader" className="w-full"></div>
         <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-white/50 rounded-full text-slate-700 hover:bg-white transition-colors"
            aria-label="Close scanner"
        >
            <XMarkIcon className="w-6 h-6" />
        </button>
      </div>
      <p className="mt-4 text-white/80 text-center">Point your camera at a product barcode or QR code.</p>
    </div>
  );
};

export default BarcodeScannerModal;
