

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Vendor, User } from '../types';
import { SearchIcon, VendorIcon as BuildingIcon, EditIcon, DeleteIcon, XMarkIcon, PlusIcon, SortIcon, SortUpIcon, SortDownIcon, ChevronDownIcon } from './icons/Icons';
import { formatDate } from '../utils/helpers';

interface VendorListProps {
  vendors: Vendor[];
  onEditVendor: (vendor: Vendor) => void;
  onDeleteVendor: (vendor: Vendor) => void;
  onAddVendor: () => void;
  onViewDetails: (vendor: Vendor) => void;
  onBulkDelete: (vendorIds: string[]) => void;
  currentUser: User;
  itemsBeingDeleted: Set<string>;
}

type SortableVendorKey = 'name' | 'category' | 'contactPerson' | 'lastModifiedBy' | 'lastUpdated';

const VENDOR_TABLE_STATE_KEY = 'stockerz_vendor_table_state_v1';

interface VendorTableState {
  searchTerm: string;
  sortConfig: { key: SortableVendorKey; direction: 'asc' | 'desc' };
}

const getInitialState = (): VendorTableState => {
  try {
    const item = window.localStorage.getItem(VENDOR_TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        searchTerm: parsed.searchTerm || '',
        sortConfig: parsed.sortConfig || { key: 'name', direction: 'asc' },
      };
    }
  } catch (error) {
    console.warn("Could not parse vendor table state from localStorage", error);
  }
  return {
    searchTerm: '',
    sortConfig: { key: 'name', direction: 'asc' },
  };
};

const VendorList: React.FC<VendorListProps> = ({ vendors, onEditVendor, onDeleteVendor, onAddVendor, onViewDetails, onBulkDelete, currentUser, itemsBeingDeleted }) => {
  const [tableState, setTableState] = useState<VendorTableState>(getInitialState);
  const { searchTerm, sortConfig } = tableState;
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const canPerformActions = useMemo(() => ['Supervisor', 'Manager', 'Super Admin'].includes(currentUser.role), [currentUser.role]);

  useEffect(() => {
    try {
      window.localStorage.setItem(VENDOR_TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save vendor table state to localStorage", error);
    }
  }, [tableState]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
            setIsActionsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, vendors]);

  const filteredVendors = useMemo(() => {
    if (!searchTerm) {
      return vendors;
    }
    return vendors.filter(vendor =>
      vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [vendors, searchTerm]);
  
  const sortedVendors = useMemo(() => {
    let sortableItems = [...filteredVendors];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? '';
        const bValue = b[sortConfig.key] ?? '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredVendors, sortConfig]);

  const handleSelectOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const handleSelectAll = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(sortedVendors.map(v => v.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [sortedVendors]);

  const isAllSelected = sortedVendors.length > 0 && selectedIds.size === sortedVendors.length;

  const requestSort = (key: SortableVendorKey) => {
    setTableState(current => {
      let direction: 'asc' | 'desc' = 'asc';
      if (current.sortConfig && current.sortConfig.key === key && current.sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { ...current, sortConfig: { key, direction } };
    });
  };
  
  const getSortIcon = (key: SortableVendorKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <SortIcon className="h-4 w-4 text-slate-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    }
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };

  if (vendors.length === 0 && !searchTerm) {
    return (
        <div className="text-center bg-white p-12 rounded-xl shadow-lg">
            <BuildingIcon className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">No vendors found</h3>
            <p className="mt-2 text-slate-500">There are currently no vendors registered. Add one to get started.</p>
            {canPerformActions && <div className="mt-6">
                <button
                    onClick={onAddVendor}
                    className="flex items-center justify-center mx-auto bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    <span>Add New Vendor</span>
                </button>
            </div>}
        </div>
    );
  }
  
  const headers: { key: keyof Vendor | 'actions'; label: string; isSortable: boolean }[] = useMemo(() => {
    const baseHeaders: { key: keyof Vendor | 'actions'; label: string; isSortable: boolean }[] = [
      { key: 'name', label: 'Vendor Name', isSortable: true },
      { key: 'category', label: 'Category', isSortable: true },
      { key: 'contactPerson', label: 'Contact Person', isSortable: true },
      { key: 'email', label: 'Email', isSortable: false },
      { key: 'phone', label: 'Phone', isSortable: false },
      { key: 'lastUpdated', label: 'Last Modified Date', isSortable: true },
      { key: 'lastModifiedBy', label: 'Modified By', isSortable: true },
    ];
    if (canPerformActions) {
      baseHeaders.push({ key: 'actions', label: 'Actions', isSortable: false });
    }
    return baseHeaders;
  }, [canPerformActions]);

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, category, or contact..."
              value={searchTerm}
              onChange={e => setTableState(s => ({...s, searchTerm: e.target.value}))}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 border-slate-300 placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          {searchTerm && (
              <button
                onClick={() => setTableState(s => ({...s, searchTerm: ''}))}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Reset search"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Reset</span>
              </button>
            )}
        </div>
      </div>
       {canPerformActions && selectedIds.size > 0 && (
          <div className="px-4 md:px-6 py-3 bg-sky-50 border-b border-sky-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="text-sm font-semibold text-sky-800">
                  {selectedIds.size} {selectedIds.size === 1 ? 'vendor' : 'vendors'} selected
              </span>
              <div ref={actionsMenuRef} className="relative">
                <button 
                    onClick={() => setIsActionsMenuOpen(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                    aria-haspopup="true"
                    aria-expanded={isActionsMenuOpen}
                >
                    Bulk Actions
                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isActionsMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {isActionsMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                            <button
                                onClick={() => {
                                    onBulkDelete(Array.from(selectedIds));
                                    setIsActionsMenuOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                                role="menuitem"
                            >
                                <DeleteIcon className="w-4 h-4" />
                                <span>Delete Selected</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
            <tr>
              {canPerformActions && <th scope="col" className="px-6 py-3 border border-slate-300">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-400 text-primary-600 focus:ring-primary-500"
                  aria-label="Select all vendors"
                />
              </th>}
              {headers.map(header => (
                  <th key={header.key} scope="col" className="px-6 py-3 border border-slate-300">
                     {header.isSortable ? (
                      <button onClick={() => requestSort(header.key as SortableVendorKey)} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                        {header.label}
                        {getSortIcon(header.key as SortableVendorKey)}
                      </button>
                    ) : (
                      header.label
                    )}
                  </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedVendors.map(vendor => (
              <tr 
                key={vendor.id} 
                className={`block md:table-row transition-all duration-300 cursor-pointer ${
                  canPerformActions && selectedIds.has(vendor.id) ? 'bg-sky-100 hover:bg-sky-200' : 'bg-white hover:bg-slate-50'
                } ${itemsBeingDeleted.has(vendor.id) ? 'animate-fade-out-shrink' : ''}`}
              >
                {canPerformActions && <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Select">
                   <input
                        type="checkbox"
                        checked={selectedIds.has(vendor.id)}
                        onChange={() => handleSelectOne(vendor.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-400 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select ${vendor.name}`}
                    />
                </td>}
                <td className="px-6 py-4 font-semibold text-slate-900 block md:table-cell border border-slate-300" data-label="Vendor Name" onClick={() => onViewDetails(vendor)}>{vendor.name}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Category" onClick={() => onViewDetails(vendor)}>
                    <span className="px-2 py-1 text-xs font-medium text-sky-800 bg-sky-100 rounded-full">{vendor.category}</span>
                </td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Contact Person" onClick={() => onViewDetails(vendor)}>{vendor.contactPerson}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Email">
                  <a href={`mailto:${vendor.email}`} onClick={(e) => e.stopPropagation()} className="text-primary-600 hover:underline">{vendor.email}</a>
                </td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Phone" onClick={() => onViewDetails(vendor)}>{vendor.phone}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Last Modified Date" onClick={() => onViewDetails(vendor)}>{vendor.lastUpdated ? formatDate(vendor.lastUpdated) : 'N/A'}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300 capitalize" data-label="Modified By" onClick={() => onViewDetails(vendor)}>{vendor.lastModifiedBy || 'N/A'}</td>
                {canPerformActions && <td className="px-6 py-4 flex items-center justify-start md:justify-center space-x-2 md:table-cell border border-slate-300" data-label="Actions">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onEditVendor(vendor); }} 
                    className="text-primary-600 hover:text-primary-800 p-1" aria-label={`Edit ${vendor.name}`}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteVendor(vendor); }} 
                    className="text-red-500 hover:text-red-700 p-1" aria-label={`Delete ${vendor.name}`}>
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </td>}
              </tr>
            ))}
             {sortedVendors.length === 0 && (
              <tr className="md:table-row">
                <td colSpan={headers.length + (canPerformActions ? 1 : 0)} className="text-center py-10 text-slate-500 block md:table-cell border border-slate-300">
                  No vendors match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       <style>{`
        @keyframes fade-out-shrink {
            from {
                opacity: 1;
                transform: scaleY(1);
            }
            to {
                opacity: 0;
                transform: scaleY(0);
                padding-top: 0;
                padding-bottom: 0;
                border: 0;
                height: 0;
            }
        }
        .animate-fade-out-shrink {
            transform-origin: top;
            animation: fade-out-shrink 0.5s ease-out forwards;
        }
        .animate-fade-out-shrink td {
            transition: padding 0.5s ease-out;
        }
        @media (max-width: 767px) {
          tbody tr {
            border-bottom: 2px solid #e2e8f0;
            padding: 1rem 0;
          }
           .animate-fade-out-shrink {
             padding-top: 0 !important;
             padding-bottom: 0 !important;
             margin: 0;
          }
          tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            text-align: right;
          }
          tbody td[data-label="Select"] {
            padding-bottom: 0;
            border-bottom: none;
          }
          tbody td[data-label]::before {
            content: attr(data-label);
            font-weight: 600;
            text-align: left;
            margin-right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default VendorList;