





import React, { useState, useMemo, useEffect } from 'react';
import { PurchaseOrder, UserRole, Vendor, Product } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { CheckIcon, XMarkIcon, ShoppingCartIcon as NoDataIcon, SearchIcon, SortIcon, SortUpIcon, SortDownIcon, CubeIcon } from './icons/Icons';

interface PurchaseOrderListProps {
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
  products: Product[];
  onApprove: (po: PurchaseOrder) => void;
  onReject: (po: PurchaseOrder) => void;
  onViewDetails: (po: PurchaseOrder) => void;
  onMarkAsReceived: (po: PurchaseOrder) => void;
  userRole?: UserRole;
}

const getStatusBadge = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'Pending Approval':
      return 'bg-amber-100 text-amber-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Received':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

type SortKey = 'vendorName' | 'productName' | 'status' | 'requestDate';
type SortDirection = 'asc' | 'desc';

const PO_TABLE_STATE_KEY = 'stockerz_po_table_state_v1';

interface POTableState {
  startDate: string;
  endDate: string;
  vendorFilter: string;
  productSearch: string;
  sortConfig: { key: SortKey; direction: SortDirection };
}

const getInitialState = (): POTableState => {
  try {
    const item = window.localStorage.getItem(PO_TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        startDate: parsed.startDate || '',
        endDate: parsed.endDate || '',
        vendorFilter: parsed.vendorFilter || 'all',
        productSearch: parsed.productSearch || '',
        sortConfig: parsed.sortConfig || { key: 'requestDate', direction: 'desc' },
      };
    }
  } catch (error) {
    console.warn("Could not parse PO table state from localStorage", error);
  }
  return {
    startDate: '',
    endDate: '',
    vendorFilter: 'all',
    productSearch: '',
    sortConfig: { key: 'requestDate', direction: 'desc' },
  };
};

const PurchaseOrderList: React.FC<PurchaseOrderListProps> = ({ purchaseOrders, vendors, onApprove, onReject, onViewDetails, onMarkAsReceived, userRole }) => {
  const [tableState, setTableState] = useState<POTableState>(getInitialState());
  const { startDate, endDate, vendorFilter, productSearch, sortConfig } = tableState;

  useEffect(() => {
    try {
      window.localStorage.setItem(PO_TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save PO table state to localStorage", error);
    }
  }, [tableState]);

  const vendorsMap = useMemo(() => new Map(vendors.map(v => [v.id, v.name])), [vendors]);

  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) ? date : null;
  };

  const sortedPOs = useMemo(() => {
    const filterStartDate = parseDDMMYYYY(startDate);
    const filterEndDate = parseDDMMYYYY(endDate);

    const filtered = purchaseOrders.filter(po => {
      if (filterStartDate || filterEndDate) {
        const requestDate = new Date(po.requestDate);
        if (filterStartDate) {
            filterStartDate.setHours(0, 0, 0, 0);
            if (requestDate < filterStartDate) return false;
        }
        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
            if (requestDate > filterEndDate) return false;
        }
      }
      if (vendorFilter !== 'all' && po.vendorId !== vendorFilter) return false;
      if (productSearch && !po.productName.toLowerCase().includes(productSearch.toLowerCase())) return false;
      
      return true;
    });

    return filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        let aValue: string | number;
        let bValue: string | number;

        switch (key) {
            case 'vendorName':
                aValue = vendorsMap.get(a.vendorId) || '';
                bValue = vendorsMap.get(b.vendorId) || '';
                break;
            case 'productName':
                aValue = a.productName;
                bValue = b.productName;
                break;
            case 'status':
                aValue = a.status;
                bValue = b.status;
                break;
            case 'requestDate':
                aValue = new Date(a.requestDate).getTime();
                bValue = new Date(b.requestDate).getTime();
                return (aValue - bValue) * dir;
            default:
                return 0;
        }
        
        if (aValue < bValue) return -1 * dir;
        if (aValue > bValue) return 1 * dir;
        return 0;
    });
  }, [purchaseOrders, startDate, endDate, vendorFilter, productSearch, sortConfig, vendorsMap]);

  const handleReset = () => {
    setTableState({
      startDate: '',
      endDate: '',
      vendorFilter: 'all',
      productSearch: '',
      sortConfig: { key: 'requestDate', direction: 'desc' },
    });
  };

  const requestSort = (key: SortKey) => {
    setTableState(current => {
      let direction: SortDirection = 'asc';
      if (current.sortConfig.key === key && current.sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { ...current, sortConfig: { key, direction } };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) {
      return <SortIcon className="h-4 w-4 text-slate-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    }
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };
  
  const isFiltered = startDate !== '' || endDate !== '' || vendorFilter !== 'all' || productSearch !== '';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-slate-200">
        <div className="flex flex-col md:flex-row md:flex-wrap md:items-end gap-4">
           <div className="flex-1 min-w-[200px]">
              <label htmlFor="poProductSearch" className="block text-sm font-medium text-slate-600 mb-1">Product Name</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" id="poProductSearch" value={productSearch} onChange={e => setTableState(s => ({...s, productSearch: e.target.value}))} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 border-slate-300 placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500" placeholder="Search product..."/>
              </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="poVendorFilter" className="block text-sm font-medium text-slate-600 mb-1">Vendor</label>
            <select id="poVendorFilter" value={vendorFilter} onChange={e => setTableState(s => ({...s, vendorFilter: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500">
              <option value="all">All Vendors</option>
              {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="poStartDate" className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
            <input type="text" id="poStartDate" value={startDate} onChange={e => setTableState(s => ({...s, startDate: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          <div>
            <label htmlFor="poEndDate" className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
            <input type="text" id="poEndDate" value={endDate} onChange={e => setTableState(s => ({...s, endDate: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          {isFiltered && (
            <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors h-10">
              <XMarkIcon className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300">
          <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 border border-slate-300">
                <button onClick={() => requestSort('vendorName')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">Vendor {getSortIcon('vendorName')}</button>
              </th>
              <th scope="col" className="px-6 py-3 border border-slate-300">
                <button onClick={() => requestSort('productName')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">Product {getSortIcon('productName')}</button>
              </th>
              <th scope="col" className="px-6 py-3 text-right border border-slate-300">Quantity</th>
              <th scope="col" className="px-6 py-3 border border-slate-300">
                 <button onClick={() => requestSort('requestDate')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">Request Date {getSortIcon('requestDate')}</button>
              </th>
              <th scope="col" className="px-6 py-3 border border-slate-300">Requested By</th>
              <th scope="col" className="px-6 py-3 border border-slate-300">
                <button onClick={() => requestSort('status')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">Status {getSortIcon('status')}</button>
              </th>
              <th scope="col" className="px-6 py-3 text-center border border-slate-300">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedPOs.map(po => (
              <tr key={po.id} className="block md:table-row bg-white hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onViewDetails(po)}>
                <td className="px-6 py-4 font-semibold text-slate-900 block md:table-cell border border-slate-300" data-label="Vendor">{vendorsMap.get(po.vendorId) || 'Unknown Vendor'}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Product">{po.productName}</td>
                <td className="px-6 py-4 text-left md:text-right font-medium block md:table-cell border border-slate-300" data-label="Quantity">{formatNumber(po.quantity)}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Date">{formatDate(po.requestDate)}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300 capitalize" data-label="Requested By">{po.requestedBy}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Status">
                  <span key={po.status} className={`px-2 py-1 text-xs font-semibold rounded-full animate-pop-in ${getStatusBadge(po.status)}`}>{po.status}</span>
                </td>
                <td className="px-6 py-4 flex items-center justify-start md:justify-center space-x-2 md:table-cell border border-slate-300" data-label="Actions" onClick={(e) => e.stopPropagation()}>
                   {po.status === 'Pending Approval' && userRole && ['Supervisor', 'Manager', 'Super Admin'].includes(userRole) ? (
                    <>
                      <button onClick={() => onApprove(po)} className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200" aria-label={`Approve PO for ${po.productName}`}>
                        <CheckIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => onReject(po)} className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200" aria-label={`Reject PO for ${po.productName}`}>
                        <XMarkIcon className="w-5 h-5" />
                      </button>
                    </>
                  ) : po.status === 'Approved' && userRole && ['Staff', 'Supervisor', 'Manager', 'Super Admin'].includes(userRole) ? (
                     <button
                        onClick={() => onMarkAsReceived(po)}
                        className="flex items-center justify-center bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-all text-xs"
                        aria-label={`Mark PO for ${po.productName} as received`}
                      >
                        <CubeIcon className="w-4 h-4 mr-1.5" />
                        Mark as Received
                      </button>
                  ) : (
                    <span className="text-slate-400 text-xs italic">{po.status === 'Pending Approval' ? 'Awaiting Approval' : 'Completed'}</span>
                  )}
                </td>
              </tr>
            ))}
            {sortedPOs.length === 0 && (
              <tr className="md:table-row">
                <td colSpan={7} className="text-center py-16 text-slate-500 block md:table-cell border border-slate-300">
                  <div className="flex flex-col items-center justify-center">
                    <NoDataIcon className="h-16 w-16 text-slate-300 mb-3" />
                    <p className="font-semibold text-lg">No purchase orders found.</p>
                    {isFiltered ? <p>Try adjusting your filters.</p> : <p>Create a new purchase order to get started.</p>}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       <style>{`
        @keyframes pop-in {
            0% {
                opacity: 0;
                transform: scale(0.5);
            }
            100% {
                opacity: 1;
                transform: scale(1);
            }
        }
        .animate-pop-in {
            animation: pop-in 0.3s ease-out forwards;
        }
        @media (max-width: 767px) {
          tbody tr { border-bottom: 2px solid #e2e8f0; padding: 1rem 0; }
          tbody td { display: flex; justify-content: space-between; align-items: center; padding-left: 1.5rem; padding-right: 1.5rem; text-align: right; }
          tbody td[data-label]::before { content: attr(data-label); font-weight: 600; text-align: left; margin-right: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default PurchaseOrderList;