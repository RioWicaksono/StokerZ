import React, { useMemo } from 'react';
import { Product, View, PurchaseOrder } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency, formatNumber } from '../utils/helpers';
import { CubeIcon, MoneyIcon, CategoryIcon, WarningIcon, ShoppingCartIcon } from './icons/Icons';

interface DashboardProps {
  products: Product[];
  purchaseOrders: PurchaseOrder[];
  setCurrentView: (view: View) => void;
}

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, gradient }) => (
    <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className={`rounded-full p-3 text-white ${gradient}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ products, purchaseOrders, setCurrentView }) => {
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.quantity, 0);
    const totalValue = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const lowStockCount = products.filter(p => p.quantity < 5).length;
    const pendingPOCount = purchaseOrders.filter(po => po.status === 'Pending Approval').length;
    return { totalProducts, totalStock, totalValue, lowStockCount, pendingPOCount };
  }, [products, purchaseOrders]);

  const categoryData = useMemo(() => {
    const categories: { [key: string]: number } = {};
    products.forEach(product => {
      if (categories[product.category]) {
        categories[product.category] += product.quantity;
      } else {
        categories[product.category] = product.quantity;
      }
    });
    return Object.keys(categories).map(name => ({
      name,
      count: categories[name],
    }));
  }, [products]);

  const lowStockProductsList = useMemo(() => {
    return products
        .filter(p => p.quantity < 5)
        .sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  const topValueProducts = useMemo(() => {
    return products
        .map(p => ({
            ...p,
            totalValue: p.quantity * p.price,
        }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 5);
  }, [products]);

  const PIE_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'];

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Do not render labels for very small slices

    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-sm font-bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Top Row: Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
            icon={<CubeIcon className="w-6 h-6"/>} 
            title="Total Product Types" 
            value={formatNumber(stats.totalProducts)}
            gradient="bg-gradient-to-br from-primary-400 to-primary-600"
        />
        <StatCard 
            icon={<MoneyIcon className="w-6 h-6"/>} 
            title="Inventory Value" 
            value={formatCurrency(stats.totalValue, 'IDR')}
            gradient="bg-gradient-to-br from-emerald-400 to-emerald-600"
        />
        <StatCard 
            icon={<CategoryIcon className="w-6 h-6"/>} 
            title="Total Stock Items" 
            value={formatNumber(stats.totalStock)}
            gradient="bg-gradient-to-br from-sky-400 to-sky-600"
        />
        <StatCard 
            icon={<WarningIcon className="w-6 h-6"/>} 
            title="Critical Stock (<5)" 
            value={formatNumber(stats.lowStockCount)}
            gradient="bg-gradient-to-br from-rose-400 to-rose-600"
        />
        <StatCard 
            icon={<ShoppingCartIcon className="w-6 h-6"/>} 
            title="Pending POs" 
            value={formatNumber(stats.pendingPOCount)}
            gradient="bg-gradient-to-br from-violet-400 to-violet-600"
        />
      </div>

      {/* Bottom Section: Charts and Lists */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Count per Category</h3>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer>
              <BarChart data={categoryData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} />
                <YAxis tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(226, 232, 240, 0.5)'}}
                  contentStyle={{ 
                      backgroundColor: 'white',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.5rem'
                  }}
                  formatter={(value) => [`${formatNumber(value as number)} units`, 'Count']}
                />
                <Legend wrapperStyle={{fontSize: "14px"}}/>
                <Bar dataKey="count" fill="#f59e0b" name="Stock Count" barSize={40} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Stock Distribution per Category</h3>
          <div className="relative flex-1 w-full h-full min-h-[300px]">
            {categoryData.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-3xl font-bold text-slate-800">{formatNumber(stats.totalStock)}</p>
                  <p className="text-sm text-slate-500">Total Units</p>
                </div>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={120}
                      innerRadius={75}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="name"
                      paddingAngle={2}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [`${formatNumber(value as number)} units`, name]}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '0.5rem',
                      }}
                    />
                    <Legend iconSize={12} wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-slate-500 text-center py-4">
                  No category data to display.
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Low Stock List */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex-shrink-0">Low Stock Products</h3>
          <div className="flex-1 overflow-y-auto">
            {lowStockProductsList.length > 0 ? (
                <table className="w-full text-sm border-collapse border border-slate-300">
                  <thead className="text-left text-slate-500 sticky top-0 bg-white">
                    <tr>
                      <th className="p-2 font-medium border border-slate-300">Product Name</th>
                      <th className="p-2 font-medium text-right border border-slate-300">Remaining Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockProductsList.map(product => (
                      <tr key={product.id}>
                        <td className="p-2 font-semibold text-slate-700 border border-slate-300">{product.name}</td>
                        <td className="p-2 text-right border border-slate-300">
                          <span className="font-bold text-red-600">{formatNumber(product.quantity)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            ) : (
              <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500 text-center py-4">
                  👍 All product stocks are at safe levels.
                  </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Top Products List */}
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h3 className="text-lg font-semibold text-slate-800">Top Products</h3>
              <button 
                onClick={() => setCurrentView('inventory')}
                className="text-sm text-primary-600 font-semibold hover:underline"
                aria-label="View all products in inventory page"
              >
                View All &rarr;
              </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {topValueProducts.length > 0 ? (
                <table className="w-full text-sm border-collapse border border-slate-300">
                    <thead className="text-left text-slate-500 sticky top-0 bg-white">
                    <tr>
                        <th className="p-2 font-medium border border-slate-300">Product Name</th>
                        <th className="p-2 font-medium text-right border border-slate-300">Product Value</th>
                    </tr>
                    </thead>
                    <tbody>
                    {topValueProducts.map(product => (
                        <tr key={product.id}>
                        <td className="p-2 font-semibold text-slate-700 border border-slate-300">{product.name}</td>
                        <td className="p-2 text-right font-semibold text-emerald-700 border border-slate-300">
                            {formatCurrency(product.totalValue, 'IDR')}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-500 text-center py-4">
                      No product data.
                  </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;