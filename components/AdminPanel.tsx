import React, { useState, useMemo } from 'react';
import { formatNumber } from '../utils/helpers';
import { CubeIcon, VendorIcon, RequestIcon, WarningIcon, PlusIcon, UserCircleIcon, SortIcon, SortUpIcon, SortDownIcon, ScaleIcon, DeleteIcon, KeyIcon } from './icons/Icons';
import { User, UserRole } from '../types';

interface AdminPanelProps {
  stats: {
    products: number;
    vendors: number;
    requests: number;
    adjustments: number;
  };
  users: User[];
  currentUser: User;
  onAddUser: () => void;
  onUpdateUserRole: (user: User, role: UserRole) => void;
  onResetData: () => void;
  onClearData: () => void;
  onDeleteUser: (user: User) => void;
  onResetPassword: (user: User) => void;
}

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; }> = ({ icon, title, value }) => (
    <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-xl font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);

type SortableUserKey = 'username' | 'role';
type SortDirection = 'asc' | 'desc';

const AdminPanel: React.FC<AdminPanelProps> = ({ stats, users, currentUser, onAddUser, onUpdateUserRole, onResetData, onClearData, onDeleteUser, onResetPassword }) => {
  const [sortConfig, setSortConfig] = useState<{ key: SortableUserKey; direction: SortDirection }>({ key: 'username', direction: 'asc' });

  const sortedUsers = useMemo(() => {
    let sortableItems = [...users];
    if (sortConfig) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [users, sortConfig]);

  const requestSort = (key: SortableUserKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortableUserKey) => {
    if (sortConfig.key !== key) {
      return <SortIcon className="h-4 w-4 text-gray-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    }
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };


  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto">
      
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Application Stats</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={<CubeIcon className="w-8 h-8 text-primary-500" />} title="Total Products" value={formatNumber(stats.products)} />
          <StatCard icon={<VendorIcon className="w-8 h-8 text-sky-500" />} title="Total Vendors" value={formatNumber(stats.vendors)} />
          <StatCard icon={<RequestIcon className="w-8 h-8 text-emerald-500" />} title="Total Requests" value={formatNumber(stats.requests)} />
          <StatCard icon={<ScaleIcon className="w-8 h-8 text-violet-500" />} title="Total Adjustments" value={formatNumber(stats.adjustments)} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">User Management</h2>
          <button
              onClick={onAddUser}
              className="mt-3 md:mt-0 flex items-center justify-center bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200"
          >
              <PlusIcon className="w-5 h-5 mr-2" />
              <span>Add New User</span>
          </button>
        </div>
        <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-gray-600">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3">
                           <button onClick={() => requestSort('username')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                                Username
                                {getSortIcon('username')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3">
                            <button onClick={() => requestSort('role')} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                                Role
                                {getSortIcon('role')}
                            </button>
                        </th>
                        <th scope="col" className="px-6 py-3">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedUsers.map(user => {
                      const isCurrentUser = currentUser.id === user.id;
                      const isTargetSuperAdmin = user.role === 'Super Admin';
                      const canModify = currentUser.role === 'Super Admin' || (currentUser.role === 'Manager' && !isTargetSuperAdmin);
                      const canDelete = canModify && !isCurrentUser;

                      return (
                        <tr key={user.id} className="bg-white border-b">
                            <td className="px-6 py-4 font-medium text-gray-900 flex items-center">
                                {user.profilePictureUrl ? (
                                    <img src={user.profilePictureUrl} alt={user.username} className="w-8 h-8 object-cover rounded-full bg-slate-200 mr-3" />
                                ) : (
                                    <UserCircleIcon className="w-8 h-8 text-gray-400 mr-3" />
                                )}
                                <span className="capitalize">{user.username}</span>
                            </td>
                            <td className="px-6 py-4">
                               <select
                                  value={user.role}
                                  onChange={(e) => onUpdateUserRole(user, e.target.value as UserRole)}
                                  disabled={!canModify || isCurrentUser}
                                  className="w-full max-w-[150px] border rounded-lg p-2 bg-gray-50 border-gray-300 disabled:bg-gray-200 disabled:cursor-not-allowed focus:ring-primary-500 focus:border-primary-500"
                                  aria-label={`Role for ${user.username}`}
                                >
                                  <option value="Viewer">Viewer</option>
                                  <option value="Staff">Staff</option>
                                  <option value="Supervisor">Supervisor</option>
                                  <option value="Manager">Manager</option>
                                  {(user.role === 'Super Admin' || currentUser.role === 'Super Admin') && (
                                    <option value="Super Admin">Super Admin</option>
                                  )}
                                </select>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => onResetPassword(user)}
                                        disabled={!canModify}
                                        className="text-sky-600 hover:text-sky-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title="Reset Password"
                                        aria-label={`Reset password for ${user.username}`}
                                    >
                                        <KeyIcon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => onDeleteUser(user)}
                                        disabled={!canDelete}
                                        className="text-red-600 hover:text-red-800 disabled:text-gray-300 disabled:cursor-not-allowed"
                                        title="Delete User"
                                        aria-label={`Delete user ${user.username}`}
                                    >
                                        <DeleteIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                      );
                    })}
                </tbody>
            </table>
        </div>
      </div>
      
      {['Manager', 'Super Admin'].includes(currentUser.role) && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-amber-300">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Data Management</h2>
          <p className="text-sm text-gray-500 mb-6">Perform administrative actions on the application's data. These actions are irreversible.</p>
          
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-800">Reset Application Data</h3>
                <p className="text-sm text-gray-600 mt-1 max-w-lg">Restore the application to its initial demo state. All current products, vendors, and requests will be deleted and replaced with the default mock data.</p>
              </div>
              <button
                onClick={onResetData}
                className="mt-3 md:mt-0 md:ml-4 flex-shrink-0 px-4 py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
              >
                Reset Data
              </button>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg">
              <div>
                <h3 className="font-semibold text-red-800 flex items-center gap-2"><WarningIcon className="w-5 h-5"/>Clear All Application Data</h3>
                <p className="text-sm text-red-700 mt-1 max-w-lg">Permanently delete all products, vendors, and requests from the database. This action is irreversible and will result in an empty application state.</p>
              </div>
              <button
                onClick={onClearData}
                className="mt-3 md:mt-0 md:ml-4 flex-shrink-0 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
