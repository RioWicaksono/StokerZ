import React, { useState, useMemo, useEffect } from 'react';
import { Product, Request, RequestFormErrors, RequestPriority } from '../types';
import { DIVISIONS, PRIORITIES } from '../constants';
import { formatNumber } from '../utils/helpers';
import { LoadingIcon } from './icons/Icons';

interface RequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (requestData: Omit<Request, 'id' | 'status'>) => Promise<void>;
  products: Product[];
}

const initialFormState = {
  requestingDivision: '',
  productId: '',
  quantity: '',
  priority: 'Medium' as RequestPriority,
  notes: '',
};

const RequestFormModal: React.FC<RequestFormModalProps> = ({ isOpen, onClose, onSave, products }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const availableProducts = useMemo(() => products.filter(p => p.quantity > 0), [products]);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isOpen]);
  
  const validateField = (name: keyof typeof initialFormState, value: string, currentFormData: typeof initialFormState): string | undefined => {
    const currentSelectedProduct = products.find(p => p.id === currentFormData.productId);
    switch(name) {
        case 'requestingDivision':
            if (!value) return "Requesting division must be selected.";
            break;
        case 'priority':
            if (!value) return "Priority must be selected.";
            break;
        case 'productId':
            if (!value) return "Product must be selected.";
            if (products.find(p => p.id === value)?.quantity === 0) return "The selected product is out of stock.";
            break;
        case 'quantity': {
            if (!value) return "Quantity cannot be empty.";
            const numQuantity = Number(value);
            if (isNaN(numQuantity) || !Number.isInteger(numQuantity) || numQuantity <= 0) return "Quantity must be a positive whole number.";
            if (currentSelectedProduct && numQuantity > currentSelectedProduct.quantity) {
                return `Quantity exceeds available stock (${formatNumber(currentSelectedProduct.quantity)}).`;
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

    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);
    
    const newErrors = { ...errors };

    const error = validateField(fieldName, value, newFormData);
    newErrors[fieldName] = error;
    
    // If the product was changed, re-validate the quantity
    if (fieldName === 'productId' && newFormData.quantity) {
        const quantityError = validateField('quantity', newFormData.quantity, newFormData);
        newErrors.quantity = quantityError;
    }

    setErrors(newErrors);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    const error = validateField(fieldName, value, formData);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: RequestFormErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
        const fieldName = key as keyof typeof initialFormState;
        const value = formData[fieldName];
        const error = validateField(fieldName, value, formData);
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
    
    setIsSaving(true);
    const selectedProduct = products.find(p => p.id === formData.productId)!;
    try {
        await onSave({ 
            requestingDivision: formData.requestingDivision,
            productId: formData.productId,
            productName: selectedProduct.name,
            quantity: Number(formData.quantity),
            priority: formData.priority,
            requestDate: new Date().toISOString(),
            notes: formData.notes,
        });
    } catch(error) {
        // Parent handles error, modal stays open
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
            <h2 className="text-xl font-bold text-slate-800">Create Item Request</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <label htmlFor="requestingDivision" className="block text-sm font-medium text-slate-700 mb-1">Requesting Division</label>
              <select name="requestingDivision" id="requestingDivision" value={formData.requestingDivision} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.requestingDivision ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="" disabled>-- Select Division --</option>
                {DIVISIONS.map(div => <option key={div} value={div}>{div}</option>)}
              </select>
              {errors.requestingDivision && <p className="text-sm text-red-600 mt-1">{errors.requestingDivision}</p>}
            </div>
             <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
              <select name="priority" id="priority" value={formData.priority} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.priority ? 'border-red-500' : 'border-slate-300'}`}>
                 {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.priority && <p className="text-sm text-red-600 mt-1">{errors.priority}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="productId" className="block text-sm font-medium text-slate-700 mb-1">Product</label>
              <select name="productId" id="productId" value={formData.productId} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.productId ? 'border-red-500' : 'border-slate-300'}`}>
                <option value="" disabled>-- Select Product --</option>
                {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {formatNumber(p.quantity)})</option>
                ))}
              </select>
              {errors.productId && <p className="text-sm text-red-600 mt-1">{errors.productId}</p>}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity Requested</label>
              <input type="number" name="quantity" id="quantity" value={formData.quantity} onChange={handleChange} onBlur={handleBlur} min="1" required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.quantity && <p className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
              <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} onBlur={handleBlur} rows={3} className="w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500" placeholder="Example: For new employee orientation needs..."></textarea>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="w-40 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestFormModal;