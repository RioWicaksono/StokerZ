


import React, { useState, useMemo, useEffect } from 'react';
import { Request, UserRole } from '../types';
import { formatDate, formatNumber } from '../utils/helpers';
import { CheckIcon, XMarkIcon, RequestIcon as NoDataIcon, SortIcon, SortUpIcon, SortDownIcon, CubeIcon } from './icons/Icons';

interface RequestListProps {
  requests: Request[];
  onApprove: (request: Request) => void;
  onReject: (request: Request) => void;
  onViewDetails: (request: Request) => void;
  onMarkAsCollected: (request: Request) => void;
  userRole?: UserRole;
}

const getStatusBadge = (status: Request['status']) => {
  switch (status) {
    case 'Pending Approval':
      return 'bg-amber-100 text-amber-800';
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'Rejected':
      return 'bg-red-100 text-red-800';
    case 'Collected':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
};

const getPriorityBadge = (priority: Request['priority']) => {
  switch (priority) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-amber-100 text-amber-800';
    case 'Low':
      return 'bg-sky-100 text-sky-800';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

type SortKey = 'requestDate' | 'priority';
type SortDirection = 'asc' | 'desc';
type ActiveTab = 'history' | 'pickup';

const REQUEST_TABLE_STATE_KEY = 'stockerz_request_table_state_v1';

interface RequestTableState {
  startDate: string;
  endDate: string;
  statusFilter: Request['status'] | 'all';
  sortConfig: { key: SortKey; direction: SortDirection };
  activeTab: ActiveTab;
}

const getInitialState = (): RequestTableState => {
  try {
    const item = window.localStorage.getItem(REQUEST_TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      return {
        startDate: parsed.startDate || '',
        endDate: parsed.endDate || '',
        statusFilter: parsed.statusFilter || 'all',
        sortConfig: parsed.sortConfig || { key: 'requestDate', direction: 'desc' },
        activeTab: parsed.activeTab || 'history',
      };
    }
  } catch (error) {
    console.warn("Could not parse request table state from localStorage", error);
  }
  return {
    startDate: '',
    endDate: '',
    statusFilter: 'all',
    sortConfig: { key: 'requestDate', direction: 'desc' },
    activeTab: 'history',
  };
};

const APPROVER_ROLES: UserRole[] = ['Supervisor', 'Manager', 'Super Admin'];
const COLLECTOR_ROLES: UserRole[] = ['Staff', 'Supervisor', 'Manager', 'Super Admin'];

const RequestList: React.FC<RequestListProps> = ({ requests, onApprove, onReject, onViewDetails, onMarkAsCollected, userRole }) => {
  const [tableState, setTableState] = useState<RequestTableState>(getInitialState);
  const { startDate, endDate, statusFilter, sortConfig, activeTab } = tableState;

  useEffect(() => {
    try {
      window.localStorage.setItem(REQUEST_TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save request table state to localStorage", error);
    }
  }, [tableState]);

  const canTakeAction = useMemo(() => userRole && APPROVER_ROLES.includes(userRole), [userRole]);
  const canCollect = useMemo(() => userRole && COLLECTOR_ROLES.includes(userRole), [userRole]);
  const priorityOrder: Record<Request['priority'], number> = { High: 3, Medium: 2, Low: 1 };

  const parseDDMMYYYY = (dateString: string): Date | null => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null;
    const parts = dateString.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);

    if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
    }
    return null;
  };

  const sortedRequests = useMemo(() => {
    const filterStartDate = parseDDMMYYYY(startDate);
    const filterEndDate = parseDDMMYYYY(endDate);

    const filtered = requests.filter(request => {
      if (statusFilter !== 'all' && request.status !== statusFilter) {
          return false;
      }
      if (!filterStartDate && !filterEndDate) return true;
      const requestDate = new Date(request.requestDate);
      if (filterStartDate) {
        filterStartDate.setHours(0, 0, 0, 0);
        if (requestDate < filterStartDate) return false;
      }
      if (filterEndDate) {
        filterEndDate.setHours(23, 59, 59, 999);
        if (requestDate > filterEndDate) return false;
      }
      return true;
    });
    
    return filtered.sort((a, b) => {
        const { key, direction } = sortConfig;
        const dir = direction === 'asc' ? 1 : -1;

        if (key === 'priority') {
            return (priorityOrder[a.priority] - priorityOrder[b.priority]) * dir;
        }
        // default to requestDate
        return (new Date(a.requestDate).getTime() - new Date(b.requestDate).getTime()) * dir;
    });

  }, [requests, startDate, endDate, statusFilter, sortConfig]);

  const approvedForPickupList = useMemo(() => sortedRequests.filter(r => r.status === 'Approved'), [sortedRequests]);

  const handleReset = () => {
    setTableState(s => ({
      ...s,
      startDate: '',
      endDate: '',
      statusFilter: 'all',
    }));
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

  const isFiltered = startDate !== '' || endDate !== '' || statusFilter !== 'all';

  const TabButton: React.FC<{ tabId: ActiveTab; label: string; count: number; }> = ({ tabId, label, count }) => (
      <button
        onClick={() => setTableState(s => ({...s, activeTab: tabId}))}
        className={`px-4 py-2 text-sm font-semibold rounded-t-lg border-b-2 transition-colors ${
          activeTab === tabId
            ? 'border-primary-500 text-primary-600'
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
        }`}
      >
        {label}
        {count > 0 && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tabId ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-600'}`}>
                {count}
            </span>
        )}
      </button>
  );

  const StatusButton: React.FC<{ status: Request['status'] | 'all', label: string, current: Request['status'] | 'all', onClick: (status: Request['status'] | 'all') => void }> = ({ status, label, current, onClick }) => {
    const isActive = status === current;
    const baseClasses = "px-3 py-1.5 text-sm font-semibold rounded-md transition-colors";
    const activeClasses = "bg-primary-500 text-white shadow-sm";
    const inactiveClasses = "bg-slate-200 text-slate-700 hover:bg-slate-300";
    return (
        <button onClick={() => onClick(status)} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {label}
        </button>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-4 md:px-6 border-b border-slate-200">
            <div className="flex items-center">
                <TabButton tabId="history" label="All Requests" count={sortedRequests.length} />
                <TabButton tabId="pickup" label="Approved for Pickup" count={approvedForPickupList.length} />
            </div>
        </div>
      {activeTab === 'history' && (
        <div className="p-4 md:p-6 border-b border-slate-200">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-end gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-slate-600 mb-1">
                    Start Date
                    </label>
                    <input
                    type="text"
                    id="startDate"
                    value={startDate}
                    onChange={e => setTableState(s => ({...s, startDate: e.target.value}))}
                    className="w-full border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter start date"
                    placeholder="dd/mm/yyyy"
                    />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-slate-600 mb-1">
                    End Date
                    </label>
                    <input
                    type="text"
                    id="endDate"
                    value={endDate}
                    onChange={e => setTableState(s => ({...s, endDate: e.target.value}))}
                    className="w-full border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 focus:ring-primary-500 focus:border-primary-500"
                    aria-label="Filter end date"
                    placeholder="dd/mm/yyyy"
                    />
                </div>
                {isFiltered && (
                    <button
                    onClick={handleReset}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                    aria-label="Reset date filter"
                    >
                    <XMarkIcon className="h-4 w-4" />
                    <span>Reset</span>
                    </button>
                )}
              </div>
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Filter by Status</label>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusButton status="all" label="All" current={statusFilter} onClick={(status) => setTableState(s => ({...s, statusFilter: status}))} />
                    <StatusButton status="Pending Approval" label="Pending" current={statusFilter} onClick={(status) => setTableState(s => ({...s, statusFilter: status}))} />
                    <StatusButton status="Approved" label="Approved" current={statusFilter} onClick={(status) => setTableState(s => ({...s, statusFilter: status}))} />
                    <StatusButton status="Rejected" label="Rejected" current={statusFilter} onClick={(status) => setTableState(s => ({...s, statusFilter: status}))} />
                    <StatusButton status="Collected" label="Collected" current={statusFilter} onClick={(status) => setTableState(s => ({...s, statusFilter: status}))} />
                </div>
              </div>
            </div>
        </div>
      )}
      <div className="overflow-x-auto">
        {activeTab === 'history' ? (
          <table className="w-full text-sm text-left text-slate-600 border-collapse border-t border-slate-300">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
                <tr>
                <th scope="col" className="px-6 py-3 border-b border-slate-300">Requesting Division</th>
                <th scope="col" className="px-6 py-3 border-b border-slate-300">Product</th>
                <th scope="col" className="px-6 py-3 text-right border-b border-slate-300">Quantity</th>
                <th scope="col" className="px-6 py-3 border-b border-slate-300">
                    <button onClick={() => requestSort('requestDate')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                        Date {getSortIcon('requestDate')}
                    </button>
                </th>
                <th scope="col" className="px-6 py-3 border-b border-slate-300">
                    <button onClick={() => requestSort('priority')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                        Priority {getSortIcon('priority')}
                    </button>
                </th>
                <th scope="col" className="px-6 py-3 border-b border-slate-300">Status</th>
                <th scope="col" className="px-6 py-3 text-center border-b border-slate-300">Actions</th>
                </tr>
            </thead>
            <tbody>
                {sortedRequests.map(request => (
                <tr 
                    key={request.id} 
                    className="block md:table-row bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onViewDetails(request)}
                >
                    <td className="px-6 py-4 font-semibold text-slate-900 block md:table-cell border-b border-slate-300" data-label="Division">{request.requestingDivision}</td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300" data-label="Product">{request.productName}</td>
                    <td className="px-6 py-4 text-left md:text-right font-medium block md:table-cell border-b border-slate-300" data-label="Quantity">{formatNumber(request.quantity)}</td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300" data-label="Date">{formatDate(request.requestDate)}</td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300" data-label="Priority">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(request.priority)}`}>
                        {request.priority}
                    </span>
                    </td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300" data-label="Status">
                    <span key={request.status} className={`px-2 py-1 text-xs font-semibold rounded-full animate-pop-in ${getStatusBadge(request.status)}`}>
                        {request.status}
                    </span>
                    </td>
                    <td 
                    className="px-6 py-4 flex items-center justify-start md:justify-center space-x-2 md:table-cell border-b border-slate-300"
                    data-label="Actions"
                    onClick={(e) => e.stopPropagation()}
                    >
                    {request.status === 'Pending Approval' ? (
                        canTakeAction ? (
                        <>
                            <button 
                            onClick={() => onApprove(request)} 
                            className="p-1.5 rounded-full text-green-600 bg-green-100 hover:bg-green-200" 
                            aria-label={`Approve request for ${request.productName}`}
                            >
                            <CheckIcon className="w-5 h-5" />
                            </button>
                            <button 
                            onClick={() => onReject(request)} 
                            className="p-1.5 rounded-full text-red-600 bg-red-100 hover:bg-red-200" 
                            aria-label={`Reject request for ${request.productName}`}
                            >
                            <XMarkIcon className="w-5 h-5" />
                            </button>
                        </>
                        ) : (
                        <span className="text-slate-400 text-xs italic">Awaiting Approval</span>
                        )
                    ) : (
                        <span className="text-slate-400 text-xs italic">Completed</span>
                    )}
                    </td>
                </tr>
                ))}
                {sortedRequests.length === 0 && (
                <tr className="md:table-row">
                    <td colSpan={7} className="text-center py-16 text-slate-500 block md:table-cell border-b border-slate-300">
                    <div className="flex flex-col items-center justify-center">
                        <NoDataIcon className="h-16 w-16 text-slate-300 mb-3" />
                        <p className="font-semibold text-lg">No requests found.</p>
                        {requests.length > 0 ? (
                            <p>Try adjusting your filters or reset to view all data.</p>
                        ) : (
                            <p>Create a new request to get started.</p>
                        )}
                    </div>
                    </td>
                </tr>
                )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm text-left text-slate-600 border-collapse border-t border-slate-300">
             <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
                <tr>
                    <th scope="col" className="px-6 py-3 border-b border-slate-300">Product</th>
                    <th scope="col" className="px-6 py-3 text-right border-b border-slate-300">Quantity</th>
                    <th scope="col" className="px-6 py-3 border-b border-slate-300">Requesting Division</th>
                    <th scope="col" className="px-6 py-3 border-b border-slate-300">Approved By</th>
                    <th scope="col" className="px-6 py-3 text-center border-b border-slate-300">Actions</th>
                </tr>
            </thead>
            <tbody>
                {approvedForPickupList.map(request => (
                <tr 
                    key={request.id} 
                    className="block md:table-row bg-white hover:bg-slate-50 transition-colors"
                >
                    <td className="px-6 py-4 font-semibold text-slate-900 block md:table-cell border-b border-slate-300" data-label="Product">{request.productName}</td>
                    <td className="px-6 py-4 text-left md:text-right font-medium block md:table-cell border-b border-slate-300" data-label="Quantity">{formatNumber(request.quantity)}</td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300" data-label="Division">{request.requestingDivision}</td>
                    <td className="px-6 py-4 block md:table-cell border-b border-slate-300 capitalize" data-label="Approved By">{request.approvedBy || 'N/A'}</td>
                    <td className="px-6 py-4 flex items-center justify-start md:justify-center md:table-cell border-b border-slate-300" data-label="Actions">
                    {canCollect ? (
                        <button
                            onClick={() => onMarkAsCollected(request)}
                            className="flex items-center justify-center bg-sky-500 text-white font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-75 transition-all text-xs"
                        >
                            <CubeIcon className="w-4 h-4 mr-1.5" />
                            Mark as Collected
                        </button>
                    ) : <span className="text-slate-400 text-xs italic">Action by Staff</span>}
                    </td>
                </tr>
                ))}
                {approvedForPickupList.length === 0 && (
                <tr className="md:table-row">
                    <td colSpan={5} className="text-center py-16 text-slate-500 block md:table-cell border-b border-slate-300">
                        <div className="flex flex-col items-center justify-center">
                            <CheckIcon className="h-16 w-16 text-slate-300 mb-3" />
                            <p className="font-semibold text-lg">No items are currently waiting for pickup.</p>
                            <p>All approved requests have been collected.</p>
                        </div>
                    </td>
                </tr>
                )}
            </tbody>
          </table>
        )}
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
          tbody tr {
            border-bottom: 2px solid #e2e8f0;
            padding: 1rem 0;
          }
          tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 1.5rem;
            padding-right: 1.5rem;
            text-align: right;
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

export default RequestList;