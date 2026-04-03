'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  getMyProducts, 
  getSellerOrders, 
  getOpenRFQs, 
  getSellerAnalytics,
  Product, 
  Order, 
  RFQ 
} from '@/lib/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SellerDashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [rfqs, setRFQs] = useState<RFQ[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, ordersData, rfqsData, analyticsData] = await Promise.all([
        getMyProducts(),
        getSellerOrders(),
        getOpenRFQs(),
        getSellerAnalytics(),
      ]);
      setProducts(productsData);
      setOrders(ordersData);
      setRFQs(rfqsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !analytics) return (
     <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-gray-100 border-t-green-600 rounded-full animate-spin" />
     </div>
  );

  // Group sales for charts
  const chartData = analytics.salesHistory.map((s: any) => ({
     date: new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
     amount: s.totalPrice
  }));

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-10 bg-gray-50/30 min-h-screen">
      
      {/* Header & Verification Warning */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
         <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Business Command Center</h1>
            <p className="text-gray-500 font-medium mt-1">Good morning! Here is how your agro-business is performing today.</p>
         </div>
         <div className="flex gap-4">
            <Link href="/seller/products/new">
               <Button className="h-14 px-8 rounded-2xl bg-gray-900 hover:bg-black text-white font-bold shadow-2xl shadow-gray-200">
                  + Add Machinery
               </Button>
            </Link>
         </div>
      </div>

      {!analytics.verificationStatus && (
         <Card className="mb-10 p-6 bg-yellow-50 border-yellow-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex gap-4 items-center">
               <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-700">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
               </div>
               <div>
                  <p className="font-bold text-yellow-900">Account Unverified</p>
                  <p className="text-sm text-yellow-700">Submit your CAC documentation to unlock the "Verified Seller" badge and gain buyer trust.</p>
               </div>
            </div>
            <Link href="/seller/verification">
               <Button variant="outline" className="border-yellow-200 text-yellow-700 font-bold px-8 h-12 rounded-xl bg-white hover:bg-yellow-100">Verify Now</Button>
            </Link>
         </Card>
      )}

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
         {[
            { label: 'MTD Revenue', value: `₦${analytics.revenue.currentMonth.toLocaleString()}`, trend: `${analytics.revenue.pctChange > 0 ? '+' : ''}${analytics.revenue.pctChange.toFixed(1)}%`, color: 'blue' },
            { label: 'Total Orders', value: orders.length, trend: 'All Time', color: 'green' },
            { label: 'Active RFQs', value: analytics.funnel.totalRfqs, trend: 'Nigeria Wide', color: 'purple' },
            { label: 'Conversion', value: `${analytics.funnel.conversionRate.toFixed(1)}%`, trend: 'Quote-to-Order', color: 'orange' }
         ].map((stat, i) => (
            <Card key={i} className="p-8 border-none shadow-xl shadow-gray-100 rounded-[2.5rem] bg-white group hover:scale-[1.02] transition-all">
               <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
               <h3 className="text-3xl font-black text-gray-900 mb-1">{stat.value}</h3>
               <p className={`text-xs font-bold ${stat.color === 'blue' ? 'text-blue-500' : 'text-gray-400'}`}>
                  {stat.trend} <span className="font-medium text-gray-300 ml-1">from last month</span>
               </p>
            </Card>
         ))}
      </div>

      {/* Charts & Funnel row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
         
         <Card className="lg:col-span-2 p-10 border-none shadow-2xl shadow-gray-100 rounded-[3rem] bg-white">
            <div className="flex justify-between items-end mb-8">
               <div>
                  <h3 className="text-2xl font-black text-gray-900">Revenue Velocity</h3>
                  <p className="text-sm font-medium text-gray-400">Sales performance over the last 7 days</p>
               </div>
            </div>
            <div className="h-80 w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <defs>
                        <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1}/>
                           <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Tooltip 
                        contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', fontWeight: '700' }}
                     />
                     <Area type="monotone" dataKey="amount" stroke="#16a34a" strokeWidth={4} fillOpacity={1} fill="url(#colorAmt)" />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </Card>

         <Card className="lg:col-span-1 p-10 border-none shadow-2xl shadow-gray-100 rounded-[3rem] bg-gray-900 text-white overflow-hidden relative">
            <h3 className="text-2xl font-black mb-1.5">Sales Funnel</h3>
            <p className="text-gray-400 text-sm font-medium mb-10">B2B Negotiation Efficiency</p>
            
            <div className="space-y-8 relative z-10">
               {[
                  { label: 'Total Opportunities', value: analytics.funnel.totalRfqs, width: '100%', color: 'bg-white/10' },
                  { label: 'Quotes Sent', value: analytics.funnel.quotesSent, width: '70%', color: 'bg-green-500' },
                  { label: 'Confirmed Orders', value: analytics.funnel.ordersCreated, width: '40%', color: 'bg-blue-500' }
               ].map((item, i) => (
                  <div key={i} className="space-y-2">
                     <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-gray-400">{item.label}</span>
                        <span>{item.value}</span>
                     </div>
                     <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: item.width }} />
                     </div>
                  </div>
               ))}
            </div>

            {/* Accent Circle */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
         </Card>
      </div>

      {/* Bottom Table: Recent Orders */}
      <Card className="p-10 border-none shadow-2xl shadow-gray-100 rounded-[3rem] bg-white overflow-hidden">
         <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-gray-900">Pipeline Timeline</h3>
            <Link href="/seller/orders" className="text-sm font-bold text-green-600 hover:text-green-700">Recent Transactions &rarr;</Link>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full">
               <thead>
                  <tr className="text-left text-xs font-black uppercase tracking-[0.2em] text-gray-400 border-b border-gray-50">
                     <th className="pb-6">Product & Buyer</th>
                     <th className="pb-6">Amount</th>
                     <th className="pb-6">Status</th>
                     <th className="pb-6">Date</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {orders.slice(0, 5).map((order) => (
                     <tr key={order.id} className="group hover:bg-gray-50/50 transition-all">
                        <td className="py-6 pr-4">
                           <div className="flex gap-4 items-center">
                              <div className="w-12 h-12 bg-gray-50 rounded-2xl overflow-hidden shrink-0">
                                 {order.productImage ? <img src={order.productImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-300">N/A</div>}
                              </div>
                              <div>
                                 <p className="font-bold text-gray-900 group-hover:text-green-600 transition-colors uppercase tracking-tight text-sm truncate max-w-xs">{order.productName}</p>
                                 <p className="text-xs text-gray-400 font-medium">{order.buyerName}</p>
                              </div>
                           </div>
                        </td>
                        <td className="py-6 font-black text-gray-900">
                           ₦{order.totalPrice.toLocaleString()}
                        </td>
                        <td className="py-6">
                           <Badge className={`rounded-xl px-4 py-1.5 border-none font-bold text-[10px] ${
                              order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                              order.status === 'SHIPPED' ? 'bg-purple-100 text-purple-700' :
                              order.status === 'PAID' ? 'bg-blue-100 text-blue-700' :
                              'bg-yellow-100 text-yellow-700'
                           }`}>
                              {order.status}
                           </Badge>
                        </td>
                        <td className="py-6 text-xs text-gray-400 font-bold uppercase tracking-wider">
                           {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </Card>

    </div>
  );
}
