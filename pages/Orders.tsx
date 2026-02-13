import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToUserOrders } from '../services/firestoreService';
import { Order, OrderStatus } from '../types';
import { formatPrice, formatDate, formatTime } from '../utils/formatters';
import { Loader2, Package, Clock, CheckCircle, Utensils, Check, XCircle, ArrowRight } from 'lucide-react';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const configs = {
    [OrderStatus.PENDING]: {
      style: 'border border-dashed border-gray-600 text-gray-400',
      label: 'Pending Approval',
      icon: <Clock className="w-3 h-3 mr-2 animate-pulse" />
    },
    [OrderStatus.CONFIRMED]: {
      style: 'border border-white text-white bg-black',
      label: 'Accepted',
      icon: <CheckCircle className="w-3 h-3 mr-2" />
    },
    [OrderStatus.PREPARING]: {
      style: 'border border-white bg-gray-900 text-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.1)]',
      label: 'Preparing',
      icon: <Loader2 className="w-3 h-3 mr-2 animate-spin" />
    },
    [OrderStatus.READY]: {
      style: 'bg-white text-black border-2 border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] transform scale-105',
      label: 'Ready for Pickup',
      icon: <Utensils className="w-3 h-3 mr-2" />
    },
    [OrderStatus.COMPLETED]: {
      style: 'bg-gray-900 text-gray-600 border border-gray-900',
      label: 'Completed',
      icon: <Check className="w-3 h-3 mr-2" />
    },
    [OrderStatus.CANCELLED]: {
      style: 'text-red-900 border border-dashed border-red-900/50 bg-red-900/10 opacity-70',
      label: 'Cancelled',
      icon: <XCircle className="w-3 h-3 mr-2" />
    },
  };

  const config = configs[status];

  return (
    <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm ${config.style}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const OrderProgressBar: React.FC<{ status: OrderStatus }> = ({ status }) => {
  let progress = 0;
  let animate = false;

  switch (status) {
    case OrderStatus.PENDING: progress = 10; break;
    case OrderStatus.CONFIRMED: progress = 30; break;
    case OrderStatus.PREPARING: progress = 70; animate = true; break;
    case OrderStatus.READY: progress = 100; break;
    default: return null;
  }

  return (
    <div className="w-full h-1 bg-gray-800 mt-6 overflow-hidden">
      <div 
        className={`h-full bg-white transition-all duration-1000 ease-out ${animate ? 'animate-[pulse_2s_infinite]' : ''}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToUserOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div className="flex justify-center py-32"><Loader2 className="animate-spin w-6 h-6 text-white" /></div>;

  const activeOrders = orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
  const pastOrders = orders.filter(o => [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));

  return (
    <div className="max-w-4xl mx-auto space-y-16">
      
      {/* ACTIVE ORDERS SECTION */}
      {activeOrders.length > 0 && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex items-end justify-between border-b border-white pb-4">
            <h2 className="text-3xl font-serif font-bold text-white flex items-center">
              <span className="w-3 h-3 bg-white rounded-full mr-4 animate-pulse"></span>
              Live Kitchen Status
            </h2>
            <span className="text-sm font-mono text-gray-400">{activeOrders.length} ACTIVE</span>
          </div>

          <div className="grid gap-8">
            {activeOrders.map(order => (
              <div 
                key={order.id} 
                className={`relative p-8 transition-all duration-500 animate-fade-in ${
                  order.status === OrderStatus.READY 
                    ? 'bg-white text-black shadow-[0_0_40px_rgba(255,255,255,0.15)] scale-[1.02]' 
                    : 'bg-black border border-white'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                       <StatusBadge status={order.status} />
                       <span className={`font-mono text-xs ${order.status === OrderStatus.READY ? 'text-gray-500' : 'text-gray-500'}`}>#{order.id.slice(0, 6)}</span>
                    </div>
                    <div className="text-4xl font-serif font-bold mt-2">
                      {formatTime(order.scheduledTime)}
                    </div>
                    <p className={`text-sm uppercase tracking-widest mt-1 ${order.status === OrderStatus.READY ? 'text-gray-600' : 'text-gray-400'}`}>
                      Estimated Pickup
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className={`text-2xl font-mono font-medium ${order.status === OrderStatus.READY ? 'text-black' : 'text-white'}`}>
                      {formatPrice(order.totalAmount)}
                    </p>
                    <p className={`text-xs uppercase tracking-widest ${order.status === OrderStatus.READY ? 'text-gray-500' : 'text-gray-500'}`}>
                      {order.items.length} Items
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className={`border-t pt-6 ${order.status === OrderStatus.READY ? 'border-gray-200' : 'border-gray-800'}`}>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between text-sm items-center py-1">
                        <span className="font-medium">
                          <span className={`font-mono mr-3 ${order.status === OrderStatus.READY ? 'text-gray-400' : 'text-gray-600'}`}>
                            {item.quantity}x
                          </span> 
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Progress Bar */}
                {order.status !== OrderStatus.READY && <OrderProgressBar status={order.status} />}
                
                {/* Ready Banner */}
                {order.status === OrderStatus.READY && (
                  <div className="mt-6 bg-black text-white text-center py-3 text-sm font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 animate-pop">
                    <Utensils className="w-4 h-4" /> Ready for Pickup
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PAST ORDERS SECTION */}
      <div className="space-y-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="border-b border-gray-800 pb-4">
          <h2 className="text-2xl font-serif font-bold text-gray-500">History</h2>
        </div>

        {pastOrders.length === 0 && activeOrders.length === 0 ? (
          <div className="text-center py-24 border border-gray-800 bg-gray-900/20">
            <Package className="w-10 h-10 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-serif font-bold text-white">No orders yet</h3>
            <p className="text-gray-500 mt-2 text-sm">Your order history will appear here.</p>
          </div>
        ) : (
          <div className="grid gap-4 opacity-60 hover:opacity-100 transition-opacity duration-300">
            {pastOrders.map(order => (
              <div key={order.id} className="bg-black border border-gray-800 p-6 flex flex-col md:flex-row justify-between items-center gap-4 group hover:border-gray-600 transition-all duration-300 hover:bg-gray-900/30">
                 <div className="flex items-center gap-6 w-full md:w-auto">
                    <StatusBadge status={order.status} />
                    <div>
                      <div className="text-white font-serif font-bold text-lg">
                        {formatDate(order.scheduledTime)}
                      </div>
                      <div className="text-gray-500 text-xs font-mono">
                        #{order.id.slice(0, 8)} • {formatTime(order.scheduledTime)}
                      </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                       <span className="block text-white font-mono">{formatPrice(order.totalAmount)}</span>
                       <span className="block text-gray-600 text-xs">{order.items.length} items</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-colors duration-300" />
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};