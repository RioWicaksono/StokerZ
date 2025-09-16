import React, { useState, useEffect } from 'react';
import { User, UserRole, AddUserFormErrors } from '../types';
import { LoadingIcon } from './icons/Icons';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Update onSave prop type to accept password
  onSave: (userData: Omit<User, 'id'> & { password?: string }) => Promise<void>;
  allUsers: User[];
  currentUser: User;
}

const initialFormState = {
  username: '',
  password: '',
  confirmPassword: '',
  role: 'Staff' as UserRole,
};

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, onSave, allUsers, currentUser }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState<AddUserFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setErrors({});
    }
  }, [isOpen]);

  const validateField = (name: keyof typeof initialFormState, value: string, currentFormData: typeof initialFormState): string | undefined => {
    switch(name) {
        case 'username':
            if (!value.trim()) return "Username cannot be empty.";
            if (allUsers.some(u => u.username.toLowerCase() === value.toLowerCase())) return "This username is already taken.";
            break;
        case 'password':
            if (!value) return "Password cannot be empty.";
            if (value.length < 6) return "Password must be at least 6 characters long.";
            break;
        case 'confirmPassword':
            if (value !== currentFormData.password) return "Passwords do not match.";
            break;
        default:
            return undefined;
    }
    return undefined;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;

    const newFormData = { ...formData, [fieldName]: value };
    setFormData(newFormData);

    const newErrors = { ...errors };

    const error = validateField(fieldName, value, newFormData);
    newErrors[fieldName] = error;

    if (fieldName === 'password' && newFormData.confirmPassword) {
        const confirmPasswordError = validateField('confirmPassword', newFormData.confirmPassword, newFormData);
        newErrors.confirmPassword = confirmPasswordError;
    }
    if(fieldName === 'confirmPassword') {
        const confirmPasswordError = validateField('confirmPassword', value, newFormData);
        newErrors.confirmPassword = confirmPasswordError;
    }
    
    setErrors(newErrors);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const fieldName = name as keyof typeof initialFormState;
    const error = validateField(fieldName, value, formData);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateAll = (): boolean => {
    const newErrors: AddUserFormErrors = {};
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
    try {
        await onSave({ 
            username: formData.username,
            password: formData.password,
            role: formData.role,
        });
    } catch(error) {
        // Parent will toast error, modal remains open
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
            <h2 className="text-xl font-bold text-gray-800">Add New User</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}/>
              {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
            </div>
            
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" id="role" value={formData.role} onChange={handleChange} onBlur={handleBlur} className="w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500">
                <option value="Viewer">Viewer</option>
                <option value="Staff">Staff</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
                {currentUser.role === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
              </select>
            </div>

            <div>
              <label htmlFor="password-add" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" id="password-add" value={formData.password} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}/>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type="password" name="confirmPassword" id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} onBlur={handleBlur} required className={`w-full border rounded-lg p-2 bg-gray-50 border-gray-300 focus:ring-primary-500 focus:border-primary-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}/>
              {errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>}
            </div>
          </div>
          <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl">
            <button type="button" onClick={onClose} disabled={isSaving} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-100 disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={isSaving} className="w-28 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-400">
              {isSaving ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Save User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;