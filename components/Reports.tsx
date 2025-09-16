
import React, { useState, useMemo } from 'react';
import { Request, PurchaseOrder, Vendor, StockMovement } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { SearchIcon, XMarkIcon, ChartBarIcon, SortIcon, SortUpIcon, SortDownIcon } from './icons/Icons';

interface ReportsProps {
  requests: Request[];
  purchaseOrders: PurchaseOrder[];
  vendors: Vendor[];
}

type SortKey = 'date' | 'productName' | 'type';
type SortDirection = 'asc' | 'desc';

const Reports: React.FC<ReportsProps> = ({ requests, purchaseOrders, vendors }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Incoming' | 'Outgoing'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'date', direction: 'desc' });

  const vendorsMap = useMemo(() => new Map(vendors.map(v => [v.id, v.name])), [vendors]);

  const stockMovements = useMemo((): StockMovement[] => {
    const incoming: StockMovement[] = purchaseOrders
      .filter(po => po.status === 'Approved' && po.actionDate)
      .map(po => ({
        id: po.id,
        date: po.actionDate!,
        productName: po.productName,
        type: 'Incoming',
        quantity: po.quantity,
        details: `From: ${vendorsMap.get(po.vendorId) || 'Unknown Vendor'}`,
        user: po.approvedBy || 'N/A',
      }));

    const outgoing: StockMovement[] = requests
      .filter(req => (req.status === 'Approved' || req.status === 'Collected') && req.actionDate)
      .map(req => ({
        id: req.id,
        date: req.actionDate!,
        productName: req.productName,
        type: 'Outgoing',
        quantity: -req.quantity,
        details: `To: ${req.requestingDivision}`,
        user: req.approvedBy || 'N/A',
      }));

    return [...incoming, ...outgoing];
  }, [requests, purchaseOrders, vendorsMap]);
  
  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) ? date : null;
  };

  const sortedMovements = useMemo(() => {
    const filterStartDate = parseDDMMYYYY(startDate);
    const filterEndDate = parseDDMMYYYY(endDate);

    const filtered = stockMovements.filter(item => {
      if (filterStartDate || filterEndDate) {
        const itemDate = new Date(item.date);
        if (filterStartDate) {
            filterStartDate.setHours(0, 0, 0, 0);
            if (itemDate < filterStartDate) return false;
        }
        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
            if (itemDate > filterEndDate) return false;
        }
      }
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (productSearch && !item.productName.toLowerCase().includes(productSearch.toLowerCase())) return false;
      
      return true;
    });

    return filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      let aValue: string | number;
      let bValue: string | number;

      if (key === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        return (aValue - bValue) * dir;
      }

      aValue = a[key];
      bValue = b[key];

      if (aValue < bValue) return -1 * dir;
      if (aValue > bValue) return 1 * dir;
      return 0;
    });
  }, [stockMovements, startDate, endDate, typeFilter, productSearch, sortConfig]);

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('all');
    setProductSearch('');
  };

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return <SortIcon className="h-4 w-4 text-gray-400" />;
    if (sortConfig.direction === 'asc') return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };

  const handleExportCSV = () => {
    if (sortedMovements.length === 0) return;

    const headers = "Date,Product Name,Type,Quantity,Details,Reference ID,User\n";
    const csvContent = sortedMovements.map(item => 
        [
            formatDate(item.date),
            `"${item.productName.replace(/"/g, '""')}"`,
            item.type,
            item.quantity,
            `"${item.details.replace(/"/g, '""')}"`,
            item.id,
            item.user
        ].join(',')
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `stock_movement_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const isFiltered = startDate || endDate || typeFilter !== 'all' || productSearch;

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
           <div className="lg:col-span-2">
              <label htmlFor="reportProductSearch" className="block text-sm font-medium text-gray-600 mb-1">Product Name</label>
              <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input type="text" id="reportProductSearch" value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500" placeholder="Search product..."/>
              </div>
          </div>
          <div>
            <label htmlFor="reportTypeFilter" className="block text-sm font-medium text-gray-600 mb-1">Movement Type</label>
            <select id="reportTypeFilter" value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500">
              <option value="all">All</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
          </div>
          <div>
            <button onClick={handleExportCSV} className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">Export CSV</button>
          </div>
          <div>
            <label htmlFor="reportStartDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input type="text" id="reportStartDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          <div>
            <label htmlFor="reportEndDate" className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input type="text" id="reportEndDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          {isFiltered && (
            <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors h-10">
              <XMarkIcon className="h-4 w-4" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 border-collapse border border-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3 border border-gray-300"><button onClick={() => requestSort('date')} className="flex items-center gap-1.5">Date {getSortIcon('date')}</button></th>
              <th scope="col" className="px-6 py-3 border border-gray-300"><button onClick={() => requestSort('productName')} className="flex items-center gap-1.5">Product {getSortIcon('productName')}</button></th>
              <th scope="col" className="px-6 py-3 border border-gray-300"><button onClick={() => requestSort('type')} className="flex items-center gap-1.5">Type {getSortIcon('type')}</button></th>
              <th scope="col" className="px-6 py-3 text-right border border-gray-300">Quantity</th>
              <th scope="col" className="px-6 py-3 border border-gray-300">Details</th>
              <th scope="col" className="px-6 py-3 border border-gray-300">Reference ID</th>
              <th scope="col" className="px-6 py-3 border border-gray-300">User</th>
            </tr>
          </thead>
          <tbody>
            {sortedMovements.map(item => (
              <tr key={item.id + item.type} className="block md:table-row bg-white hover:bg-gray-50">
                <td className="px-6 py-4 block md:table-cell border border-gray-300" data-label="Date">{formatDate(item.date)}</td>
                <td className="px-6 py-4 font-semibold text-gray-900 block md:table-cell border border-gray-300" data-label="Product">{item.productName}</td>
                <td className="px-6 py-4 block md:table-cell border border-gray-300" data-label="Type">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'Incoming' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-left md:text-right font-bold block md:table-cell border border-gray-300 ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`} data-label="Quantity">
                  {item.quantity > 0 ? `+${formatNumber(item.quantity)}` : formatNumber(item.quantity)}
                </td>
                <td className="px-6 py-4 block md:table-cell border border-gray-300" data-label="Details">{item.details}</td>
                <td className="px-6 py-4 text-xs text-gray-500 block md:table-cell border border-gray-300" data-label="Reference ID">{item.id}</td>
                <td className="px-6 py-4 block md:table-cell border border-gray-300 capitalize" data-label="User">{item.user}</td>
              </tr>
            ))}
            {sortedMovements.length === 0 && (
              <tr className="md:table-row">
                <td colSpan={7} className="text-center py-16 text-gray-500 block md:table-cell border border-gray-300">
                  <div className="flex flex-col items-center justify-center">
                    <ChartBarIcon className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="font-semibold text-lg">No stock movements found.</p>
                    <p>{isFiltered ? 'Try adjusting your filters.' : 'Data will appear here once transactions are approved.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        @media (max-width: 767px) {
          tbody tr { border-bottom: 2px solid #e5e7eb; padding: 1rem 0; }
          tbody td { display: flex; justify-content: space-between; align-items: center; padding-left: 1.5rem; padding-right: 1.5rem; text-align: right; }
          tbody td[data-label]::before { content: attr(data-label); font-weight: 600; text-align: left; margin-right: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default Reports;
