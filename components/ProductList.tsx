

import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Product, ProductKey, Vendor, User } from '../types';
import { formatCurrency, formatDate, formatNumber } from '../utils/helpers';
import { useTableControls } from '../hooks/useTableControls';
import { EditIcon, DeleteIcon, SearchIcon, SortIcon, SortUpIcon, SortDownIcon, XMarkIcon, PlusIcon, InventoryIcon, ChevronDownIcon, DownloadIcon } from './icons/Icons';

interface BarcodeIconProps extends React.SVGProps<SVGSVGElement> {}

const BarcodeIcon: React.FC<BarcodeIconProps> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5A.75.75 0 014.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5h.01M8.25 12h7.5m-7.5 4.5h7.5m-7.5-9v9m3-9v9m1.5-9v9m1.5-9v9m1.5-9v9m1.5-9v9" />
  </svg>
);


interface ProductListProps {
  products: Product[];
  vendors: Vendor[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onAddProduct: () => void;
  isLoading: boolean;
  onBulkDelete: (productIds: string[]) => void;
  currentUser: User;
  itemsBeingDeleted: Set<string>;
  onOpenBarcodeScanner: () => void;
  initialSearchTerm: string;
  recentlyUpdatedProductId: string | null;
}

const ProductList: React.FC<ProductListProps> = ({ products, vendors, onEditProduct, onDeleteProduct, onAddProduct, isLoading, onBulkDelete, currentUser, itemsBeingDeleted, onOpenBarcodeScanner, initialSearchTerm, recentlyUpdatedProductId }) => {
  const {
    paginatedData,
    searchTerm,
    setSearchTerm,
    categoryFilter,
    setCategoryFilter,
    categories,
    requestSort,
    sortConfig,
    currentPage,
    setCurrentPage,
    pageCount,
    resetFilters,
  } = useTableControls(products, 10, vendors, initialSearchTerm);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);
  const canPerformActions = useMemo(() => ['Supervisor', 'Manager', 'Super Admin'].includes(currentUser.role), [currentUser.role]);
  
  // Effect to clear selection when filters/page change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [searchTerm, categoryFilter, currentPage, products]);

  // Effect for closing dropdown on outside click
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
          setSelectedIds(new Set(paginatedData.map(p => p.id)));
      } else {
          setSelectedIds(new Set());
      }
  }, [paginatedData]);

  const isAllSelected = paginatedData.length > 0 && selectedIds.size === paginatedData.length;

  const vendorsMap = useMemo(() => new Map(vendors.map(v => [v.id, v.name])), [vendors]);
  
  const getSortIcon = (key: ProductKey) => {
    if (sortConfig?.key !== key) {
      return <SortIcon className="h-4 w-4 text-slate-400" />;
    }
    if (sortConfig.direction === 'asc') {
      return <SortUpIcon className="h-4 w-4 text-primary-500" />;
    }
    return <SortDownIcon className="h-4 w-4 text-primary-500" />;
  };

  const handleExportCSV = (selectedOnly = false) => {
    const dataToExport = selectedOnly ? products.filter(p => selectedIds.has(p.id)) : products;
    if (dataToExport.length === 0) return;

    const headers = "ID,Product Name,SKU,Category,Quantity,Price,Location,Supplier,Last Updated,Modified By\n";
    const csvContent = dataToExport.map(p => 
        [
            p.id,
            `"${p.name.replace(/"/g, '""')}"`,
            p.sku,
            p.category,
            p.quantity,
            p.price,
            p.location,
            `"${(vendorsMap.get(p.supplierId) || 'N/A').replace(/"/g, '""')}"`,
            p.lastUpdated,
            p.lastModifiedBy || ''
        ].join(',')
    ).join('\n');
    
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `product_inventory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tableHeaders: { key: string; label: string; isSortable: boolean; className?: string }[] = useMemo(() => {
    const baseHeaders: { key: string; label: string; isSortable: boolean; className?: string }[] = [
      { key: 'image', label: '', isSortable: false, className: 'w-20' },
      { key: 'name', label: 'Product', isSortable: true },
      { key: 'sku', label: 'SKU', isSortable: false },
      { key: 'category', label: 'Category', isSortable: true },
      { key: 'quantity', label: 'Quantity', isSortable: true, className: 'text-right' },
      { key: 'price', label: 'Price', isSortable: true, className: 'text-right' },
      { key: 'location', label: 'Location', isSortable: false },
      { key: 'supplierId', label: 'Supplier', isSortable: true },
      { key: 'lastUpdated', label: 'Updated', isSortable: true },
      { key: 'lastModifiedBy', label: 'Modified By', isSortable: true },
    ];
    if (canPerformActions) {
      baseHeaders.push({ key: 'id', label: 'Actions', isSortable: false, className: 'text-center' });
    }
    return baseHeaders;
  }, [canPerformActions]);
  
  const isFiltered = searchTerm !== '' || categoryFilter !== 'all';

  const SkeletonRow = () => (
    <tr className="block md:table-row">
      {canPerformActions && <td className="px-6 py-4 block md:table-cell border border-slate-300"><div className="h-5 w-5 bg-slate-300 rounded"></div></td>}
      <td className="px-6 py-2 block md:table-cell border border-slate-300"><div className="w-12 h-12 bg-slate-300 rounded-md"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Product"><div className="h-4 bg-slate-300 rounded w-3/4"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="SKU"><div className="h-4 bg-slate-300 rounded w-1/2"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Category"><div className="h-6 bg-slate-300 rounded-full w-24"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300"><div className="h-4 bg-slate-300 rounded w-1/4 ml-auto md:ml-0"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300"><div className="h-4 bg-slate-300 rounded w-1/3 ml-auto md:ml-0"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Location"><div className="h-4 bg-slate-300 rounded w-1/4"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Supplier"><div className="h-4 bg-slate-300 rounded w-2/3"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Updated"><div className="h-4 bg-slate-300 rounded w-1/2"></div></td>
      <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Modified By"><div className="h-4 bg-slate-300 rounded w-1/2"></div></td>
      {canPerformActions && <td className="px-6 py-4 flex items-center justify-start md:justify-center space-x-2 md:table-cell border border-slate-300" data-label="Actions">
          <div className="h-5 w-5 bg-slate-300 rounded"></div>
          <div className="h-5 w-5 bg-slate-300 rounded"></div>
      </td>}
    </tr>
  );

  if (isLoading) {
      return (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
              <div className="p-4 md:p-6 border-b border-slate-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="h-10 bg-slate-300 rounded-lg flex-1"></div>
                      <div className="flex items-center gap-4 flex-wrap">
                          <div className="h-10 bg-slate-300 rounded-lg w-40"></div>
                          <div className="h-10 bg-slate-300 rounded-lg w-28"></div>
                      </div>
                  </div>
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-600 border-collapse border border-slate-300">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 hidden md:table-header-group">
                           <tr>
                              {canPerformActions && <th className="px-6 py-3 border border-slate-300"><div className="h-4 bg-slate-300 rounded w-5"></div></th>}
                              {tableHeaders.map(header => (
                                  <th key={header.key} scope="col" className={`px-6 py-3 border border-slate-300 ${header.className || ''}`}>
                                      { header.label ? <div className={`h-4 bg-slate-300 rounded ${header.key === 'name' ? 'w-3/4' : 'w-1/2'}`}></div> : null }
                                  </th>
                              ))}
                          </tr>
                      </thead>
                      <tbody>
                          {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
                      </tbody>
                  </table>
              </div>
          </div>
      );
  }

  if (products.length === 0 && !isFiltered) {
    return (
        <div className="text-center bg-white p-12 rounded-xl shadow-lg">
            <InventoryIcon className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800">No products found</h3>
            <p className="mt-2 text-slate-500">There are currently no products in the inventory. Add one to get started.</p>
            {canPerformActions && <div className="mt-6">
                <button
                    onClick={onAddProduct}
                    className="flex items-center justify-center mx-auto bg-primary-500 text-white font-semibold px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-75 transition-all duration-200"
                >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    <span>Add New Product</span>
                </button>
            </div>}
        </div>
    );
  }

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
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg bg-slate-50 border-slate-300 placeholder-slate-400 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <button
                onClick={onOpenBarcodeScanner}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Scan barcode"
              >
                <BarcodeIcon className="h-5 w-5" />
                <span>Scan Barcode</span>
            </button>
            <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="w-full md:w-auto border rounded-lg py-2 px-3 bg-slate-50 border-slate-300 text-slate-700 focus:ring-primary-500 focus:border-primary-500"
            >
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</option>)}
            </select>
            {isFiltered && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Reset filters"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Reset Filters</span>
              </button>
            )}
            <button
              onClick={() => handleExportCSV(false)}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Export All
            </button>
          </div>
        </div>
      </div>
      {canPerformActions && selectedIds.size > 0 && (
          <div className="px-4 md:px-6 py-3 bg-sky-50 border-b border-sky-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <span className="text-sm font-semibold text-sky-800">
                  {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
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
                                    handleExportCSV(true);
                                    setIsActionsMenuOpen(false);
                                }}
                                className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                                role="menuitem"
                            >
                                <DownloadIcon className="w-4 h-4" />
                                <span>Export Selected</span>
                            </button>
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
                      aria-label="Select all items on this page"
                  />
              </th>}
              {tableHeaders.map(header => (
                <th key={header.key} scope="col" className={`px-6 py-3 border border-slate-300 ${header.className || ''}`}>
                  {header.isSortable ? (
                    <button onClick={() => requestSort(header.key as ProductKey)} className="flex items-center gap-1.5 hover:text-primary-600 transition-colors">
                      {header.label}
                      {getSortIcon(header.key as ProductKey)}
                    </button>
                  ) : (
                    header.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map(product => (
              <tr 
                key={product.id} 
                className={`block md:table-row transition-all duration-300 ${canPerformActions && selectedIds.has(product.id) ? 'bg-sky-100' : ''} ${
                  product.quantity < 5 
                    ? `bg-amber-50 ${canPerformActions && selectedIds.has(product.id) ? 'hover:bg-sky-200' : 'hover:bg-amber-100'}` 
                    : `bg-white ${canPerformActions && selectedIds.has(product.id) ? 'hover:bg-sky-200' : 'hover:bg-slate-50'}`
                } ${itemsBeingDeleted.has(product.id) ? 'animate-fade-out-shrink' : ''} ${recentlyUpdatedProductId === product.id ? 'animate-row-highlight' : ''}`}
              >
                 {canPerformActions && <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Select">
                    <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => handleSelectOne(product.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-slate-400 text-primary-600 focus:ring-primary-500"
                        aria-label={`Select ${product.name}`}
                    />
                </td>}
                <td className="px-6 py-2 block md:table-cell border border-slate-300" data-label="Image">
                  {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-cover rounded-md bg-slate-100" />
                  ) : (
                      <div className="w-12 h-12 flex items-center justify-center bg-slate-100 rounded-md">
                          <InventoryIcon className="w-6 h-6 text-slate-400" />
                      </div>
                  )}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-900 block md:table-cell border border-slate-300" data-label="Product">{product.name}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="SKU">{product.sku}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Category">
                  <span className="px-2 py-1 text-xs font-medium text-primary-800 bg-primary-100 rounded-full">{product.category}</span>
                </td>
                <td className="px-6 py-4 text-left md:text-right block md:table-cell border border-slate-300" data-label="Quantity">
                  {product.quantity < 5 ? (
                    <span className="font-bold text-red-600">{formatNumber(product.quantity)}</span>
                  ) : (
                    formatNumber(product.quantity)
                  )}
                </td>
                <td className="px-6 py-4 text-left md:text-right block md:table-cell border border-slate-300" data-label="Price">{formatCurrency(product.price, 'IDR')}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Location">{product.location}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Supplier">{vendorsMap.get(product.supplierId) || 'N/A'}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300" data-label="Updated">{formatDate(product.lastUpdated)}</td>
                <td className="px-6 py-4 block md:table-cell border border-slate-300 capitalize" data-label="Modified By">{product.lastModifiedBy || 'N/A'}</td>
                {canPerformActions && <td className="px-6 py-4 flex items-center justify-start md:justify-center space-x-2 md:table-cell border border-slate-300" data-label="Actions">
                  <button onClick={() => onEditProduct(product)} className="text-primary-600 hover:text-primary-800 p-1" aria-label={`Edit ${product.name}`}>
                    <EditIcon className="w-5 h-5" />
                  </button>
                  <button onClick={() => onDeleteProduct(product)} className="text-red-500 hover:text-red-700 p-1" aria-label={`Delete ${product.name}`}>
                    <DeleteIcon className="w-5 h-5" />
                  </button>
                </td>}
              </tr>
            ))}
             {paginatedData.length === 0 && (
              <tr className="md:table-row">
                <td colSpan={tableHeaders.length + (canPerformActions ? 1 : 0)} className="text-center py-10 text-slate-500 block md:table-cell border border-slate-300">
                  No products match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
       {pageCount > 1 && (
        <div className="p-4 flex items-center justify-center space-x-2 bg-white border-t border-slate-200">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md bg-white border border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {currentPage} of {pageCount}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
            disabled={currentPage === pageCount}
            className="px-3 py-1 rounded-md bg-white border border-slate-300 text-sm font-medium text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            Next
          </button>
        </div>
      )}
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

        @keyframes row-highlight {
            0% { background-color: rgba(251, 191, 36, 0.4); }
            100% { background-color: transparent; }
        }
        .animate-row-highlight {
            animation: row-highlight 2s ease-out;
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

export default ProductList;