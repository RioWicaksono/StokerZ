import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { LoadingIcon, UserCircleIcon, PlusIcon } from './icons/Icons';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProfilePicture: (userId: string, profilePictureUrl: string) => Promise<void>;
  onUpdatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  currentUser: User;
}

type PasswordErrors = {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
};

const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({ isOpen, onClose, onSaveProfilePicture, onUpdatePassword, currentUser }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSavingPicture, setIsSavingPicture] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentUser.profilePictureUrl || null);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
    }
  }, [isOpen, currentUser]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || selectedImage === currentUser.profilePictureUrl) {
      return;
    }
    setIsSavingPicture(true);
    try {
      await onSaveProfilePicture(currentUser.id, selectedImage);
    } catch (error) {
      console.error("Failed to save profile picture:", error);
    } finally {
      setIsSavingPicture(false);
    }
  };

  const handlePasswordDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const validateAndSubmitPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      const newErrors: PasswordErrors = {};
      if (!passwordData.currentPassword) newErrors.currentPassword = 'Current password is required.';
      if (passwordData.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters.';
      if (passwordData.newPassword !== passwordData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match.';
      
      setPasswordErrors(newErrors);
      
      if (Object.keys(newErrors).length > 0) return;

      setIsSavingPassword(true);
      try {
          await onUpdatePassword(passwordData.currentPassword, passwordData.newPassword);
          onClose(); // Close modal on success
      } catch (error) {
          // Error toast is shown by App.tsx, so we just catch it here
      } finally {
          setIsSavingPassword(false);
      }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" role="dialog" aria-modal="true">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Profile Settings</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
            {/* Profile Picture Form */}
            <form onSubmit={handleProfileSubmit} noValidate className="p-6">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-40 h-40">
                        {selectedImage ? (
                            <img src={selectedImage} alt="Profile Preview" className="w-40 h-40 object-cover rounded-full bg-slate-100 border-4 border-white shadow-md" />
                        ) : (
                            <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-full border-4 border-white shadow-md">
                                <UserCircleIcon className="w-24 h-24 text-slate-400" />
                            </div>
                        )}
                        <label htmlFor="profile-picture-upload" className="absolute bottom-2 right-2 flex items-center justify-center w-10 h-10 bg-primary-500 rounded-full text-white cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                            <PlusIcon className="w-6 h-6" />
                            <input
                                id="profile-picture-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="sr-only"
                            />
                        </label>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-slate-800 capitalize">{currentUser.username}</p>
                        <p className="text-slate-500">{currentUser.role}</p>
                    </div>
                </div>
                 <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={isSavingPicture || !selectedImage || selectedImage === currentUser.profilePictureUrl} className="w-36 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed">
                        {isSavingPicture ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Save Picture'}
                    </button>
                </div>
            </form>

            <hr className="my-2 border-slate-200" />

            {/* Password Change Form */}
            <form onSubmit={validateAndSubmitPassword} noValidate className="p-6">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Change Password</h3>
                <div className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                        <input type="password" name="currentPassword" id="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordDataChange} required className={`w-full border rounded-lg p-2 bg-slate-50 ${passwordErrors.currentPassword ? 'border-red-500' : 'border-slate-300'}`} />
                        {passwordErrors.currentPassword && <p className="text-sm text-red-600 mt-1">{passwordErrors.currentPassword}</p>}
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                        <input type="password" name="newPassword" id="newPassword" value={passwordData.newPassword} onChange={handlePasswordDataChange} required className={`w-full border rounded-lg p-2 bg-slate-50 ${passwordErrors.newPassword ? 'border-red-500' : 'border-slate-300'}`} />
                        {passwordErrors.newPassword && <p className="text-sm text-red-600 mt-1">{passwordErrors.newPassword}</p>}
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                        <input type="password" name="confirmPassword" id="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordDataChange} required className={`w-full border rounded-lg p-2 bg-slate-50 ${passwordErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'}`} />
                        {passwordErrors.confirmPassword && <p className="text-sm text-red-600 mt-1">{passwordErrors.confirmPassword}</p>}
                    </div>
                </div>
                 <div className="mt-6 flex justify-end">
                    <button type="submit" disabled={isSavingPassword} className="w-40 flex justify-center items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:bg-primary-300">
                      {isSavingPassword ? <LoadingIcon className="w-5 h-5 animate-spin" /> : 'Update Password'}
                    </button>
                </div>
            </form>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl flex-shrink-0">
          <button type="button" onClick={onClose} disabled={isSavingPicture || isSavingPassword} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 disabled:opacity-50">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettingsModal;