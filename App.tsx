import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Product, View, ToastMessage, Vendor, Request, RequestStatus, User, UserRole, PurchaseOrder, PurchaseOrderStatus, AuditLog, StockAdjustment } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import VendorList from './components/VendorList';
import ProductFormModal from './components/ProductFormModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ToastContainer from './components/Toast';
import VendorFormModal from './components/VendorFormModal';
import VendorDetailModal from './components/VendorDetailModal';
import ConfirmDeleteVendorModal from './components/ConfirmDeleteVendorModal';
import RequestList from './components/RequestList';
import RequestFormModal from './components/RequestFormModal';
import ConfirmApproveModal from './components/ConfirmApproveModal';
import ConfirmRejectModal from './components/ConfirmRejectModal';
import ConfirmCollectedModal from './components/ConfirmCollectedModal';
import RequestDetailModal from './components/RequestDetailModal';
import AdminPanel from './components/AdminPanel';
import ConfirmAdminActionModal from './components/ConfirmAdminActionModal';
import AddUserModal from './components/AddUserModal';
import PurchaseOrderList from './components/PurchaseOrderList';
import PurchaseOrderFormModal from './components/PurchaseOrderFormModal';
import ConfirmApprovePOModal from './components/ConfirmApprovePOModal';
import ConfirmRejectPOModal from './components/ConfirmRejectPOModal';
import PurchaseOrderDetailModal from './components/PurchaseOrderDetailModal';
import Reports from './components/Reports';
import AuditLogComponent from './components/AuditLog';
import StockAdjustmentList from './components/StockAdjustmentList';
import StockAdjustmentFormModal from './components/StockAdjustmentFormModal';
import LoginPage from './components/LoginPage';
import { supabase } from './utils/supabase';
import { LoadingIcon } from './components/icons/Icons';
import ConfirmBulkDeleteModal from './components/ConfirmBulkDeleteModal';
import ConfirmBulkDeleteVendorModal from './components/ConfirmBulkDeleteVendorModal';
import ConfirmRoleChangeModal from './components/ConfirmRoleChangeModal';
import ConfirmLogoutModal from './components/ConfirmLogoutModal';
import Footer from './components/Footer';
import ConfirmReceivedPOModal from './components/ConfirmReceivedPOModal';
import ProfileSettingsModal from './components/ProfileSettingsModal';
import OnboardingTour from './components/OnboardingTour';
import StartTourModal from './components/StartTourModal';
import BarcodeScannerModal from './components/BarcodeScannerModal';
import type { RealtimeChannel } from '@supabase/supabase-js';
import ConfirmDeleteUserModal from './components/ConfirmDeleteUserModal';


const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [hasNewRequests, setHasNewRequests] = useState<boolean>(false);
  const [hasNewPurchaseOrders, setHasNewPurchaseOrders] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [itemsBeingDeleted, setItemsBeingDeleted] = useState(new Set<string>());
  const [recentlyUpdatedProductId, setRecentlyUpdatedProductId] = useState<string | null>(null);


  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false);
  
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  // Onboarding Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [showStartTourModal, setShowStartTourModal] = useState(false);

  // Barcode Scanner State
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [initialSearchTerm, setInitialSearchTerm] = useState('');

  const handleOpenBarcodeScanner = useCallback(() => {
    setIsBarcodeScannerOpen(true);
  }, []);

  const handleCloseBarcodeScanner = useCallback(() => {
    setIsBarcodeScannerOpen(false);
  }, []);

  const handleBarcodeScanned = useCallback((decodedText: string) => {
    setCurrentView('inventory');
    setInitialSearchTerm(decodedText);
    handleCloseBarcodeScanner();
  }, [handleCloseBarcodeScanner]);

  useEffect(() => {
    const tourCompleted = localStorage.getItem('stockerz_tour_completed_v1');
    if (!tourCompleted && currentUser) {
      // Use a timeout to ensure the UI has settled before showing the modal
      setTimeout(() => setShowStartTourModal(true), 1000);
    }
  }, [currentUser]);

  const handleStartTour = () => {
    setShowStartTourModal(false);
    setIsTourActive(true);
  };

  const handleEndTour = () => {
    setIsTourActive(false);
    localStorage.setItem('stockerz_tour_completed_v1', 'true');
  };

  const handleSkipTour = () => {
    setShowStartTourModal(false);
    localStorage.setItem('stockerz_tour_completed_v1', 'true');
  };
  
  // Session management with Supabase Auth
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profileData) {
          setCurrentUser(profileData);
        }
      }
      setSessionChecked(true);
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const { data: profileData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setCurrentUser(profileData || null);
        } else {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // FIX: Moved addToast before its usage to fix "used before its declaration" error.
  const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
    setTimeout(() => {
      setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Real-time subscriptions
  useEffect(() => {
    if (!currentUser) return;
    
    const channels: RealtimeChannel[] = [];

    const productsChannel = supabase.channel('realtime-products');
    productsChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
        setProducts(prev => [payload.new as Product, ...prev]);
        addToast(`New product added: ${payload.new.name}`, 'success');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        setProducts(prev => prev.map(p => p.id === payload.new.id ? payload.new as Product : p));
        setRecentlyUpdatedProductId(payload.new.id);
        setTimeout(() => setRecentlyUpdatedProductId(null), 2000);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, (payload) => {
        setProducts(prev => prev.filter(p => p.id !== payload.old.id));
        addToast(`Product removed: ${payload.old.name}`, 'success');
      })
      .subscribe();
    channels.push(productsChannel);
    
    const requestsChannel = supabase.channel('realtime-requests');
    requestsChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'requests' }, () => {
        if (currentView !== 'requests') {
          setHasNewRequests(true);
        }
        addToast("A new item request has been submitted.", 'success');
      })
      .subscribe();
    channels.push(requestsChannel);
      
    const poChannel = supabase.channel('realtime-purchase-orders');
    poChannel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchase_orders' }, () => {
        if (currentView !== 'purchase-orders') {
          setHasNewPurchaseOrders(true);
        }
         addToast("A new purchase order has been created.", 'success');
      })
      .subscribe();
    channels.push(poChannel);

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, [currentUser, currentView, addToast]);

  useEffect(() => {
    const mainEl = mainContainerRef.current;
    if (!mainEl) return;

    const handleScroll = () => {
      const currentScrollY = mainEl.scrollTop;
      const headerHeight = 80; // Corresponds to h-20 in Tailwind

      if (currentScrollY > lastScrollY.current && currentScrollY > headerHeight) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, [currentUser]); // Re-attach listener if layout changes after login
  
  // Load data from Supabase on app start
  useEffect(() => {
    const loadAppData = async () => {
       if (!currentUser) {
        setProducts([]);
        setVendors([]);
        setRequests([]);
        setPurchaseOrders([]);
        setUsers([]);
        setAuditLogs([]);
        setStockAdjustments([]);
        return;
      }
      setIsLoading(true);
      try {
        const [
          { data: productsData, error: productsError },
          { data: vendorsData, error: vendorsError },
          { data: requestsData, error: requestsError },
          { data: usersData, error: usersError },
          { data: purchaseOrdersData, error: purchaseOrdersError },
          { data: auditLogsData, error: auditLogsError },
          { data: stockAdjustmentsData, error: stockAdjustmentsError },
        ] = await Promise.all([
          supabase.from('products').select('*').order('name', { ascending: true }),
          supabase.from('vendors').select('*').order('name', { ascending: true }),
          supabase.from('requests').select('*').order('requestDate', { ascending: false }),
          supabase.from('users').select('*').order('username', { ascending: true }),
          supabase.from('purchase_orders').select('*').order('requestDate', { ascending: false }),
          supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }),
          supabase.from('stock_adjustments').select('*').order('date', { ascending: false }),
        ]);

        const errors = [productsError, vendorsError, requestsError, usersError, purchaseOrdersError, auditLogsError, stockAdjustmentsError].filter(Boolean);
        if (errors.length > 0) {
            throw new Error(errors.map(e => e.message).join(', '));
        }

        setProducts(productsData || []);
        setVendors(vendorsData || []);
        setRequests(requestsData || []);
        setUsers(usersData || []);
        setPurchaseOrders(purchaseOrdersData || []);
        setAuditLogs(auditLogsData || []);
        setStockAdjustments(stockAdjustmentsData || []);
      } catch (error) {
        console.error("Failed to load data from Supabase", error);
        addToast("Failed to load application data. Please check your connection.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionChecked) {
      loadAppData();
    }
  }, [currentUser, sessionChecked, addToast]);


  // Product Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | undefined>(undefined);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | undefined>(undefined);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [productsToDeleteBulk, setProductsToDeleteBulk] = useState<string[]>([]);

  // Vendor Modals State
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | undefined>(undefined);
  const [isDeleteVendorModalOpen, setIsDeleteVendorModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<Vendor | undefined>(undefined);
  const [isVendorDetailModalOpen, setIsVendorDetailModalOpen] = useState(false);
  const [vendorToView, setVendorToView] = useState<Vendor | undefined>(undefined);
  const [isBulkDeleteVendorModalOpen, setIsBulkDeleteVendorModalOpen] = useState(false);
  const [vendorsToDeleteBulk, setVendorsToDeleteBulk] = useState<string[]>([]);

  // Request Modals State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestToAction, setRequestToAction] = useState<Request | undefined>(undefined);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCollectedModalOpen, setIsCollectedModalOpen] = useState(false);
  const [isRequestDetailModalOpen, setIsRequestDetailModalOpen] = useState(false);
  const [requestToView, setRequestToView] = useState<Request | undefined>(undefined);

  // Purchase Order Modals State
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poToAction, setPOToAction] = useState<PurchaseOrder | undefined>(undefined);
  const [isApprovePOModalOpen, setIsApprovePOModalOpen] = useState(false);
  const [isRejectPOModalOpen, setIsRejectPOModalOpen] = useState(false);
  const [isPODetailModalOpen, setIsPODetailModalOpen] = useState(false);
  const [poToView, setPOToView] = useState<PurchaseOrder | undefined>(undefined);
  const [isReceivedPOModalOpen, setIsReceivedPOModalOpen] = useState(false);
  const [poToReceive, setPOToReceive] = useState<PurchaseOrder | undefined>(undefined);
  
    // Stock Adjustment Modal State
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  // Admin Modal State
  const [isConfirmAdminModalOpen, setIsConfirmAdminModalOpen] = useState(false);
  const [adminActionToConfirm, setAdminActionToConfirm] = useState<{
    action: 'reset' | 'clear';
    title: string;
    message: React.ReactNode;
    confirmText: string;
  } | null>(null);
  
  // User Management Modal State
  const [isAddUserModalOpen, setAddUserModalOpen] = useState(false);
  const [isRoleChangeModalOpen, setIsRoleChangeModalOpen] = useState(false);
  const [roleChangeDetails, setRoleChangeDetails] = useState<{ user: User; newRole: UserRole } | null>(null);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [userToAction, setUserToAction] = useState<User | null>(null);

  // Logout Modal State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Profile Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const handleLogAction = useCallback(async (action: string, details: string) => {
    if (!currentUser) return;
    const newLog: Omit<AuditLog, 'id'> = {
      timestamp: new Date().toISOString(),
      user: currentUser.username,
      action,
      details,
    };
    const { data, error } = await supabase.from('audit_logs').insert(newLog).select().single();
    if (error) {
      console.error("Failed to save audit log:", error);
    } else if (data) {
      setAuditLogs(prev => [data, ...prev]);
    }
  }, [currentUser]);

  const handleSetCurrentView = useCallback((view: View) => {
    if (!currentUser) return;
    const userRole = currentUser.role;

    if (userRole === 'Viewer' && ['requests', 'purchase-orders', 'admin', 'reports', 'audit-log', 'adjustments'].includes(view)) {
        addToast("You do not have permission to access this page.", "error");
        return;
    }

    if (view === 'requests') {
      setHasNewRequests(false);
    }
    if (view === 'purchase-orders') {
      setHasNewPurchaseOrders(false);
    }
     if (['admin', 'audit-log'].includes(view) && !['Supervisor', 'Manager', 'Super Admin'].includes(userRole)) {
      addToast("You do not have permission to access this page.", "error");
      return;
    }
    setCurrentView(view);
  }, [addToast, currentUser]);

  // Product Handlers
  const handleOpenModal = useCallback((product?: Product) => {
    setProductToEdit(product);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setProductToEdit(undefined);
  }, []);

  const handleSaveProduct = useCallback(async (productData: Omit<Product, 'id' | 'lastModifiedBy'> & { id?: string; lastUpdated: string; }) => {
    if (!currentUser) return;
    let message = '';
    try {
        if (productData.id) { // Update
            const { id, ...updateData } = { ...productData, lastModifiedBy: currentUser.username };
            const { error } = await supabase.from('products').update(updateData).eq('id', id);
            if (error) throw error;
            // No local state update needed due to real-time subscription
            await handleLogAction('Updated Product', `SKU: ${updateData.sku}, Name: ${updateData.name}`);
            message = `Product "${updateData.name}" was successfully updated.`;
        } else { // Create
            const newProduct: Omit<Product, 'id'> = {
                ...productData,
                lastModifiedBy: currentUser.username,
            };
            const { data, error } = await supabase.from('products').insert(newProduct).select().single();
            if (error) throw error;
            // No local state update needed due to real-time subscription
            await handleLogAction('Created Product', `SKU: ${data.sku}, Name: ${data.name}`);
            message = `Product "${data.name}" was successfully added.`;
        }
        handleCloseModal();
        addToast(message, 'success');
    } catch (error) {
        console.error("Failed to save product:", error);
        addToast("Failed to save product. Please try again.", "error");
        throw error;
    }
  }, [handleCloseModal, addToast, handleLogAction, currentUser]);

  const handleOpenDeleteModal = useCallback((product: Product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  }, []);
  
  const handleCloseDeleteModal = useCallback(() => {
    setProductToDelete(undefined);
    setIsDeleteModalOpen(false);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!productToDelete) return;
    const idToDelete = productToDelete.id;
    try {
        setItemsBeingDeleted(prev => new Set(prev).add(idToDelete));
        const { error } = await supabase.from('products').delete().eq('id', idToDelete);
        if (error) throw error;
        
        setTimeout(() => {
            // Local state update is handled by real-time, but this keeps the animation smooth
            setProducts(prevProducts => prevProducts.filter(p => p.id !== idToDelete));
        }, 500);

        await handleLogAction('Deleted Product', `SKU: ${productToDelete.sku}, Name: ${productToDelete.name}`);
        addToast(`Product "${productToDelete.name}" was successfully deleted.`, 'success');
        handleCloseDeleteModal();
    } catch (error) {
        console.error("Failed to delete product:", error);
        addToast("Failed to delete product. Please try again.", "error");
        setItemsBeingDeleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(idToDelete);
            return newSet;
        });
        throw error;
    }
  }, [productToDelete, handleCloseDeleteModal, addToast, handleLogAction]);

  const handleOpenBulkDeleteModal = useCallback((productIds: string[]) => {
    setProductsToDeleteBulk(productIds);
    setIsBulkDeleteModalOpen(true);
  }, []);

  const handleCloseBulkDeleteModal = useCallback(() => {
    setProductsToDeleteBulk([]);
    setIsBulkDeleteModalOpen(false);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    if (productsToDeleteBulk.length === 0) return;
    try {
      setItemsBeingDeleted(prev => new Set([...prev, ...productsToDeleteBulk]));
      const { error } = await supabase.from('products').delete().in('id', productsToDeleteBulk);
      if (error) throw error;

      setTimeout(() => {
          // Local state update is handled by real-time
          setProducts(prev => prev.filter(p => !productsToDeleteBulk.includes(p.id)));
      }, 500);

      await handleLogAction('Bulk Deleted Products', `${productsToDeleteBulk.length} items`);
      addToast(`${productsToDeleteBulk.length} products were successfully deleted.`, 'success');
      handleCloseBulkDeleteModal();
    } catch (error) {
      console.error("Failed to bulk delete products:", error);
      addToast("An error occurred while deleting products.", "error");
       setItemsBeingDeleted(prev => {
          const newSet = new Set(prev);
          productsToDeleteBulk.forEach(id => newSet.delete(id));
          return newSet;
      });
      throw error;
    }
  }, [productsToDeleteBulk, handleCloseBulkDeleteModal, addToast, handleLogAction]);


  // Vendor Handlers
  const handleOpenVendorModal = useCallback((vendor?: Vendor) => {
    setVendorToEdit(vendor);
    setIsVendorModalOpen(true);
  }, []);

  const handleCloseVendorModal = useCallback(() => {
    setIsVendorModalOpen(false);
    setVendorToEdit(undefined);
  }, []);

  const handleSaveVendor = useCallback(async (vendorData: Omit<Vendor, 'id' | 'lastModifiedBy' | 'lastUpdated'> & { id?: string; }) => {
    if (!currentUser) return;
    let message = '';
    const payload = { ...vendorData, lastUpdated: new Date().toISOString(), lastModifiedBy: currentUser.username };
    try {
        if (payload.id) {
            const { id, ...updateData } = payload;
            const { error } = await supabase.from('vendors').update(updateData).eq('id', id);
            if (error) throw error;
            setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updateData, id } : v));
            await handleLogAction('Updated Vendor', `ID: ${id}, Name: ${updateData.name}`);
            message = `Vendor "${updateData.name}" was successfully updated.`;
        } else {
            const { data, error } = await supabase.from('vendors').insert(payload).select().single();
            if (error) throw error;
            setVendors(prev => [data, ...prev]);
            await handleLogAction('Created Vendor', `ID: ${data.id}, Name: ${data.name}`);
            message = `Vendor "${data.name}" was successfully added.`;
        }
        handleCloseVendorModal();
        addToast(message, 'success');
    } catch (error) {
        console.error("Failed to save vendor:", error);
        addToast("Failed to save vendor. Please try again.", "error");
        throw error;
    }
  }, [handleCloseVendorModal, addToast, handleLogAction, currentUser]);

  const handleOpenDeleteVendorModal = useCallback((vendor: Vendor) => {
    setVendorToDelete(vendor);
    setIsDeleteVendorModalOpen(true);
  }, []);
  
  const handleCloseDeleteVendorModal = useCallback(() => {
    setVendorToDelete(undefined);
    setIsDeleteVendorModalOpen(false);
  }, []);

  const handleConfirmDeleteVendor = useCallback(async () => {
    if (!vendorToDelete) return;
    const idToDelete = vendorToDelete.id;
    try {
        setItemsBeingDeleted(prev => new Set(prev).add(idToDelete));
        const { error } = await supabase.from('vendors').delete().eq('id', idToDelete);
        if (error) throw error;

        setTimeout(() => {
            setVendors(prevVendors => prevVendors.filter(v => v.id !== idToDelete));
        }, 500);

        await handleLogAction('Deleted Vendor', `ID: ${vendorToDelete.id}, Name: ${vendorToDelete.name}`);
        addToast(`Vendor "${vendorToDelete.name}" was successfully deleted.`, 'success');
        handleCloseDeleteVendorModal();
    } catch (error) {
        console.error("Failed to delete vendor:", error);
        addToast("Failed to delete vendor. Please try again.", "error");
        setItemsBeingDeleted(prev => {
            const newSet = new Set(prev);
            newSet.delete(idToDelete);
            return newSet;
        });
        throw error;
    }
  }, [vendorToDelete, handleCloseDeleteVendorModal, addToast, handleLogAction]);
  
  const handleOpenBulkDeleteVendorModal = useCallback((vendorIds: string[]) => {
    setVendorsToDeleteBulk(vendorIds);
    setIsBulkDeleteVendorModalOpen(true);
  }, []);

  const handleCloseBulkDeleteVendorModal = useCallback(() => {
    setVendorsToDeleteBulk([]);
    setIsBulkDeleteVendorModalOpen(false);
  }, []);

  const handleConfirmBulkDeleteVendor = useCallback(async () => {
    if (vendorsToDeleteBulk.length === 0) return;
    try {
      setItemsBeingDeleted(prev => new Set([...prev, ...vendorsToDeleteBulk]));
      const { error } = await supabase.from('vendors').delete().in('id', vendorsToDeleteBulk);
      if (error) throw error;

      setTimeout(() => {
          setVendors(prev => prev.filter(v => !vendorsToDeleteBulk.includes(v.id)));
      }, 500);

      await handleLogAction('Bulk Deleted Vendors', `${vendorsToDeleteBulk.length} items`);
      addToast(`${vendorsToDeleteBulk.length} vendors were successfully deleted.`, 'success');
      handleCloseBulkDeleteVendorModal();
    } catch (error) {
      console.error("Failed to bulk delete vendors:", error);
      addToast("An error occurred while deleting vendors.", "error");
      setItemsBeingDeleted(prev => {
          const newSet = new Set(prev);
          vendorsToDeleteBulk.forEach(id => newSet.delete(id));
          return newSet;
      });
      throw error;
    }
  }, [vendorsToDeleteBulk, handleCloseBulkDeleteVendorModal, addToast, handleLogAction]);


  const handleOpenVendorDetailModal = useCallback((vendor: Vendor) => {
    setVendorToView(vendor);
    setIsVendorDetailModalOpen(true);
  }, []);

  const handleCloseVendorDetailModal = useCallback(() => {
      setVendorToView(undefined);
      setIsVendorDetailModalOpen(false);
  }, []);

  // Request Handlers
  const handleOpenRequestModal = useCallback(() => setIsRequestModalOpen(true), []);
  const handleCloseRequestModal = useCallback(() => setIsRequestModalOpen(false), []);

  const handleSaveRequest = useCallback(async (requestData: Omit<Request, 'id' | 'status'>) => {
    const newRequest: Omit<Request, 'id'> = {
        ...requestData,
        status: 'Pending Approval',
    };
    try {
        const { data, error } = await supabase.from('requests').insert(newRequest).select().single();
        if (error) throw error;
        setRequests(prev => [data, ...prev]);
        await handleLogAction('Created Request', `Product: ${data.productName}, Qty: ${data.quantity}, For: ${data.requestingDivision}`);
        handleCloseRequestModal();
        addToast('New item request has been created.', 'success');
        // No need to setHasNewRequests here, real-time handles it
    } catch (error) {
        console.error("Failed to save request:", error);
        addToast("Failed to create request due to a database error.", "error");
        throw error;
    }
  }, [addToast, handleCloseRequestModal, handleLogAction]);

  const updateRequestStatus = useCallback(async (requestId: string, status: RequestStatus, user: User, isCollecting = false) => {
      const updateData = isCollecting
          ? { status, collectedBy: user.username, collectionDate: new Date().toISOString() }
          : { status, approvedBy: user.username, actionDate: new Date().toISOString() };
      
      const { data, error } = await supabase.from('requests').update(updateData).eq('id', requestId).select().single();
      if (error) throw error;
      setRequests(prev => prev.map(r => r.id === requestId ? data : r));
  }, []);

  const handleOpenApproveModal = useCallback((request: Request) => {
    setRequestToAction(request);
    setIsApproveModalOpen(true);
  }, []);

  const handleCloseApproveModal = useCallback(() => {
    setRequestToAction(undefined);
    setIsApproveModalOpen(false);
  }, []);

  const handleConfirmApprove = useCallback(async () => {
    if (!requestToAction || !currentUser) return;

    try {
        const product = products.find(p => p.id === requestToAction.productId);
        if (!product || product.quantity < requestToAction.quantity) {
            addToast(`Stock for "${requestToAction.productName}" is insufficient.`, 'error');
            handleCloseApproveModal();
            return;
        }

        const newQuantity = product.quantity - requestToAction.quantity;
        const { error: productError } = await supabase
            .from('products')
            .update({ quantity: newQuantity, lastUpdated: new Date().toISOString() })
            .eq('id', product.id);
        
        if (productError) throw productError;

        await updateRequestStatus(requestToAction.id, 'Approved', currentUser);
        
        await handleLogAction('Approved Request', `ID: ${requestToAction.id}, Product: ${requestToAction.productName}`);
        // No local state update for products needed, handled by real-time
        addToast(`Request for "${requestToAction.productName}" approved. Stock has been updated.`, 'success');
        handleCloseApproveModal();
    } catch (error) {
        console.error("Failed to approve request:", error);
        addToast("Failed to approve request. Please try again.", "error");
        throw error;
    }
  }, [requestToAction, products, updateRequestStatus, addToast, handleCloseApproveModal, handleLogAction, currentUser]);

  const handleOpenRejectModal = useCallback((request: Request) => {
    setRequestToAction(request);
    setIsRejectModalOpen(true);
  }, []);
  
  const handleCloseRejectModal = useCallback(() => {
    setRequestToAction(undefined);
    setIsRejectModalOpen(false);
  }, []);

  const handleConfirmReject = useCallback(async () => {
    if (!requestToAction || !currentUser) return;
    try {
        await updateRequestStatus(requestToAction.id, 'Rejected', currentUser);
        await handleLogAction('Rejected Request', `ID: ${requestToAction.id}, Product: ${requestToAction.productName}`);
        addToast(`Request for "${requestToAction.productName}" has been rejected.`, 'success');
        handleCloseRejectModal();
    } catch (error) {
        console.error("Failed to reject request:", error);
        addToast("Failed to reject request due to a database error.", "error");
        throw error;
    }
  }, [requestToAction, updateRequestStatus, addToast, handleCloseRejectModal, handleLogAction, currentUser]);

  const handleOpenCollectedModal = useCallback((request: Request) => {
    setRequestToAction(request);
    setIsCollectedModalOpen(true);
  }, []);

  const handleCloseCollectedModal = useCallback(() => {
    setRequestToAction(undefined);
    setIsCollectedModalOpen(false);
  }, []);

  const handleConfirmCollected = useCallback(async () => {
    if (!requestToAction || !currentUser) return;
    try {
      await updateRequestStatus(requestToAction.id, 'Collected', currentUser, true);
      await handleLogAction('Collected Request', `ID: ${requestToAction.id}, Product: ${requestToAction.productName}`);
      addToast(`Request for "${requestToAction.productName}" marked as collected.`, 'success');
      handleCloseCollectedModal();
    } catch (error) {
      console.error("Failed to mark as collected:", error);
      addToast("Failed to update request due to a database error.", "error");
      throw error;
    }
  }, [requestToAction, updateRequestStatus, addToast, handleCloseCollectedModal, handleLogAction, currentUser]);


  const handleOpenRequestDetailModal = useCallback((request: Request) => {
    setRequestToView(request);
    setIsRequestDetailModalOpen(true);
  }, []);

  const handleCloseRequestDetailModal = useCallback(() => {
    setRequestToView(undefined);
    setIsRequestDetailModalOpen(false);
  }, []);

  // Purchase Order Handlers
  const handleOpenPOModal = useCallback(() => setIsPOModalOpen(true), []);
  const handleClosePOModal = useCallback(() => setIsPOModalOpen(false), []);

  const handleSavePurchaseOrder = useCallback(async (poData: Omit<PurchaseOrder, 'id' | 'status' | 'requestedBy'>) => {
    if (!currentUser) return;
    const newPO: Omit<PurchaseOrder, 'id'> = {
        ...poData,
        status: 'Pending Approval',
        requestedBy: currentUser.username,
    };
    try {
        const { data, error } = await supabase.from('purchase_orders').insert(newPO).select().single();
        if (error) throw error;
        setPurchaseOrders(prev => [data, ...prev]);
        await handleLogAction('Created Purchase Order', `Product: ${data.productName}, Qty: ${data.quantity}`);
        handleClosePOModal();
        addToast('New purchase order has been created.', 'success');
        // No need to setHasNewPurchaseOrders here, real-time handles it
    } catch (error) {
        console.error("Failed to save purchase order:", error);
        addToast("Failed to create purchase order due to a database error.", "error");
        throw error;
    }
  }, [addToast, handleClosePOModal, handleLogAction, currentUser]);
  
  const updatePOStatus = useCallback(async (poId: string, status: PurchaseOrderStatus, user: User) => {
      const updateData = { status, approvedBy: user.username, actionDate: new Date().toISOString() };
      const { data, error } = await supabase.from('purchase_orders').update(updateData).eq('id', poId).select().single();
      if (error) throw error;
      setPurchaseOrders(prev => prev.map(p => p.id === poId ? data : p));
  }, []);

  const handleOpenApprovePOModal = useCallback((po: PurchaseOrder) => {
    setPOToAction(po);
    setIsApprovePOModalOpen(true);
  }, []);

  const handleCloseApprovePOModal = useCallback(() => {
    setPOToAction(undefined);
    setIsApprovePOModalOpen(false);
  }, []);

  const handleConfirmApprovePO = useCallback(async () => {
    if (!poToAction || !currentUser) return;
    try {
      await updatePOStatus(poToAction.id, 'Approved', currentUser);
      await handleLogAction('Approved Purchase Order', `ID: ${poToAction.id}, Product: ${poToAction.productName}`);
      addToast(`Purchase order for "${poToAction.productName}" has been approved.`, 'success');
      handleCloseApprovePOModal();
    } catch (error) {
        console.error("Failed to approve PO:", error);
        addToast("Failed to approve purchase order due to a database error.", "error");
        throw error;
    }
  }, [poToAction, addToast, handleCloseApprovePOModal, updatePOStatus, handleLogAction, currentUser]);

  const handleOpenRejectPOModal = useCallback((po: PurchaseOrder) => {
    setPOToAction(po);
    setIsRejectPOModalOpen(true);
  }, []);

  const handleCloseRejectPOModal = useCallback(() => {
    setPOToAction(undefined);
    setIsRejectPOModalOpen(false);
  }, []);

  const handleConfirmRejectPO = useCallback(async () => {
    if (!poToAction || !currentUser) return;
    try {
      await updatePOStatus(poToAction.id, 'Rejected', currentUser);
      await handleLogAction('Rejected Purchase Order', `ID: ${poToAction.id}, Product: ${poToAction.productName}`);
      addToast(`Purchase order for "${poToAction.productName}" has been rejected.`, 'success');
      handleCloseRejectPOModal();
    } catch (error) {
        console.error("Failed to reject PO:", error);
        addToast("Failed to reject purchase order due to a database error.", "error");
        throw error;
    }
  }, [poToAction, addToast, handleCloseRejectPOModal, updatePOStatus, handleLogAction, currentUser]);
  
  const handleOpenPODetailModal = useCallback((po: PurchaseOrder) => {
      setPOToView(po);
      setIsPODetailModalOpen(true);
  }, []);

  const handleClosePODetailModal = useCallback(() => {
      setPOToView(undefined);
      setIsPODetailModalOpen(false);
  }, []);

  const handleOpenReceivedPOModal = useCallback((po: PurchaseOrder) => {
    setPOToReceive(po);
    setIsReceivedPOModalOpen(true);
  }, []);

  const handleCloseReceivedPOModal = useCallback(() => {
      setPOToReceive(undefined);
      setIsReceivedPOModalOpen(false);
  }, []);

  const handleConfirmReceivePO = useCallback(async () => {
      if (!poToReceive || !currentUser) return;

      const productToUpdate = products.find(p => p.id === poToReceive.productId);
      if (!productToUpdate) {
          addToast(`Product "${poToReceive.productName}" not found in inventory.`, "error");
          handleCloseReceivedPOModal();
          return;
      }

      try {
          const newQuantity = productToUpdate.quantity + poToReceive.quantity;
          const { error: productError } = await supabase
            .from('products')
            .update({ quantity: newQuantity, lastUpdated: new Date().toISOString(), lastModifiedBy: currentUser.username })
            .eq('id', productToUpdate.id)
            .select()
            .single();

          if (productError) throw productError;

          const { data: updatedPO, error: poError } = await supabase
            .from('purchase_orders')
            .update({ status: 'Received', receivedBy: currentUser.username, receivedDate: new Date().toISOString() })
            .eq('id', poToReceive.id)
            .select()
            .single();

          if (poError) throw poError;

          // No need to update local product state due to real-time subscription
          setPurchaseOrders(prev => prev.map(po => po.id === updatedPO.id ? updatedPO : po));
          
          await handleLogAction('Received Purchase Order', `ID: ${updatedPO.id}, Product: ${updatedPO.productName}, Qty: ${updatedPO.quantity}`);
          addToast(`Stock for "${updatedPO.productName}" has been updated.`, 'success');
          handleCloseReceivedPOModal();
      } catch (error) {
          console.error("Failed to mark PO as received:", error);
          addToast("Failed to update database. Please try again.", "error");
          throw error;
      }
  }, [poToReceive, currentUser, products, addToast, handleCloseReceivedPOModal, handleLogAction]);

    // Adjustment Handlers
  const handleOpenAdjustmentModal = useCallback(() => setIsAdjustmentModalOpen(true), []);
  const handleCloseAdjustmentModal = useCallback(() => setIsAdjustmentModalOpen(false), []);

  const handleSaveStockAdjustment = useCallback(async (adjustmentData: Omit<StockAdjustment, 'id' | 'adjustedBy' | 'date'>) => {
      if (!currentUser) return;

      const productToUpdate = products.find(p => p.id === adjustmentData.productId);
      if (!productToUpdate) {
          addToast("The selected product could not be found.", "error");
          throw new Error("Product not found");
      }

      const newQuantity = productToUpdate.quantity + adjustmentData.quantityChange;
      if (newQuantity < 0) {
          addToast("Adjustment cannot result in negative stock.", "error");
          throw new Error("Negative stock");
      }

      const newAdjustment: Omit<StockAdjustment, 'id'> = {
          ...adjustmentData,
          date: new Date().toISOString(),
          adjustedBy: currentUser.username,
      };

      try {
          const { data: savedAdjustment, error: adjError } = await supabase.from('stock_adjustments').insert(newAdjustment).select().single();
          if (adjError) throw adjError;

          const { error: prodError } = await supabase
            .from('products')
            .update({ quantity: newQuantity, lastUpdated: new Date().toISOString(), lastModifiedBy: currentUser.username })
            .eq('id', productToUpdate.id)
            .select()
            .single();

          if (prodError) throw prodError;

          setStockAdjustments(prev => [savedAdjustment, ...prev]);
          // No need to update local product state, real-time handles it.
          
          await handleLogAction('Stock Adjustment', `Product: ${savedAdjustment.productName} (SKU: ${productToUpdate.sku}), Change: ${savedAdjustment.quantityChange}, Reason: ${savedAdjustment.reason}`);
          
          handleCloseAdjustmentModal();
          addToast('Stock adjustment recorded successfully.', 'success');
      } catch (error) {
          console.error("Failed to save stock adjustment:", error);
          addToast("Failed to save adjustment due to a database error.", "error");
          throw error;
      }
  }, [addToast, handleCloseAdjustmentModal, handleLogAction, currentUser, products]);


  // Admin Handlers
  const handleOpenAdminConfirmModal = useCallback((action: 'reset' | 'clear') => {
    if (action === 'reset') {
      setAdminActionToConfirm({
        action: 'reset',
        title: 'Reset All Data?',
        message: 'This will delete all current data and restore the initial demo data. This action cannot be undone.',
        confirmText: 'Yes, Reset Data'
      });
    } else {
      setAdminActionToConfirm({
        action: 'clear',
        title: 'Clear All Data?',
        message: <>Are you sure you want to permanently delete <strong>all products, vendors, requests, purchase orders and adjustments</strong>? This action cannot be undone.</>,
        confirmText: 'Yes, Clear Everything'
      });
    }
    setIsConfirmAdminModalOpen(true);
  }, []);

  const handleCloseAdminConfirmModal = useCallback(() => {
    setIsConfirmAdminModalOpen(false);
    setAdminActionToConfirm(null);
  }, []);

  const handleConfirmAdminAction = useCallback(async () => {
    if (!adminActionToConfirm) return;
    
    const { action } = adminActionToConfirm;
    setIsLoading(true);
    handleCloseAdminConfirmModal();

    try {
      const tablesToClear = ['products', 'vendors', 'requests', 'purchase_orders', 'stock_adjustments'];
      const clearPromises = tablesToClear.map(table => supabase.from(table).delete().neq('id', '0'));
      const results = await Promise.all(clearPromises);
      const failed = results.find(res => res.error);
      if (failed) throw failed.error;

      // Both actions now just clear data
      setProducts([]);
      setVendors([]);
      setRequests([]);
      setPurchaseOrders([]);
      setStockAdjustments([]);
      
      const successMessage = "All application data has been cleared.";
      await handleLogAction(action === 'reset' ? 'Reset All Data' : 'Cleared All Data', successMessage);
      addToast(successMessage, 'success');
      
    } catch (error) {
        console.error(`Admin action (${action}) failed:`, error);
        addToast("An error occurred while clearing the data.", "error");
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [adminActionToConfirm, addToast, handleCloseAdminConfirmModal, handleLogAction]);
  
  // User Management Handlers
  const handleOpenAddUserModal = useCallback(() => setAddUserModalOpen(true), []);
  const handleCloseAddUserModal = useCallback(() => setAddUserModalOpen(false), []);

  const handleSaveUser = useCallback(async (userData: Omit<User, 'id'> & { password?: string }) => {
    if (!userData.password) {
        addToast("Password is required to create a user.", "error");
        throw new Error("Password missing");
    }

    // 1. Get the current admin session to restore it later
    const { data: { session: adminSession }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !adminSession) {
        addToast("Could not verify your session. Please log in again.", "error");
        throw new Error("Admin session not found.");
    }

    try {
        // 2. Sign up the new user. This action will change the active session.
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: userData.username, // Using username as email for login
            password: userData.password,
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("User not created in Auth.");

        // 3. Immediately restore the admin's session to prevent the admin from being logged out.
        const { error: restoreError } = await supabase.auth.setSession({
            access_token: adminSession.access_token,
            refresh_token: adminSession.refresh_token,
        });

        if (restoreError) {
            addToast("Critical session error. Please refresh and log in again.", "error");
            await supabase.auth.signOut(); // Log out everyone to be safe.
            throw restoreError;
        }

        // 4. Now, with the admin session restored, create the user's profile in the database.
        const newUserProfile: User = {
            id: authData.user.id,
            username: userData.username,
            role: userData.role,
        };

        const { data: profileData, error: profileError } = await supabase
            .from('users')
            .insert(newUserProfile)
            .select()
            .single();

        if (profileError) {
            // Handle case where auth user was created but profile failed
            addToast(`User auth created, but profile creation failed: ${profileError.message}`, "error");
            throw profileError;
        }

        // 5. Success: Update local state and UI.
        setUsers(prev => [...prev, profileData]);
        await handleLogAction('Created User', `Username: ${profileData.username}, Role: ${profileData.role}`);
        handleCloseAddUserModal();
        addToast(`User "${profileData.username}" was successfully created.`, 'success');

    } catch (error: any) {
        console.error("Failed to save user:", error);
        // Display a generic error if a specific one hasn't been shown
        if (!error.message.includes("session")) {
            addToast(error.message || "Failed to create user. Please try again.", "error");
        }
        throw error; // Re-throw to allow the modal to reset its saving state
    }
  }, [addToast, handleCloseAddUserModal, handleLogAction]);
  
  const handleUpdateUserRole = useCallback(async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;
    
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) {
        addToast(`User with ID ${userId} not found.`, "error");
        return;
    }

    if ((newRole === 'Super Admin' || userToUpdate.role === 'Super Admin') && currentUser.role !== 'Super Admin') {
      addToast("Only a Super Admin can modify another Super Admin's role.", "error");
      return;
    }
    
    if (userToUpdate.role === 'Super Admin' && newRole !== 'Super Admin') {
        const superAdminCount = users.filter(u => u.role === 'Super Admin').length;
        if (superAdminCount <= 1) {
            addToast("Cannot change the role of the last Super Admin.", "error");
            return;
        }
    }

    if (userToUpdate.role === 'Manager' && newRole !== 'Manager') {
        const managerCount = users.filter(u => u.role === 'Manager').length;
        if (managerCount <= 1) {
            addToast("Cannot change the role of the last manager.", "error");
            return;
        }
    }

    try {
        const { data: updatedUser, error } = await supabase.from('users').update({ role: newRole }).eq('id', userId).select().single();
        if (error) throw error;
        setUsers(prevUsers => prevUsers.map(u => (u.id === userId ? updatedUser : u)));
        await handleLogAction('Updated User Role', `Username: ${updatedUser.username}, New Role: ${newRole}`);
        addToast(`User "${updatedUser.username}" role has been updated to ${newRole}.`, 'success');
    } catch (error) {
        console.error("Failed to update user role:", error);
        addToast("Failed to update user role due to a database error.", "error");
    }
  }, [users, addToast, handleLogAction, currentUser]);

  const handleOpenRoleChangeModal = useCallback((user: User, newRole: UserRole) => {
    if (user.role === newRole) return;
    setRoleChangeDetails({ user, newRole });
    setIsRoleChangeModalOpen(true);
  }, []);

  const handleCloseRoleChangeModal = useCallback(() => {
    setIsRoleChangeModalOpen(false);
    setTimeout(() => setRoleChangeDetails(null), 300);
  }, []);

  const handleConfirmRoleChange = useCallback(async () => {
    if (!roleChangeDetails) return;
    await handleUpdateUserRole(roleChangeDetails.user.id, roleChangeDetails.newRole);
    handleCloseRoleChangeModal();
  }, [roleChangeDetails, handleUpdateUserRole, handleCloseRoleChangeModal]);

  const handleOpenDeleteUserModal = useCallback((user: User) => {
    setUserToAction(user);
    setIsDeleteUserModalOpen(true);
  }, []);

  const handleCloseDeleteUserModal = useCallback(() => {
    setUserToAction(null);
    setIsDeleteUserModalOpen(false);
  }, []);

  const handleConfirmDeleteUser = useCallback(async () => {
    if (!userToAction) return;

    const superAdminCount = users.filter(u => u.role === 'Super Admin').length;
    if (userToAction.role === 'Super Admin' && superAdminCount <= 1) {
      addToast("Cannot delete the last Super Admin.", "error");
      handleCloseDeleteUserModal();
      return;
    }

    try {
      // Note: This only deletes the user profile from the public table.
      // A secure server-side function (e.g., Supabase Edge Function) is required
      // to call `supabase.auth.admin.deleteUser()` to fully remove the user from the auth system.
      // This implementation is a client-side best-effort.
      const { error } = await supabase.from('users').delete().eq('id', userToAction.id);
      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userToAction.id));
      await handleLogAction('Deleted User', `Username: ${userToAction.username}`);
      addToast(`User "${userToAction.username}" has been deleted.`, 'success');
      handleCloseDeleteUserModal();
    } catch (error: any) {
      console.error("Failed to delete user:", error);
      addToast(error.message || "Failed to delete user.", "error");
      throw error;
    }
  }, [userToAction, users, addToast, handleLogAction, handleCloseDeleteUserModal]);


  // Logout Handlers
  const handleOpenLogoutModal = useCallback(() => setIsLogoutModalOpen(true), []);
  const handleCloseLogoutModal = useCallback(() => setIsLogoutModalOpen(false), []);
  const handleConfirmLogout = useCallback(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addToast(`Logout failed: ${error.message}`, 'error');
      } else {
        handleCloseLogoutModal();
        addToast("You have successfully logged out.", "success");
      }
  }, [addToast, handleCloseLogoutModal]);

  // Profile Handlers
  const handleOpenProfileModal = useCallback(() => setIsProfileModalOpen(true), []);
  const handleCloseProfileModal = useCallback(() => setIsProfileModalOpen(false), []);

  const handleUpdateProfile = useCallback(async (userId: string, profilePictureUrl: string) => {
      try {
          const { data: updatedUser, error } = await supabase
            .from('users')
            .update({ profilePictureUrl })
            .eq('id', userId)
            .select()
            .single();

          if (error) throw error;

          const updatedUsers = users.map(u => (u.id === userId ? updatedUser : u));
          setUsers(updatedUsers);
          if (currentUser?.id === userId) {
              setCurrentUser(updatedUser);
          }
          await handleLogAction('Updated Profile Picture', `User: ${updatedUser.username}`);
          addToast(`Profile picture updated successfully.`, 'success');
      } catch (error) {
          console.error("Failed to update profile:", error);
          addToast("Failed to update profile picture due to a database error.", "error");
          throw error;
      }
  }, [users, currentUser, addToast, handleLogAction]);
  
  const handleUpdatePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!currentUser) {
        addToast("You must be logged in to change your password.", "error");
        throw new Error("User not authenticated");
    }

    // First, verify the current password by attempting to sign in.
    // This is a workaround because Supabase client-side SDK doesn't have a direct "verify password" method.
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentUser.username, // Assuming username is the email
        password: currentPassword,
    });

    if (signInError) {
        addToast("Your current password is not correct. Please try again.", "error");
        throw new Error("Incorrect current password.");
    }

    // If signIn is successful (no error), proceed to update the password for the current user.
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        addToast(`Failed to update password: ${updateError.message}`, "error");
        throw updateError;
    }

    addToast("Your password has been updated successfully.", "success");
    await handleLogAction('Updated Password', `User ${currentUser.username} updated their own password.`);
  }, [currentUser, addToast, handleLogAction]);

  const mainContent = useMemo(() => {
    if (!currentUser) return null;
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} purchaseOrders={purchaseOrders} setCurrentView={handleSetCurrentView} />;
      case 'inventory':
        return (
          <ProductList
            products={products}
            vendors={vendors}
            onEditProduct={handleOpenModal}
            onDeleteProduct={handleOpenDeleteModal}
            onAddProduct={() => handleOpenModal()}
            isLoading={isLoading}
            onBulkDelete={handleOpenBulkDeleteModal}
            currentUser={currentUser}
            itemsBeingDeleted={itemsBeingDeleted}
            onOpenBarcodeScanner={handleOpenBarcodeScanner}
            initialSearchTerm={initialSearchTerm}
            recentlyUpdatedProductId={recentlyUpdatedProductId}
          />
        );
       case 'requests':
        return (
          <RequestList 
            requests={requests}
            onApprove={handleOpenApproveModal}
            onReject={handleOpenRejectModal}
            onViewDetails={handleOpenRequestDetailModal}
            onMarkAsCollected={handleOpenCollectedModal}
            userRole={currentUser.role}
          />
        );
      case 'purchase-orders':
        return (
          <PurchaseOrderList
            purchaseOrders={purchaseOrders}
            vendors={vendors}
            products={products}
            onApprove={handleOpenApprovePOModal}
            onReject={handleOpenRejectPOModal}
            onViewDetails={handleOpenPODetailModal}
            onMarkAsReceived={handleOpenReceivedPOModal}
            userRole={currentUser.role}
          />
        );
        case 'adjustments':
          return (
              <StockAdjustmentList 
                  adjustments={stockAdjustments}
              />
          );
      case 'vendors':
        return (
          <VendorList 
            vendors={vendors} 
            onEditVendor={handleOpenVendorModal}
            onDeleteVendor={handleOpenDeleteVendorModal}
            onAddVendor={() => handleOpenVendorModal()}
            onViewDetails={handleOpenVendorDetailModal}
            onBulkDelete={handleOpenBulkDeleteVendorModal}
            currentUser={currentUser}
            itemsBeingDeleted={itemsBeingDeleted}
          />
        );
      case 'reports':
        return (
          <Reports
            requests={requests}
            purchaseOrders={purchaseOrders}
            vendors={vendors}
          />
        );
      case 'admin':
        if (!['Supervisor', 'Manager', 'Super Admin'].includes(currentUser.role)) {
            return <Dashboard products={products} purchaseOrders={purchaseOrders} setCurrentView={handleSetCurrentView} />;
        }
        return (
          <AdminPanel 
            stats={{
                products: products.length,
                vendors: vendors.length,
                requests: requests.length,
                adjustments: stockAdjustments.length,
            }}
            users={users}
            currentUser={currentUser}
            onAddUser={handleOpenAddUserModal}
            onUpdateUserRole={handleOpenRoleChangeModal}
            onResetData={() => handleOpenAdminConfirmModal('reset')}
            onClearData={() => handleOpenAdminConfirmModal('clear')}
            onDeleteUser={handleOpenDeleteUserModal}
          />
        );
      case 'audit-log':
        if (!['Supervisor', 'Manager', 'Super Admin'].includes(currentUser.role)) {
            return <Dashboard products={products} purchaseOrders={purchaseOrders} setCurrentView={handleSetCurrentView} />;
        }
        return <AuditLogComponent logs={auditLogs} />;
      default:
        return <Dashboard products={products} purchaseOrders={purchaseOrders} setCurrentView={handleSetCurrentView} />;
    }
  }, [currentView, products, vendors, requests, purchaseOrders, users, auditLogs, stockAdjustments, handleOpenModal, handleOpenDeleteModal, handleOpenVendorModal, handleOpenDeleteVendorModal, handleOpenVendorDetailModal, handleOpenApproveModal, handleOpenRejectModal, handleSetCurrentView, handleOpenRequestDetailModal, isLoading, handleOpenAdminConfirmModal, handleOpenAddUserModal, handleOpenApprovePOModal, handleOpenRejectPOModal, handleOpenPODetailModal, handleOpenReceivedPOModal, handleOpenBulkDeleteModal, handleOpenBulkDeleteVendorModal, handleOpenRoleChangeModal, handleOpenCollectedModal, currentUser, itemsBeingDeleted, handleOpenBarcodeScanner, initialSearchTerm, recentlyUpdatedProductId, handleOpenDeleteUserModal]);

  if (!sessionChecked) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <LoadingIcon className="w-16 h-16 text-primary-500 animate-spin" />
        </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }
  
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-screen bg-slate-100">
            <LoadingIcon className="w-16 h-16 text-primary-500 animate-spin" />
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 text-slate-800">
      <ToastContainer toasts={toasts} />
      <Sidebar 
        currentView={currentView} 
        setCurrentView={handleSetCurrentView} 
        hasNewRequests={hasNewRequests}
        hasNewPurchaseOrders={hasNewPurchaseOrders}
        userRole={currentUser.role}
      />
      <div ref={mainContainerRef} className="flex-1 flex flex-col overflow-y-auto">
        <Header 
          isVisible={isHeaderVisible}
          currentView={currentView}
          onAddProduct={() => handleOpenModal()} 
          onAddVendor={() => handleOpenVendorModal()}
          onAddRequest={() => handleOpenRequestModal()}
          onAddPurchaseOrder={() => handleOpenPOModal()}
          onAddAdjustment={() => handleOpenAdjustmentModal()}
          currentUser={currentUser}
          onLogout={handleOpenLogoutModal}
          onOpenProfileModal={handleOpenProfileModal}
        />
        <main data-tour-id="main-content-area" className="flex-1 bg-slate-100 p-4 md:p-8">
          {mainContent}
        </main>
        <Footer />
      </div>

      <StartTourModal
        isOpen={showStartTourModal}
        onStart={handleStartTour}
        onSkip={handleSkipTour}
      />
      <OnboardingTour
          isActive={isTourActive}
          onEndTour={handleEndTour}
      />
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={handleCloseBarcodeScanner}
        onScanSuccess={handleBarcodeScanned}
      />

      {isModalOpen && (
        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveProduct}
          product={productToEdit}
          allProducts={products}
          vendors={vendors}
        />
      )}
      {isDeleteModalOpen && productToDelete && (
        <ConfirmDeleteModal
            isOpen={isDeleteModalOpen}
            onClose={handleCloseDeleteModal}
            onConfirm={handleConfirmDelete}
            productName={productToDelete.name}
        />
      )}
      {isBulkDeleteModalOpen && (
        <ConfirmBulkDeleteModal
            isOpen={isBulkDeleteModalOpen}
            onClose={handleCloseBulkDeleteModal}
            onConfirm={handleConfirmBulkDelete}
            itemCount={productsToDeleteBulk.length}
        />
      )}
      {isVendorModalOpen && (
        <VendorFormModal
          isOpen={isVendorModalOpen}
          onClose={handleCloseVendorModal}
          onSave={handleSaveVendor}
          vendor={vendorToEdit}
          allVendors={vendors}
        />
      )}
      {isDeleteVendorModalOpen && vendorToDelete && (
        <ConfirmDeleteVendorModal
            isOpen={isDeleteVendorModalOpen}
            onClose={handleCloseDeleteVendorModal}
            onConfirm={handleConfirmDeleteVendor}
            vendorName={vendorToDelete.name}
        />
      )}
       {isBulkDeleteVendorModalOpen && (
        <ConfirmBulkDeleteVendorModal
            isOpen={isBulkDeleteVendorModalOpen}
            onClose={handleCloseBulkDeleteVendorModal}
            onConfirm={handleConfirmBulkDeleteVendor}
            itemCount={vendorsToDeleteBulk.length}
        />
      )}
      {isVendorDetailModalOpen && (
          <VendorDetailModal
            isOpen={isVendorDetailModalOpen}
            onClose={handleCloseVendorDetailModal}
            vendor={vendorToView}
            products={products}
          />
      )}
      {isRequestModalOpen && (
        <RequestFormModal 
          isOpen={isRequestModalOpen}
          onClose={handleCloseRequestModal}
          onSave={handleSaveRequest}
          products={products}
        />
      )}
      {isApproveModalOpen && requestToAction && (
          <ConfirmApproveModal
            isOpen={isApproveModalOpen}
            onClose={handleCloseApproveModal}
            onConfirm={handleConfirmApprove}
            request={requestToAction}
          />
      )}
      {isRejectModalOpen && requestToAction && (
          <ConfirmRejectModal
            isOpen={isRejectModalOpen}
            onClose={handleCloseRejectModal}
            onConfirm={handleConfirmReject}
            request={requestToAction}
          />
      )}
      {isCollectedModalOpen && requestToAction && (
          <ConfirmCollectedModal
            isOpen={isCollectedModalOpen}
            onClose={handleCloseCollectedModal}
            onConfirm={handleConfirmCollected}
            request={requestToAction}
          />
      )}
      {isRequestDetailModalOpen && (
          <RequestDetailModal
            isOpen={isRequestDetailModalOpen}
            onClose={handleCloseRequestDetailModal}
            request={requestToView}
          />
      )}
      {isPOModalOpen && (
        <PurchaseOrderFormModal
          isOpen={isPOModalOpen}
          onClose={handleClosePOModal}
          onSave={handleSavePurchaseOrder}
          products={products}
          vendors={vendors}
        />
      )}
      {isApprovePOModalOpen && poToAction && (
          <ConfirmApprovePOModal
            isOpen={isApprovePOModalOpen}
            onClose={handleCloseApprovePOModal}
            onConfirm={handleConfirmApprovePO}
            purchaseOrder={poToAction}
          />
      )}
      {isRejectPOModalOpen && poToAction && (
          <ConfirmRejectPOModal
            isOpen={isRejectPOModalOpen}
            onClose={handleCloseRejectPOModal}
            onConfirm={handleConfirmRejectPO}
            purchaseOrder={poToAction}
          />
      )}
       {isPODetailModalOpen && poToView && (
          <PurchaseOrderDetailModal
            isOpen={isPODetailModalOpen}
            onClose={handleClosePODetailModal}
            purchaseOrder={poToView}
            vendors={vendors}
          />
      )}
      {isReceivedPOModalOpen && poToReceive && (
          <ConfirmReceivedPOModal
              isOpen={isReceivedPOModalOpen}
              onClose={handleCloseReceivedPOModal}
              onConfirm={handleConfirmReceivePO}
              purchaseOrder={poToReceive}
          />
      )}
      {isAdjustmentModalOpen && (
        <StockAdjustmentFormModal
          isOpen={isAdjustmentModalOpen}
          onClose={handleCloseAdjustmentModal}
          onSave={handleSaveStockAdjustment}
          products={products}
        />
      )}
      {isConfirmAdminModalOpen && adminActionToConfirm && (
          <ConfirmAdminActionModal
            isOpen={isConfirmAdminModalOpen}
            onClose={handleCloseAdminConfirmModal}
            onConfirm={handleConfirmAdminAction}
            title={adminActionToConfirm.title}
            message={adminActionToConfirm.message}
            confirmButtonText={adminActionToConfirm.confirmText}
            actionType={adminActionToConfirm.action}
          />
      )}
      {isAddUserModalOpen && currentUser && (
          <AddUserModal
            isOpen={isAddUserModalOpen}
            onClose={handleCloseAddUserModal}
            onSave={handleSaveUser}
            allUsers={users}
            currentUser={currentUser}
          />
      )}
      {isRoleChangeModalOpen && roleChangeDetails && (
        <ConfirmRoleChangeModal
            isOpen={isRoleChangeModalOpen}
            onClose={handleCloseRoleChangeModal}
            onConfirm={handleConfirmRoleChange}
            user={roleChangeDetails.user}
            newRole={roleChangeDetails.newRole}
        />
      )}
      {isDeleteUserModalOpen && userToAction && (
        <ConfirmDeleteUserModal
            isOpen={isDeleteUserModalOpen}
            onClose={handleCloseDeleteUserModal}
            onConfirm={handleConfirmDeleteUser}
            user={userToAction}
        />
      )}
      {isLogoutModalOpen && (
        <ConfirmLogoutModal
            isOpen={isLogoutModalOpen}
            onClose={handleCloseLogoutModal}
            onConfirm={handleConfirmLogout}
        />
       )}
       {isProfileModalOpen && currentUser && (
        <ProfileSettingsModal
            isOpen={isProfileModalOpen}
            onClose={handleCloseProfileModal}
            onSaveProfilePicture={handleUpdateProfile}
            onUpdatePassword={handleUpdatePassword}
            currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default App;