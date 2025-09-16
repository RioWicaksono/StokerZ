import React from 'react';
import { Vendor, Product } from '../types';
import { XMarkIcon } from './icons/Icons';
import { formatNumber, formatDate } from '../utils/helpers';

interface VendorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendor?: Vendor;
  products: Product[];
}

const DetailItem: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <p className="text-sm font-medium text-gray-500">{label}</p>
    <div className="text-gray-800 font-semibold mt-1">{children}</div>
  </div>
);

const VendorDetailModal: React.FC<VendorDetailModalProps> = ({ isOpen, onClose, vendor, products }) => {
  if (!isOpen || !vendor) return null;

  const suppliedProducts = products.filter(p => p.supplierId === vendor.id);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vendor-detail-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        <div className="p-6 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 id="vendor-detail-title" className="text-xl font-bold text-gray-800">
            Vendor Details
          </h2>
           <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <XMarkIcon className="w-6 h-6" />
            </button>
        </div>
        <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-6">
                <div className="sm:col-span-2">
                    <DetailItem label="Vendor Name">{vendor.name}</DetailItem>
                </div>
                <DetailItem label="Category">{vendor.category}</DetailItem>
                <DetailItem label="Contact Person">{vendor.contactPerson}</DetailItem>
                <DetailItem label="Email">
                    <a href={`mailto:${vendor.email}`} className="text-primary-600 hover:underline">{vendor.email}</a>
                </DetailItem>
                <DetailItem label="Phone">{vendor.phone}</DetailItem>
                {vendor.lastModifiedBy && (
                   <>
                    <DetailItem label="Last Modified Date">
                      {vendor.lastUpdated ? formatDate(vendor.lastUpdated) : 'N/A'}
                    </DetailItem>
                    <DetailItem label="Last Modified By">
                        <span className="capitalize">{vendor.lastModifiedBy}</span>
                    </DetailItem>
                   </>
                )}
            </div>
            
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3 border-t pt-4">Products Supplied by this Vendor</h3>
                {suppliedProducts.length > 0 ? (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-left text-gray-600">
                                <tr>
                                    <th className="p-3 font-medium">Product Name</th>
                                    <th className="p-3 font-medium">SKU</th>
                                    <th className="p-3 font-medium text-right">Stock</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliedProducts.map(product => (
                                    <tr key={product.id} className="border-t">
                                        <td className="p-3 font-semibold text-gray-800">{product.name}</td>
                                        <td className="p-3 text-gray-600">{product.sku}</td>
                                        <td className="p-3 text-right text-gray-600">{formatNumber(product.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-500">This vendor does not currently supply any products in the inventory.</p>
                    </div>
                )}
            </div>
        </div>
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 rounded-b-xl flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorDetailModal;