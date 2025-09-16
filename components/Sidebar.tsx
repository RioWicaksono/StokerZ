import React, { useState } from 'react';
import { View, UserRole } from '../types';
import { DashboardIcon, InventoryIcon, VendorIcon, RequestIcon, CogIcon, ShoppingCartIcon, ChartBarIcon, ClipboardDocumentListIcon, ScaleIcon } from './icons/Icons';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  hasNewRequests: boolean;
  hasNewPurchaseOrders: boolean;
  userRole: UserRole;
}

const NavButton: React.FC<{
    item: { id: string; label: string; icon: React.ReactNode };
    isCurrent: boolean;
    hasNotification?: boolean;
    onClick: () => void;
    isExpanded: boolean;
}> = ({ item, isCurrent, hasNotification, onClick, isExpanded }) => (
    <button
        onClick={onClick}
        title={!isExpanded ? item.label : undefined}
        aria-label={item.label}
        className={`relative flex items-center w-full h-12 px-4 rounded-lg text-left transition-colors duration-200 group ${
        isCurrent
            ? 'bg-slate-700 text-white font-semibold'
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        } ${!isExpanded && 'justify-center'}`}
    >
        {isCurrent && <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary-500 rounded-r-full"></div>}
        
        <div className="relative flex-shrink-0">
            <span className="w-6 h-6 block">{item.icon}</span>
             {hasNotification && !isExpanded && (
                <span className="absolute -top-1 -right-1 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-slate-800"></span>
            )}
        </div>

        <span className={`ml-3 whitespace-nowrap transition-all duration-200 ease-in-out flex-1 ${isExpanded ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0 overflow-hidden'}`}>
            {item.label}
        </span>
        
        {hasNotification && isExpanded && (
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" aria-label="New notification"></span>
        )}
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, hasNewRequests, hasNewPurchaseOrders, userRole }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { id: 'inventory', label: 'Inventory', icon: <InventoryIcon /> },
    { id: 'requests', label: 'Requests', icon: <RequestIcon /> },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: <ShoppingCartIcon /> },
    { id: 'adjustments', label: 'Adjustments', icon: <ScaleIcon /> },
    { id: 'vendors', label: 'Vendors', icon: <VendorIcon /> },
    { id: 'reports', label: 'Reports', icon: <ChartBarIcon /> },
  ];
  
  const adminNavItems = [
    { id: 'admin', label: 'Admin Panel', icon: <CogIcon /> },
    { id: 'audit-log', label: 'Audit Log', icon: <ClipboardDocumentListIcon /> },
  ];

  const getNotificationStatus = (id: string) => {
    if (id === 'requests') return hasNewRequests;
    if (id === 'purchase-orders') return hasNewPurchaseOrders;
    return false;
  }

  return (
    <aside 
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={`bg-slate-800 flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${isExpanded ? 'w-64' : 'w-20'}`}
        data-tour-id="sidebar-nav"
    >
      <nav className="flex-1 px-2 py-4 space-y-2">
        <ul>
          {navItems.map((item) => {
            if (userRole === 'Viewer' && ['requests', 'purchase-orders', 'reports', 'adjustments'].includes(item.id)) {
                return null;
            }
            return (
              <li key={item.id}>
                <NavButton 
                  item={item} 
                  isCurrent={currentView === item.id}
                  hasNotification={getNotificationStatus(item.id)}
                  onClick={() => setCurrentView(item.id as View)}
                  isExpanded={isExpanded}
                />
              </li>
            );
          })}
          {['Supervisor', 'Manager', 'Super Admin'].includes(userRole) && (
             <li className="mt-4 pt-4 border-t border-slate-700">
               <ul className="space-y-2">
                {adminNavItems.map((item) => (
                  <li key={item.id}>
                    <NavButton 
                        item={item}
                        isCurrent={currentView === item.id}
                        onClick={() => setCurrentView(item.id as View)}
                        isExpanded={isExpanded}
                    />
                  </li>
                ))}
               </ul>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
