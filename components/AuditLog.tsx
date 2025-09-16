import React, { useState, useMemo, useEffect } from 'react';
import { AuditLog } from '../types';
import { formatDate } from '../utils/helpers';
import { SearchIcon, XMarkIcon, ClipboardDocumentListIcon, SortIcon, SortUpIcon, SortDownIcon } from './icons/Icons';

interface AuditLogProps {
  logs: AuditLog[];
}

type SortKey = 'timestamp' | 'user' | 'action';
type SortDirection = 'asc' | 'desc';

const AUDIT_TABLE_STATE_KEY = 'stockerz_audit_table_state_v1';

interface AuditLogTableState {
  startDate: string;
  endDate: string;
  userFilter: string;
  actionFilter: string;
  sortConfig: { key: SortKey; direction: SortDirection };
  currentPage: number;
}

const getInitialState = (): AuditLogTableState => {
  try {
    const item = window.localStorage.getItem(AUDIT_TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        startDate: parsed.startDate || '',
        endDate: parsed.endDate || '',
        userFilter: parsed.userFilter || '',
        actionFilter: parsed.actionFilter || '',
        sortConfig: parsed.sortConfig || { key: 'timestamp', direction: 'desc' },
        currentPage: parsed.currentPage || 1,
      };
    }
  } catch (error) {
    console.warn("Could not parse audit log table state from localStorage", error);
  }
  return {
    startDate: '',
    endDate: '',
    userFilter: '',
    actionFilter: '',
    sortConfig: { key: 'timestamp', direction: 'desc' },
    currentPage: 1,
  };
};

const AuditLogComponent: React.FC<AuditLogProps> = ({ logs }) => {
  const [tableState, setTableState] = useState<AuditLogTableState>(getInitialState);
  const { startDate, endDate, userFilter, actionFilter, sortConfig, currentPage } = tableState;
  const itemsPerPage = 15;

  useEffect(() => {
    try {
      window.localStorage.setItem(AUDIT_TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save audit log table state to localStorage", error);
    }
  }, [tableState]);

  const usersList = useMemo(() => [...new Set(logs.map(log => log.user))].sort(), [logs]);

  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) ? date : null;
  };

  const sortedLogs = useMemo(() => {
    const filterStartDate = parseDDMMYYYY(startDate);
    const filterEndDate = parseDDMMYYYY(endDate);

    const filtered = logs.filter(log => {
      if (filterStartDate || filterEndDate) {
        const logDate = new Date(log.timestamp);
        if (filterStartDate) {
            filterStartDate.setHours(0, 0, 0, 0);
            if (logDate < filterStartDate) return false;
        }
        if (filterEndDate) {
            filterEndDate.setHours(23, 59, 59, 999);
            if (logDate > filterEndDate) return false;
        }
      }
      if (userFilter && log.user.toLowerCase() !== userFilter.toLowerCase()) return false;
      if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
      
      return true;
    });

    return filtered.sort((a, b) => {
      const { key, direction } = sortConfig;
      const dir = direction === 'asc' ? 1 : -1;
      let aValue: string | number = a[key];
      let bValue: string | number = b[key];

      if (key === 'timestamp') {
        aValue = new Date(a.timestamp).getTime();
        bValue = new Date(b.timestamp).getTime();
        return (aValue - bValue) * dir;
      }

      if (aValue < bValue) return -1 * dir;
      if (aValue > bValue) return 1 * dir;
      return 0;
    });
  }, [logs, startDate, endDate, userFilter, actionFilter, sortConfig]);

  const pageCount = Math.ceil(sortedLogs.length / itemsPerPage);
  const paginatedLogs = useMemo(() => {
      const validCurrentPage = Math.max(1, Math.min(currentPage, pageCount || 1));
      const startIndex = (validCurrentPage - 1) * itemsPerPage;
      return sortedLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedLogs, currentPage, itemsPerPage, pageCount]);

  const handleReset = () => {
    setTableState(s => ({
      ...s,
      startDate: '',
      endDate: '',
      userFilter: '',
      actionFilter: '',
      currentPage: 1,
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

  const isFiltered = startDate || endDate || userFilter || actionFilter;

  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    setTableState(current => {
      const newPage = typeof page === 'function' ? page(current.currentPage) : page;
      return { ...current, currentPage: newPage };
    });
  };

  const handleFilterChange = (field: keyof AuditLogTableState, value: string) => {
    setTableState(s => ({ ...s, [field]: value, currentPage: 1 }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 md:p-6 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
           <div>
              <label htmlFor="actionFilter" className="block text-sm font-medium text-gray-600 mb-1">Action</label>
              <input type="text" id="actionFilter" value={actionFilter} onChange={e => handleFilterChange('actionFilter', e.target.value)} className="w-full py-2 px-3 border rounded-lg bg-gray-700 text-white border-gray-600 placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500" placeholder="e.g., 'Created Product'"/>
          </div>
          <div>
            <label htmlFor="userFilter" className="block text-sm font-medium text-gray-600 mb-1">User</label>
            <select id="userFilter" value={userFilter} onChange={e => handleFilterChange('userFilter', e.target.value)} className="w-full border rounded-lg py-2 px-3 bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500">
              <option value="">All Users</option>
              {usersList.map(u => <option key={u} value={u} className="capitalize">{u}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="logStartDate" className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
            <input type="text" id="logStartDate" value={startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="w-full py-2 px-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          <div>
            <label htmlFor="logEndDate" className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
            <input type="text" id="logEndDate" value={endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="w-full py-2 px-3 border rounded-lg bg-gray-700 text-white border-gray-600 focus:ring-primary-500 focus:border-primary-500" placeholder="dd/mm/yyyy" />
          </div>
          {isFiltered && (
            <div className="lg:col-start-4">
                <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                <XMarkIcon className="h-4 w-4" />
                <span>Reset Filters</span>
                </button>
            </div>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600 border-collapse border-t border-gray-300">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 hidden md:table-header-group">
            <tr>
              <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('timestamp')} className="flex items-center gap-1.5">Timestamp {getSortIcon('timestamp')}</button></th>
              <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('user')} className="flex items-center gap-1.5">User {getSortIcon('user')}</button></th>
              <th scope="col" className="px-6 py-3"><button onClick={() => requestSort('action')} className="flex items-center gap-1.5">Action {getSortIcon('action')}</button></th>
              <th scope="col" className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.map(log => (
              <tr key={log.id} className="block md:table-row bg-white hover:bg-gray-50 border-b">
                <td className="px-6 py-4 block md:table-cell" data-label="Timestamp">{formatDate(log.timestamp)} <span className="text-gray-400 text-xs">{new Date(log.timestamp).toLocaleTimeString('id-ID')}</span></td>
                <td className="px-6 py-4 font-semibold text-gray-900 block md:table-cell capitalize" data-label="User">{log.user}</td>
                <td className="px-6 py-4 block md:table-cell" data-label="Action">{log.action}</td>
                <td className="px-6 py-4 block md:table-cell" data-label="Details">{log.details}</td>
              </tr>
            ))}
            {sortedLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-16 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <ClipboardDocumentListIcon className="h-16 w-16 text-gray-300 mb-3" />
                    <p className="font-semibold text-lg">No audit logs found.</p>
                    <p>{isFiltered ? 'Try adjusting your filters.' : 'System actions will be recorded here.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {pageCount > 1 && (
        <div className="p-4 flex items-center justify-center space-x-2 bg-white border-t border-gray-200">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50">Previous</button>
          <span className="text-sm text-gray-600">Page {currentPage} of {pageCount}</span>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, pageCount))} disabled={currentPage === pageCount} className="px-3 py-1 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-600 disabled:opacity-50 hover:bg-gray-50">Next</button>
        </div>
      )}
       <style>{`
        @media (max-width: 767px) {
          tbody tr { padding: 1rem 0; }
          tbody td { display: flex; justify-content: space-between; align-items: center; padding-left: 1.5rem; padding-right: 1.5rem; text-align: right; }
          tbody td[data-label]::before { content: attr(data-label); font-weight: 600; text-align: left; margin-right: 1rem; }
        }
      `}</style>
    </div>
  );
};

export default AuditLogComponent;
