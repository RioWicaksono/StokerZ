

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  price: number;
  location: string;
  supplierId: string; // Diubah dari 'supplier'
  lastUpdated: string; // string tanggal ISO 8601
  lastModifiedBy?: string;
  imageUrl?: string; // Data URL (base64)
  expiryDate?: string; // ISO date string
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  email: string;
  phone: string;
  lastUpdated: string; // ISO date string
  lastModifiedBy?: string;
}

export type RequestStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Collected';
export type RequestPriority = 'Low' | 'Medium' | 'High';

export interface Request {
  id: string;
  requestingDivision: string;
  productId: string;
  productName: string;
  quantity: number;
  requestDate: string; // string tanggal ISO 8601
  status: RequestStatus;
  priority: RequestPriority;
  notes?: string;
  approvedBy?: string; // Username of the user who approved/rejected
  actionDate?: string; // ISO string of the approval/rejection date
  collectedBy?: string; // Username of the staff who marked as collected
  collectionDate?: string; // ISO string of the collection date
}

export type PurchaseOrderStatus = 'Pending Approval' | 'Approved' | 'Rejected' | 'Received';

export interface PurchaseOrder {
  id: string;
  vendorId: string;
  productId: string;
  productName: string;
  quantity: number;
  requestDate: string; // ISO
  requestedBy: string; // username of staff
  status: PurchaseOrderStatus;
  notes?: string;
  approvedBy?: string; // username of approver
  actionDate?: string; // ISO
  receivedBy?: string; // username of receiver
  receivedDate?: string; // ISO
}

export interface StockAdjustment {
  id: string;
  productId: string;
  productName: string;
  quantityChange: number; // Can be positive or negative
  reason: 'Stocktake' | 'Damaged Goods' | 'Return' | 'Found' | 'Other';
  date: string; // ISO date string
  adjustedBy: string; // username
  notes?: string;
}

export interface Notification {
    id: string;
    message: React.ReactNode;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: string; // ISO date string
    isRead: boolean;
    link?: {
        view: View;
        itemId: string;
    };
}


export interface AuditLog {
  id: string;
  timestamp: string; // ISO date string
  user: string;
  action: string;
  details: string;
}


export type View = 'dashboard' | 'inventory' | 'vendors' | 'requests' | 'purchase-orders' | 'reports' | 'admin' | 'audit-log' | 'adjustments';

export type SortDirection = 'asc' | 'desc';

export type ProductKey = keyof Product;

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}

export interface StockMovement {
  id: string;
  date: string;
  productName: string;
  type: 'Incoming' | 'Outgoing';
  quantity: number;
  details: string;
  user: string;
}

export type FormErrors = Partial<Record<keyof Omit<Product, 'id' | 'lastUpdated' | 'lastModifiedBy'>, string>>;

export type VendorFormErrors = Partial<Record<keyof Omit<Vendor, 'id' | 'lastModifiedBy' | 'lastUpdated'>, string>>;

export type RequestFormErrors = {
  requestingDivision?: string;
  productId?: string;
  quantity?: string;
  priority?: string;
};

export type PurchaseOrderFormErrors = {
  vendorId?: string;
  productId?: string;
  quantity?: string;
};

export type StockAdjustmentFormErrors = {
  productId?: string;
  quantityChange?: string;
  reason?: string;
};


export type UserRole = 'Staff' | 'Supervisor' | 'Manager' | 'Viewer' | 'Super Admin';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  profilePictureUrl?: string;
}

export type AddUserFormErrors = Partial<Record<keyof Omit<User, 'id'>, string>> & {
    password?: string;
    confirmPassword?: string;
};