import React, { useState, useEffect, useRef } from 'react';
import { View, User } from '../types';
import { PlusIcon, BoxIcon, UserCircleIcon, LogoutIcon, ChevronDownIcon, CogIcon } from './icons/Icons';

interface HeaderProps {
  currentView: View;
  onAddProduct: () => void;
  onAddVendor: () => void;
  onAddRequest: () => void;
  onAddPurchaseOrder: () => void;
  onAddAdjustment: () => void;
  isVisible: boolean;
  currentUser: User;
  onLogout: () => void;
  onOpenProfileModal: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
    currentView, 
    onAddProduct, 
    onAddVendor, 
    onAddRequest, 
    onAddPurchaseOrder, 
    onAddAdjustment, 
    isVisible, 
    currentUser,
    onLogout,
    onOpenProfileModal
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setIsUserMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Analytics Dashboard';
      case 'inventory': return 'Inventory Management';
      case 'requests': return 'Request Management';
      case 'purchase-orders': return 'Purchase Order Management';
      case 'adjustments': return 'Stock Adjustments';
      case 'vendors': return 'Vendor List';
      case 'reports': return 'Stock Movement Report';
      case 'admin': return 'Admin Panel';
      case 'audit-log': return 'Audit Log';
      default: return 'StockerZ';
    }
  };
  
  const title = getTitle();
  
  const getActionButton = () => {
    const userRole = currentUser.role;

    if (userRole === 'Viewer') return null;
    
    const canManageInventory = ['Supervisor', 'Manager', 'Super Admin'].includes(userRole);
    const canRequest = ['Staff', 'Supervisor', 'Manager', 'Super Admin'].includes(userRole);

    const buttonProps = {
      className: "flex items-center justify-center bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200"
    };

    const buttons: { [key in View]?: { label: string; action: () => void; requiredRole: 'manage' | 'request' } } = {
        'inventory': { label: 'Add Product', action: onAddProduct, requiredRole: 'manage' },
        'vendors': { label: 'Add Vendor', action: onAddVendor, requiredRole: 'manage' },
        'requests': { label: 'New Request', action: onAddRequest, requiredRole: 'request' },
        'purchase-orders': { label: 'New Purchase Order', action: onAddPurchaseOrder, requiredRole: 'request' },
        'adjustments': { label: 'Add Adjustment', action: onAddAdjustment, requiredRole: 'request' }
    };
    
    const buttonConfig = buttons[currentView];

    if (!buttonConfig) return null;

    const hasPermission = buttonConfig.requiredRole === 'manage' ? canManageInventory : canRequest;
    if (!hasPermission) return null;

    return (
        <button onClick={buttonConfig.action} {...buttonProps}>
            <PlusIcon className="w-5 h-5 mr-2" />
            <span>{buttonConfig.label}</span>
        </button>
    );
  }

  return (
    <header className={`h-20 bg-white flex-shrink-0 flex items-center justify-between px-8 border-b border-slate-200 sticky top-0 z-40 transition-transform duration-300 ease-in-out ${!isVisible ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="flex items-center">
        <BoxIcon className="h-8 w-8 text-primary-500" />
        <h1 className="text-xl font-bold text-slate-800 ml-3">StockerZ</h1>
        <div className="w-px h-6 bg-slate-300 mx-6"></div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        <div data-tour-id="header-actions">
            {getActionButton()}
        </div>
        <div className="relative" ref={userMenuRef} data-tour-id="header-user-menu">
            <button onClick={() => setIsUserMenuOpen(prev => !prev)} className="flex items-center gap-2 rounded-full hover:bg-slate-100 transition-colors">
                {currentUser.profilePictureUrl ? (
                    <img src={currentUser.profilePictureUrl} alt="Profile" className="w-10 h-10 object-cover rounded-full bg-slate-200 border-2 border-white shadow-sm" />
                ) : (
                    <UserCircleIcon className="w-10 h-10 text-slate-500" />
                )}
                 <ChevronDownIcon className={`w-5 h-5 text-slate-500 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
                        <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
                            {currentUser.profilePictureUrl ? (
                                <img src={currentUser.profilePictureUrl} alt="Profile" className="w-10 h-10 object-cover rounded-full bg-slate-200" />
                            ) : (
                                <UserCircleIcon className="w-10 h-10 text-slate-500" />
                            )}
                            <div>
                                <p className="text-sm font-semibold text-slate-800 truncate capitalize">{currentUser.username}</p>
                                <p className="text-sm text-slate-500">{currentUser.role}</p>
                            </div>
                        </div>
                         <button
                            onClick={() => {
                                onOpenProfileModal();
                                setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            role="menuitem"
                        >
                            <CogIcon className="w-5 h-5" />
                            <span>Profile Settings</span>
                        </button>
                        <button
                            onClick={() => {
                                onLogout();
                                setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                            role="menuitem"
                        >
                            <LogoutIcon className="w-5 h-5" />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
