import React, { useState, useEffect } from 'react';
import { Vendor, VendorFormErrors } from '../types';
import { LoadingIcon } from './icons/Icons';

interface VendorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (vendorData: Omit<Vendor, 'id' | 'lastUpdated' | 'lastModifiedBy'> & { id?: string; }) => Promise<void>;
  vendor?: Vendor;
  allVendors: Vendor[];
}

const initialFormState = {
  name: '',
  category: '',
  contactPerson: '',
  email: '',
  phone: '',
};

const VendorFormModal: React.FC<VendorFormModalProps> = ({ isOpen, onClose, onSave, vendor, allVendors }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<VendorFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name,
        category: vendor.category,
        contactPerson: vendor.contactPerson,
        email: vendor.email,
        phone: vendor.phone,
      });
    } else {
      setFormData(initialFormState);
    }
    setErrors({});
  }, [vendor, isOpen]);

  const validateField = (name: keyof typeof initialFormState, value: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    switch(name) {
        case 'name':
            if (!value.trim()) return "Vendor name cannot be empty.";
            if (allVendors.some(v => v.name.toLowerCase() === value.toLowerCase() && v.id !== vendor?.id)) {
                return "Vendor name is already in use.";
            }
            break;
        case 'category':
            if (!value.trim()) return "Category cannot be empty.";
            break;
        case 'contactPerson':
            if (!value.trim()) return "Contact person cannot be empty.";
            break;
        case 'email':
            if (!value.trim()) return "Email cannot be empty.";
            if (!emailRegex.test(value)) return "Invalid email format.";
            break;
        case 'phone':
            if (!value.trim()) return "Phone number cannot be empty.";
            break;
        default:
            return undefined;
    }
    return undefined;
  };
  
  const validateAndSetField = (name: keyof typeof initialFormState, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    validateAndSetField(name as keyof typeof initialFormState, value);
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name as keyof typeof initialFormState, value);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: VendorFormErrors = {};
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
    
    setIsSaving(true);
    try {
        await onSave({ 
            ...formData, 
            id: vendor?.id, 
        });
    } catch (error) {
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
            <h2 className="text-xl font-bold text-slate-800">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Vendor Name</label>
              <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.name ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <input type="text" name="category" id="category" value={formData.category} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.category ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.category && <p className="text-sm text-red-600 mt-1">{errors.category}</p>}
            </div>
            <div>
              <label htmlFor="contactPerson" className="block text-sm font-medium text-slate-700 mb-1">Contact Person</label>
              <input type="text" name="contactPerson" id="contactPerson" value={formData.contactPerson} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.contactPerson ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.contactPerson && <p className="text-sm text-red-600 mt-1">{errors.contactPerson}</p>}
            </div>
             <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.email ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
             <div className="md:col-span-2">
              <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
              <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500 ${errors.phone ? 'border-red-500' : 'border-slate-300'}`}/>
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="w-36 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin" /> : (vendor ? 'Save Changes' : 'Save Vendor')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorFormModal;