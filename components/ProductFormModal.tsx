import React, { useState, useEffect, useMemo } from 'react';
import { Product, FormErrors, Vendor } from '../types';
import { formatNumber } from '../utils/helpers';
import { CubeIcon, LoadingIcon } from './icons/Icons';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id'> & { id?: string; lastUpdated: string; }) => Promise<void>;
  product?: Product;
  allProducts: Product[];
  vendors: Vendor[];
}

const initialFormState = {
  name: '',
  sku: '',
  category: '',
  quantity: '',
  price: '',
  location: '',
  supplierId: '',
  imageUrl: '',
  expiryDate: '',
};

const ProductFormModal: React.FC<ProductFormModalProps> = ({ isOpen, onClose, onSave, product, allProducts, vendors }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  const existingCategories = useMemo(() => {
    return [...new Set(allProducts.map(p => p.category))];
  }, [allProducts]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        category: product.category,
        quantity: String(product.quantity),
        price: String(product.price),
        location: product.location,
        supplierId: product.supplierId,
        imageUrl: product.imageUrl || '',
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({}); // Clear errors when modal opens or product changes
  }, [product, isOpen]);
  
  const validateField = (name: keyof typeof initialFormState, value: string): string | undefined => {
    switch (name) {
        case 'name':
            if (!value.trim()) return "Product name cannot be empty.";
            break;
        case 'sku':
            if (!value.trim()) return "SKU cannot be empty.";
            if (allProducts.some(p => p.sku.toLowerCase() === value.toLowerCase() && p.id !== product?.id)) {
                return "SKU is already used by another product.";
            }
            break;
        case 'category':
            if (!value.trim()) return "Category cannot be empty.";
            break;
        case 'quantity': {
            const rawValue = value.replace(/\D/g, '');
            if (rawValue.trim() === '') return "Quantity cannot be empty.";
            const numQuantity = Number(rawValue);
            if (isNaN(numQuantity) || !Number.isInteger(numQuantity)) return "Quantity must be a whole number.";
            if (numQuantity < 0) return "Stock quantity cannot be negative.";
            break;
        }
        case 'price': {
            const rawValue = value.replace(/\D/g, '');
            if (rawValue.trim() === '') return "Price cannot be empty.";
            const numPrice = Number(rawValue);
            if (isNaN(numPrice)) return "Price must be a number.";
            if (numPrice < 0) return "Price cannot be negative.";
            break;
        }
        case 'location':
            if (!value.trim()) return "Shelf location cannot be empty.";
            break;
        case 'supplierId':
            if (!value) return "Supplier must be selected.";
            break;
        default:
            return undefined;
    }
    return undefined;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateAndSetField = (name: keyof typeof initialFormState, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    let processedValue = value;

    if (fieldName === 'quantity' || fieldName === 'price') {
      processedValue = value.replace(/\D/g, '');
    }
    
    validateAndSetField(fieldName, processedValue);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    const error = validateField(fieldName, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;
    Object.keys(formData).forEach(key => {
        const fieldName = key as keyof typeof initialFormState;
        const value = formData[fieldName];
        const error = validateField(fieldName, String(value));
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
    try {
        await onSave({ 
            ...formData, 
            quantity: Number(formData.quantity),
            price: Number(formData.price),
            expiryDate: formData.expiryDate ? new Date(formData.expiryDate).toISOString() : undefined,
            id: product?.id, 
            lastUpdated: new Date().toISOString() 
        });
    } catch (error) {
        // Error is handled by parent, modal remains open for correction
    } finally {
        setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-200 flex-shrink-0">
            <h2 className="text-xl font-bold text-slate-800">{product ? 'Edit Product' : 'Add New Product'}</h2>
          </div>
          <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            {/* Left Column for Image */}
            <div className="md:col-span-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Product Image</label>
                <div className="mt-1 aspect-square border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center text-center p-2 relative">
                    {formData.imageUrl ? (
                        <img src={formData.imageUrl} alt="Product" className="object-contain max-h-full max-w-full rounded-md" />
                    ) : (
                        <div className="text-slate-400">
                           <CubeIcon className="mx-auto h-12 w-12" />
                            <p className="text-xs mt-1">Upload an image</p>
                        </div>
                    )}
                     <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        aria-label="Upload product image"
                    />
                </div>
            </div>
            
            {/* Right Column for Form Fields */}
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                />
                {errors.name && <p id="name-error" className="text-sm text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                <label htmlFor="sku" className="block text-sm font-medium text-slate-700 mb-1">SKU (Barcode)</label>
                <input type="text" name="sku" id="sku" value={formData.sku} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.sku ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.sku}
                    aria-describedby={errors.sku ? 'sku-error' : undefined}
                />
                {errors.sku && <p id="sku-error" className="text-sm text-red-600 mt-1">{errors.sku}</p>}
                </div>
                <div>
                <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} onBlur={handleBlur} required list="category-suggestions" className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.category ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.category}
                    aria-describedby={errors.category ? 'category-error' : undefined}
                />
                <datalist id="category-suggestions">
                    {existingCategories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                {errors.category && <p id="category-error" className="text-sm text-red-600 mt-1">{errors.category}</p>}
                </div>
                <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                <input
                    type="text"
                    inputMode="numeric"
                    name="quantity"
                    id="quantity"
                    value={formData.quantity ? formatNumber(Number(formData.quantity)) : ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.quantity ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.quantity}
                    aria-describedby={errors.quantity ? 'quantity-error' : undefined}
                />
                {errors.quantity && <p id="quantity-error" className="text-sm text-red-600 mt-1">{errors.quantity}</p>}
                </div>
                <div>
                <label htmlFor="price" className="block text-sm font-medium text-slate-700 mb-1">Price (IDR)</label>
                <input
                    type="text"
                    inputMode="numeric"
                    name="price"
                    id="price"
                    value={formData.price ? formatNumber(Number(formData.price)) : ''}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.price ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.price}
                    aria-describedby={errors.price ? 'price-error' : undefined}
                />
                {errors.price && <p id="price-error" className="text-sm text-red-600 mt-1">{errors.price}</p>}
                </div>
                <div className="sm:col-span-2">
                <label htmlFor="location" className="block text-sm font-medium text-slate-700 mb-1">Shelf Location</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.location ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.location}
                    aria-describedby={errors.location ? 'location-error' : undefined}
                />
                {errors.location && <p id="location-error" className="text-sm text-red-600 mt-1">{errors.location}</p>}
                </div>
                <div>
                <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700 mb-1">Supplier</label>
                <select name="supplierId" id="supplierId" value={formData.supplierId} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.supplierId ? 'border-red-500' : 'border-slate-300'}`}
                    aria-invalid={!!errors.supplierId}
                    aria-describedby={errors.supplierId ? 'supplierId-error' : undefined}
                >
                    <option value="" disabled>-- Select Supplier --</option>
                    {vendors.map(vendor => <option key={vendor.id} value={vendor.id}>{vendor.name}</option>)}
                </select>
                {errors.supplierId && <p id="supplierId-error" className="text-sm text-red-600 mt-1">{errors.supplierId}</p>}
                </div>
                 <div>
                    <label htmlFor="expiryDate" className="block text-sm font-medium text-slate-700 mb-1">Expiry Date (Optional)</label>
                    <input type="date" name="expiryDate" id="expiryDate" value={formData.expiryDate} onChange={handleChange}
                        className="w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                    />
                </div>
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl flex-shrink-0">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="w-36 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin"/> : (product ? 'Save Changes' : 'Save Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductFormModal;