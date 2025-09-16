import React, { useState, useMemo } from 'react';
import { Product, Vendor, PurchaseOrder, PurchaseOrderFormErrors } from '../types';
import { formatNumber } from '../utils/helpers';
import { LoadingIcon } from './icons/Icons';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (poData: Omit<PurchaseOrder, 'id' | 'status' | 'requestedBy'>) => Promise<void>;
  products: Product[];
  vendors: Vendor[];
}

const initialFormState = {
  vendorId: '',
  productId: '',
  quantity: '',
  notes: '',
};

const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({ isOpen, onClose, onSave, products, vendors }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<PurchaseOrderFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const validateField = (name: keyof typeof initialFormState, value: string): string | undefined => {
    switch (name) {
      case 'vendorId':
        if (!value) return "A vendor must be selected.";
        break;
      case 'productId':
        if (!value) return "A product must be selected.";
        break;
      case 'quantity': {
        const rawValue = value.replace(/\D/g, '');
        if (!rawValue) return "Quantity cannot be empty.";
        const numQuantity = Number(rawValue);
        if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity < 1) {
          return "Quantity must be a positive whole number.";
        }
        break;
      }
      default:
        return undefined;
    }
    return undefined;
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    let processedValue = value;

    if (fieldName === 'quantity') {
      processedValue = value.replace(/\D/g, '');
    }
    
    setFormData(prev => ({ ...prev, [fieldName]: processedValue }));
    const error = validateField(fieldName, processedValue);
    setErrors(prev => ({...prev, [fieldName]: error}));
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    const error = validateField(fieldName, value);
    setErrors(prev => ({...prev, [fieldName]: error}));
  };

  const validateAll = (): boolean => {
    const newErrors: PurchaseOrderFormErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
        const fieldName = key as keyof typeof initialFormState;
        const value = formData[fieldName];
        const error = validateField(fieldName, value);
        if (error) {
            newErrors[fieldName] = error;
            isValid = false;
        }
    });
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      return;
    }
    const selectedProduct = products.find(p => p.id === formData.productId);
    if (!selectedProduct) {
        setErrors({ productId: "Invalid product selected." });
        return;
    }

    setIsSaving(true);
    try {
        await onSave({ 
            vendorId: formData.vendorId,
            productId: formData.productId,
            productName: selectedProduct.name,
            quantity: Number(formData.quantity),
            requestDate: new Date().toISOString(),
            notes: formData.notes,
        });
        setFormData(initialFormState);
    } catch (error) {
        // Parent handles error toast
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-800">New Purchase Order</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-y-4">
            <div>
              <label htmlFor="vendorId" className="block text-sm font-medium text-slate-700 mb-1">Vendor</label>
              <select name="vendorId" id="vendorId" value={formData.vendorId} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.vendorId ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="" disabled>-- Select a Vendor --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              {errors.vendorId && <p className="text-sm text-red-600 mt-1">{errors.vendorId}</p>}
            </div>
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-slate-700 mb-1">Product</label>
              <select name="productId" id="productId" value={formData.productId} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.productId ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="" disabled>-- Select a Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current Stock: {formatNumber(p.quantity)})</option>)}
              </select>
              {errors.productId && <p className="text-sm text-red-600 mt-1">{errors.productId}</p>}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity to Order</label>
              <input type="text" inputMode="numeric" name="quantity" id="quantity" value={formData.quantity ? formatNumber(Number(formData.quantity)) : ''} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`} />
              {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500" placeholder="Add any relevant details..."></textarea>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="w-48 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Submit Purchase Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PurchaseOrderFormModal;