import React, { useState, useEffect } from 'react';
import { Product, StockAdjustment, StockAdjustmentFormErrors } from '../types';
import { formatNumber } from '../utils/helpers';
import { LoadingIcon } from './icons/Icons';

interface StockAdjustmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (adjustmentData: Omit<StockAdjustment, 'id' | 'date' | 'adjustedBy'>) => Promise<void>;
  products: Product[];
}

const initialFormState = {
  productId: '',
  quantityChange: '',
  reason: '' as StockAdjustment['reason'] | '',
  notes: '',
};

const adjustmentReasons: StockAdjustment['reason'][] = ['Stocktake', 'Damaged Goods', 'Return', 'Found', 'Other'];

const StockAdjustmentFormModal: React.FC<StockAdjustmentFormModalProps> = ({ isOpen, onClose, onSave, products }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<StockAdjustmentFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (name: keyof typeof initialFormState, value: string, currentFormData: typeof initialFormState): string | undefined => {
    switch (name) {
      case 'productId':
        if (!value) return "A product must be selected.";
        break;
      case 'reason':
        if (!value) return "A reason must be selected.";
        break;
      case 'quantityChange': {
        if (!value) return "Quantity change cannot be empty.";
        const numQuantity = Number(value);
        if (isNaN(numQuantity) || !Number.isInteger(numQuantity)) return "Must be a whole number.";
        if (numQuantity === 0) return "Change cannot be zero.";
        
        const product = products.find(p => p.id === currentFormData.productId);
        if (product && (product.quantity + numQuantity < 0)) {
            return `This adjustment would result in negative stock (Current: ${product.quantity}).`;
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

    const error = validateField(fieldName, value, newFormData);
    setErrors(prev => ({ ...prev, [fieldName]: error }));

    // Re-validate quantity if product is changed
    if (fieldName === 'productId' && newFormData.quantityChange) {
        const quantityError = validateField('quantityChange', newFormData.quantityChange, newFormData);
        setErrors(prev => ({ ...prev, quantityChange: quantityError }));
    }
  };

  const validateAll = (): boolean => {
    const newErrors: StockAdjustmentFormErrors = {};
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
    if (!validateAll()) return;

    const selectedProduct = products.find(p => p.id === formData.productId);
    if (!selectedProduct) return;

    setIsSaving(true);
    try {
        await onSave({
            productId: formData.productId,
            productName: selectedProduct.name,
            quantityChange: Number(formData.quantityChange),
            reason: formData.reason as StockAdjustment['reason'],
            notes: formData.notes,
        });
    } catch (error) {
        // Parent handles toast
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-full overflow-y-auto">
        <form onSubmit={handleSubmit} noValidate>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">New Stock Adjustment</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-y-4">
            <div>
              <label htmlFor="adjProductId" className="block text-sm font-medium text-gray-700 mb-1">Product</label>
              <select name="productId" id="adjProductId" value={formData.productId} onChange={handleChange} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.productId ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="" disabled>-- Select a Product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} (Current Stock: {formatNumber(p.quantity)})</option>)}
              </select>
              {errors.productId && <p className="text-sm text-red-600 mt-1">{errors.productId}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-x-6">
                <div>
                    <label htmlFor="quantityChange" className="block text-sm font-medium text-gray-700 mb-1">Quantity Change</label>
                    <input type="number" name="quantityChange" id="quantityChange" value={formData.quantityChange} onChange={handleChange} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.quantityChange ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g., -5 or 10" />
                    {errors.quantityChange && <p className="text-sm text-red-600 mt-1">{errors.quantityChange}</p>}
                </div>
                <div>
                    <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <select name="reason" id="reason" value={formData.reason} onChange={handleChange} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.reason ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="" disabled>-- Select a Reason --</option>
                        {adjustmentReasons.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors.reason && <p className="text-sm text-red-600 mt-1">{errors.reason}</p>}
                </div>
            </div>

            <div>
              <label htmlFor="adjNotes" className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
              <textarea name="notes" id="adjNotes" value={formData.notes} onChange={handleChange} rows={3} className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500" placeholder="Provide more details if necessary..."></textarea>
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="w-40 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustmentFormModal;
