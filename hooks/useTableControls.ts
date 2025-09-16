import { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, SortDirection, ProductKey, Vendor } from '../types';

const TABLE_STATE_KEY = 'stockerz_product_table_state_v1';

interface TableState {
  searchTerm: string;
  categoryFilter: string;
  sortConfig: { key: ProductKey; direction: SortDirection } | null;
  currentPage: number;
}

const getInitialState = (initialSearch: string): TableState => {
  try {
    const item = window.localStorage.getItem(TABLE_STATE_KEY);
    if (item) {
      const parsed = JSON.parse(item);
      // Basic validation to ensure it has the right shape
      return {
        searchTerm: initialSearch || parsed.searchTerm || '',
        categoryFilter: parsed.categoryFilter || 'all',
        sortConfig: parsed.sortConfig || { key: 'lastUpdated', direction: 'desc' },
        currentPage: parsed.currentPage || 1,
      };
    }
  } catch (error) {
    console.warn("Could not parse table state from localStorage", error);
  }
  // Return default state if nothing is in localStorage or if there was an error
  return {
    searchTerm: initialSearch || '',
    categoryFilter: 'all',
    sortConfig: { key: 'lastUpdated', direction: 'desc' }, // A sensible default
    currentPage: 1,
  };
};

export const useTableControls = (initialData: Product[], itemsPerPage: number, vendors: Vendor[], initialSearchTerm: string = '') => {
  const [tableState, setTableState] = useState<TableState>(getInitialState(initialSearchTerm));

  useEffect(() => {
    if (initialSearchTerm) {
      setTableState(s => ({...s, searchTerm: initialSearchTerm}));
    }
  }, [initialSearchTerm]);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    try {
      window.localStorage.setItem(TABLE_STATE_KEY, JSON.stringify(tableState));
    } catch (error) {
      console.error("Could not save table state to localStorage", error);
    }
  }, [tableState]);

  const categories = useMemo(() => ['all', ...Array.from(new Set(initialData.map(p => p.category)))], [initialData]);

  const vendorsMap = useMemo(() => new Map(vendors.map(v => [v.id, v.name])), [vendors]);

  const filteredData = useMemo(() => {
    return initialData.filter(product => {
      const matchesSearch = tableState.searchTerm ? (
        product.name.toLowerCase().includes(tableState.searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(tableState.searchTerm.toLowerCase())
      ) : true;
      const matchesCategory = tableState.categoryFilter === 'all' || product.category === tableState.categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [initialData, tableState.searchTerm, tableState.categoryFilter]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (tableState.sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const { key, direction } = tableState.sortConfig!;
        
        let aValue: string | number;
        let bValue: string | number;

        if (key === 'supplierId') {
            aValue = vendorsMap.get(a.supplierId) || '';
            bValue = vendorsMap.get(b.supplierId) || '';
        } else {
            aValue = a[key] ?? '';
            bValue = b[key] ?? '';
        }

        // Case-insensitive sort for strings
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const lowerA = aValue.toLowerCase();
          const lowerB = bValue.toLowerCase();
          if (lowerA < lowerB) return direction === 'asc' ? -1 : 1;
          if (lowerA > lowerB) return direction === 'asc' ? 1 : -1;
          return 0;
        }

        // Default numeric/date sort
        if (aValue < bValue) {
          return direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, tableState.sortConfig, vendorsMap]);

  const requestSort = useCallback((key: ProductKey) => {
    setTableState(current => {
      let direction: SortDirection = 'asc';
      if (current.sortConfig && current.sortConfig.key === key && current.sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      return { ...current, sortConfig: { key, direction } };
    });
  }, []);

  const pageCount = Math.ceil(sortedData.length / itemsPerPage);
  
    // Effect to reset to page 1 if filters change and current page becomes invalid
  useEffect(() => {
      if(tableState.currentPage > pageCount && pageCount > 0){
          setTableState(s => ({...s, currentPage: 1}));
      }
  }, [tableState.currentPage, pageCount]);

  const paginatedData = useMemo(() => {
    // Ensure currentPage is valid
    const validCurrentPage = Math.max(1, Math.min(tableState.currentPage, pageCount || 1));
    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    return sortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedData, tableState.currentPage, itemsPerPage, pageCount]);

  const setSearchTerm = useCallback((term: string) => {
    setTableState(current => ({ ...current, searchTerm: term, currentPage: 1 }));
  }, []);

  const setCategoryFilter = useCallback((category: string) => {
    setTableState(current => ({ ...current, categoryFilter: category, currentPage: 1 }));
  }, []);
  
  const setCurrentPage = useCallback((page: number | ((prev: number) => number)) => {
    setTableState(current => {
      const newPage = typeof page === 'function' ? page(current.currentPage) : page;
      return { ...current, currentPage: newPage };
    });
  }, []);

  const resetFilters = useCallback(() => {
    setTableState({
      searchTerm: '',
      categoryFilter: 'all',
      sortConfig: { key: 'lastUpdated', direction: 'desc' },
      currentPage: 1,
    });
  }, []);

  return {
    paginatedData,
    searchTerm: tableState.searchTerm,
    setSearchTerm,
    categoryFilter: tableState.categoryFilter,
    setCategoryFilter,
    categories,
    requestSort,
    sortConfig: tableState.sortConfig,
    currentPage: tableState.currentPage,
    setCurrentPage,
    pageCount,
    resetFilters,
  };
};