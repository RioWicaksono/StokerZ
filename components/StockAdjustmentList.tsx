import React, { useState, useMemo, useEffect } from 'react';
import { StockAdjustment } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { XMarkIcon, ScaleIcon, SortIcon, SortUpIcon, SortDownIcon } from './icons/Icons';

interface StockAdjustmentListProps {
  adjustments: StockAdjustment[];
}

type SortKey = 'date' | 'productName' | 'reason' | 'adjustedBy';
type SortDirection = 'asc' | 'desc';

const ADJUSTMENT_TABLE_STATE_KEY = 'stockerz_adjustment_table_state_v1';

interface AdjustmentTableState {
  startDate: string;
  endDate: string;
  reasonFilter: string;
  sortConfig: { key: SortKey; direction: SortDirection };
}

const getInitialState = (): AdjustmentTableState => {
  try {
    const item = window.localStorage.getItem(ADJUSTMENT_TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        startDate: parsed.startDate || '',
        endDate: parsed.endDate || '',
        reasonFilter: parsed.reasonFilter || 'all',
        sortConfig: parsed.sortConfig || { key: 'date', direction: 'desc' },
      };
    }
  } catch (error) {
    console.warn("Could not parse adjustment table state from localStorage", error);
  }
  return {
    startDate: '',
    endDate: '',
    reasonFilter: 'all',
    sortConfig: { key: 'date', direction: 'desc' },
  };
};

const StockAdjustmentList: React.FC<StockAdjustmentListProps> = ({ adjustments }) => {
  const [tableState, setTableState] = useState<AdjustmentTableState>(getInitialState);
  const { startDate, endDate, reasonFilter, sortConfig } = tableState;
  
  useEffect(() => {
    try {
      window.localStorage.setItem(ADJUSTMENT_TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save adjustment table state to localStorage", error);
    }
  }, [tableState]);

  const reasons = useMemo(() => ['all', ...Array.from(new Set(adjustments.map(a => a.reason)))], [adjustments]);
  
  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) ? date : null;
  };

  const sortedAdjustments = useMemo(() => {
    const filterStartDate = parseDDMMYYYY(startDate);
    const filterEndDate = parseDDMMYYYY(endDate);

    const filtered = adjustments.filter(item => {
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
      if (reasonFilter !== 'all' && item.reason !== reasonFilter) return false;
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
      aValue = a[key] || '';
      bValue = b[key] || '';

      if (aValue < bValue) return -1 * dir;
      if (aValue > bValue) return 1 * dir;
      return 0;
    });
  }, [adjustments, startDate, endDate, reasonFilter, sortConfig]);

  const handleReset = () => {
    setTableState(s => ({
      ...s,
      startDate: '',
      endDate: '',
      reasonFilter: 'all',
    }));
  };
  
  const requestSort = (key: SortKey) => {
    setTableState(current => {
      let direction: SortDirection = 'asc';
      if (current.sortConfig.key === key && current.sortConfig.direction === 'asc') direction = 'desc';
      return { ...current, sortConfig: { key, direction } };
    });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig?.key !== key) return <SortIcon className="h-4 w-4 text-gray-400" />;
    if (sortConfig.direction === 'asc') return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };

  const isFiltered = startDate || endDate || reasonFilter !== 'all';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1 min-w-[200px]">
                <label htmlFor="reasonFilter" className="block text-sm font-medium text-gray-600 mb-1">Reason</label>
                <select id="reasonFilter" value={reasonFilter} onChange={e => setTableState(s => ({...s, reasonFilter: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500">
                <option value="all">All Reasons</option>
                {reasons.filter(r => r !== 'all').map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="adjStartDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                <input type="text" id="adjStartDate" value={startDate} onChange={e => setTableState(s => ({...s, startDate: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
            </div>
            <div>
                <label htmlFor="adjEndDate" className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                <input type="text" id="adjEndDate" value={endDate} onChange={e => setTableState(s => ({...s, endDate: e.target.value}))} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
            </div>
            {isFiltered && (
                <button onClick={handleReset} className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors h-10">
                <XMarkIcon className="h-4 w-4" />
                <span>Reset</span>
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
              <th scope="col" className="px-6 py-3 text-right border border-gray-300">Quantity Change</th>
              <th scope="col" className="px-6 py-3 border border-gray-300"><button onClick={() => requestSort('reason')} className="flex items-center gap-1.5">Reason {getSortIcon('reason')}</button></th>
              <th scope="col" className="px-6 py-3 border border-gray-300">Notes</th>
              <th scope="col" className="px-6 py-3 border border-gray-300"><button onClick={() => requestSort('adjustedBy')} className="flex items-center gap-1.5">Adjusted By {getSortIcon('adjustedBy')}</button></th>
            </tr>
          </thead>
          <tbody>
            {sortedAdjustments.map(item => (
              <tr key={item.id} className="block md:table-row bg-white hover:bg-gray-50">
                <td className="px-6 py-4 block md:table-cell border border-gray-300" data-label="Date">{formatDate(item.date)}</td>
                <td className="px-6 py-4 font-semibold text-gray-900 block md:table-cell border border-gray-300" data-label="Product">{item.productName}</td>
                <td className={`px-6 py-4 text-left md:text-right font-bold block md:table-cell border border-gray-300 ${item.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`} data-label="Quantity Change">
                  {item.quantityChange > 0 ? `+${formatNumber(item.quantityChange)}` : formatNumber(item.quantityChange)}
                </td>
                <td className="px-6 py-4 block md:table-cell border border-gray-300" data-label="Reason">{item.reason}</td>
                <td className="px-6 py-4 text-xs italic text-gray-500 block md:table-cell border border-gray-300" data-label="Notes">{item.notes || 'N/A'}</td>
                <td className="px-6 py-4 block md:table-cell border border-gray-300 capitalize" data-label="Adjusted By">{item.adjustedBy}</td>
              </tr>
            ))}
            {sortedAdjustments.length === 0 && (
              <tr className="md:table-row">
                <td colSpan={6} className="text-center py-16 text-gray-500 block md:table-cell border border-gray-300">
                  <div className="flex flex-col items-center justify-center">
                    <ScaleIcon className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="font-semibold text-lg">No stock adjustments found.</p>
                    <p>{isFiltered ? 'Try adjusting your filters.' : 'Manual stock changes will be recorded here.'}</p>
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

export default StockAdjustmentList;