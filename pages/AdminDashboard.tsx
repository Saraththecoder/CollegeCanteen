import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToAllOrders, updateOrderStatus, getAllMenuItemsAdmin, addMenuItem, updateMenuItem } from '../services/firestoreService';
import { Order, OrderStatus, MenuItem, ProductCategory } from '../types';
import { formatTime, formatPrice } from '../utils/formatters';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../constants';
import { Utensils, Plus, Image as ImageIcon, X, Coffee, List } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  
  const [view, setView] = useState<'kitchen' | 'menu'>('kitchen');
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'completed'>('active');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const [newItem, setNewItem] = useState<Partial<MenuItem>>({
    name: '',
    description: '',
    price: 0,
    category: ProductCategory.Lunch,
    imageUrl: '',
    preparationTime: 10,
    isAvailable: true
  });

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (view === 'menu' && isAdmin) {
      setLoadingMenu(true);
      getAllMenuItemsAdmin()
        .then(setMenuItems)
        .finally(() => setLoadingMenu(false));
    }
  }, [view, isAdmin, isAddingItem]);

  if (!user || !isAdmin) return <Navigate to={ROUTES.HOME} />;

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

  const handleToggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await updateMenuItem(id, { isAvailable: !currentStatus });
      setMenuItems(prev => prev.map(item => item.id === id ? { ...item, isAvailable: !currentStatus } : item));
    } catch (e) {
      console.error("Failed to toggle availability", e);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMenuItem(newItem as MenuItem);
      setIsAddingItem(false);
      setNewItem({
        name: '',
        description: '',
        price: 0,
        category: ProductCategory.Lunch,
        imageUrl: '',
        preparationTime: 10,
        isAvailable: true
      });
    } catch (e) {
      console.error("Failed to add item", e);
      alert("Failed to add item. Check permissions.");
    }
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
        
        <div className="flex border border-white p-1">
          <button
            onClick={() => setView('kitchen')}
            className={`flex items-center px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${view === 'kitchen' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Kitchen
          </button>
          <button
            onClick={() => setView('menu')}
            className={`flex items-center px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300 ${view === 'menu' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Menu
          </button>
        </div>
      </div>

      {view === 'kitchen' && (
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
                
                <div className={`flex justify-between items-start mb-6 ${order.status === OrderStatus.READY ? 'mt-4' : ''}`}>
                  <div>
                    <h3 className="font-bold text-xl text-white">{order.userEmail.split('@')[0]}</h3>
                    <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 6)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-medium text-white">{formatTime(order.scheduledTime)}</p>
                  </div>
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
                      Accept Order
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
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'menu' && (
        <div className="animate-fade-in space-y-8">
          {!isAddingItem ? (
             <button 
               onClick={() => setIsAddingItem(true)}
               className="flex items-center gap-2 bg-white text-black px-8 py-4 text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors"
             >
               <Plus className="w-4 h-4" /> Add Item
             </button>
          ) : (
            <div className="bg-black border border-white p-8 max-w-2xl animate-fade-in">
              <div className="flex justify-between items-center mb-8 border-b border-white pb-4">
                <h2 className="text-2xl font-serif font-bold text-white">New Item</h2>
                <button onClick={() => setIsAddingItem(false)} className="text-gray-400 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
              </div>
              
              <form onSubmit={handleAddItem} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Name</label>
                    <input 
                      required
                      type="text" 
                      value={newItem.name}
                      onChange={e => setNewItem({...newItem, name: e.target.value})}
                      className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Price</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={newItem.price}
                      onChange={e => setNewItem({...newItem, price: parseFloat(e.target.value)})}
                      className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                   <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Description</label>
                   <textarea 
                      required
                      value={newItem.description}
                      onChange={e => setNewItem({...newItem, description: e.target.value})}
                      className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none h-24 resize-none"
                    />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Category</label>
                    <select 
                      value={newItem.category}
                      onChange={e => setNewItem({...newItem, category: e.target.value as ProductCategory})}
                      className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none"
                    >
                      {Object.values(ProductCategory).map(c => (
                        <option key={c} value={c} className="capitalize bg-black">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Prep (min)</label>
                    <input 
                      required
                      type="number" 
                      value={newItem.preparationTime}
                      onChange={e => setNewItem({...newItem, preparationTime: parseInt(e.target.value)})}
                      className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Image URL</label>
                  <input 
                    required
                    type="url" 
                    placeholder="https://..."
                    value={newItem.imageUrl}
                    onChange={e => setNewItem({...newItem, imageUrl: e.target.value})}
                    className="w-full bg-black border border-gray-700 px-4 py-3 focus:border-white text-white outline-none"
                  />
                </div>

                <div className="pt-6 flex justify-end gap-4">
                  <button type="button" onClick={() => setIsAddingItem(false)} className="px-6 py-3 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button type="submit" className="px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-200 transition-colors">Save</button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {menuItems.map(item => (
               <div key={item.id} className={`flex gap-6 p-4 border transition-all duration-300 animate-fade-in ${!item.isAvailable ? 'opacity-50 border-dashed border-gray-700 bg-gray-900' : 'border-gray-800 bg-black'}`}>
                 <div className="w-24 h-24 bg-gray-900 flex-shrink-0">
                   <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                 </div>
                 
                 <div className="flex-grow flex flex-col justify-between py-1">
                   <div>
                     <div className="flex justify-between items-start">
                       <h3 className="font-bold text-white text-lg">{item.name}</h3>
                       <span className="font-mono text-sm text-gray-400">{formatPrice(item.price)}</span>
                     </div>
                     <p className="text-sm text-gray-500 line-clamp-1 mt-1">{item.description}</p>
                   </div>

                   <div className="flex items-center justify-between mt-2">
                      <button 
                        onClick={() => handleToggleAvailability(item.id, item.isAvailable)}
                        className={`text-xs font-bold uppercase tracking-widest underline underline-offset-4 transition-colors duration-200 ${item.isAvailable ? 'text-white' : 'text-gray-500'}`}
                      >
                        {item.isAvailable ? 'Active' : 'Sold Out'}
                      </button>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};
const Image = ({ as: Component, ...props }: any) => <Component {...props} />;