import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllOrders, updateOrderStatus } from '../services/firestoreService';
import { Order, OrderStatus } from '../types';
import { formatTime, formatPrice } from '../utils/formatters';
import { Navigate } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import { Coffee, Copy, Check, Phone, User } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'completed'>('active');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  if (!user || !isAdmin) return <Navigate to={ROUTES.HOME} replace />;

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const activeOrders = orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
  const completedOrders = orders.filter(o => [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));
  const displayOrders = activeOrderTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 border-b border-white pb-8">
        <div>
           <h1 className="text-4xl font-serif font-bold text-white animate-fade-in">Command Center</h1>
        </div>
      </div>

      <div className="space-y-8 animate-fade-in">
        <div className="flex gap-8 border-b border-gray-800">
            <button 
              onClick={() => setActiveOrderTab('active')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${activeOrderTab === 'active' ? 'border-b-2 border-white text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              Live Orders ({activeOrders.length})
            </button>
            <button 
              onClick={() => setActiveOrderTab('completed')}
              className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${activeOrderTab === 'completed' ? 'border-b-2 border-white text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
            >
              Archive
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayOrders.length === 0 && (
            <div className="col-span-full text-center py-24 border border-dashed border-gray-800 animate-fade-in">
              <Coffee className="w-8 h-8 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 font-mono text-sm">No orders in queue.</p>
            </div>
          )}
          
          {displayOrders.map(order => (
            <div key={order.id} className={`bg-black border p-6 transition-all duration-500 animate-fade-in relative ${order.status === OrderStatus.READY ? 'border-white ring-1 ring-white' : 'border-gray-800'}`}>
              {order.status === OrderStatus.READY && (
                  <div className="absolute top-0 left-0 right-0 bg-white text-black text-xs font-bold text-center py-1 uppercase tracking-widest animate-pop">Ready for Pickup</div>
              )}
              
              <div className={`flex justify-between items-start mb-4 ${order.status === OrderStatus.READY ? 'mt-4' : ''}`}>
                <div>
                  <h3 className="font-bold text-xl text-white">{order.customerName || order.userEmail.split('@')[0]}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 6)}</span>
                    {order.customerMobile && (
                      <a href={`tel:${order.customerMobile}`} className="flex items-center text-xs text-gray-400 hover:text-white">
                        <Phone className="w-3 h-3 mr-1" /> {order.customerMobile}
                      </a>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-mono font-medium text-white">{formatTime(order.scheduledTime)}</p>
                  <p className="text-xs text-gray-400 font-mono mt-1">{formatPrice(order.totalAmount)}</p>
                </div>
              </div>

              {/* Transaction ID Display */}
              <div className="bg-gray-900 border border-gray-800 p-2 mb-4 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Transaction ID</span>
                  <span className="text-xs font-mono text-white">{order.transactionId || 'N/A'}</span>
                </div>
                {order.transactionId && (
                  <button 
                    onClick={() => copyToClipboard(order.transactionId)}
                    className="text-gray-400 hover:text-white p-1"
                    title="Copy ID"
                  >
                    {copiedId === order.transactionId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>

              <div className="border-t border-b border-gray-800 py-4 mb-6 space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-medium text-gray-300"><span className="font-mono text-gray-500 mr-2">{item.quantity}x</span> {item.name}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {order.status === OrderStatus.PENDING && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.CONFIRMED)}
                    className="col-span-2 flex items-center justify-center gap-2 bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors duration-200"
                  >
                    Verify & Accept
                  </button>
                )}
                {order.status === OrderStatus.CONFIRMED && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                    className="col-span-2 flex items-center justify-center gap-2 border border-white bg-black text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-colors duration-200"
                  >
                    Start Preparation
                  </button>
                )}
                {order.status === OrderStatus.PREPARING && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                    className="col-span-2 flex items-center justify-center gap-2 bg-white text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors duration-200"
                  >
                    Mark Ready
                  </button>
                )}
                {order.status === OrderStatus.READY && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.COMPLETED)}
                    className="col-span-2 flex items-center justify-center gap-2 border border-gray-700 text-gray-400 py-3 text-xs font-bold uppercase tracking-widest hover:border-white hover:text-white transition-colors duration-200"
                  >
                    Archive
                  </button>
                )}
                
                {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING) && (
                  <button 
                    onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                    className="col-span-2 text-center text-xs text-gray-500 hover:text-red-500 hover:underline mt-1 transition-colors duration-200"
                  >
                    Reject / Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};