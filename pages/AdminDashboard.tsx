import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { 
  subscribeToActiveOrders, 
  getPaginatedOrders,
  updateOrderStatus, 
  getAllMenuItemsAdmin,
  updateMenuItem,
  addMenuItem,
  deleteMenuItem,
  getUnverifiedUsers,
  verifyUserAccount
} from '../services/firestoreService';
import { Order, OrderStatus, MenuItem, ProductCategory, UserProfile } from '../types';
import { formatTime, formatPrice } from '../utils/formatters';
import { Coffee, Copy, Check, Phone, Power, Loader2, Package, Plus, Trash2, Save, X, Edit2, TrendingUp, DollarSign, CreditCard, AlertCircle, UserCheck } from 'lucide-react';
import { WelcomeToast } from '../components/WelcomeToast';
import { SuccessScreen } from '../components/SuccessScreen';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isStoreOpen, setStoreOpen } = useStore();
  
  // View State
  const [currentView, setCurrentView] = useState<'orders' | 'inventory' | 'verification'>('orders');
  
  // Orders State
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [historicalOrders, setHistoricalOrders] = useState<Order[]>([]);
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'completed'>('active');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'all'>('today');
  const [lastVisibleOrder, setLastVisibleOrder] = useState<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Store Toggle State
  const [isTogglingStore, setIsTogglingStore] = useState(false);

  // Inventory State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  
  // Verification State
  const [unverifiedUsers, setUnverifiedUsers] = useState<UserProfile[]>([]);

  // Add Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    description: string;
    price: string;
    category: ProductCategory;
    imageUrl: string;
    preparationTime: string;
    isAvailable: boolean;
    isVegetarian: boolean;
    isSpicy: boolean;
  }>({
    name: '',
    description: '',
    price: '',
    category: ProductCategory.Snacks,
    imageUrl: '',
    preparationTime: '10',
    isAvailable: true,
    isVegetarian: true,
    isSpicy: false
  });

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribeOrders = subscribeToActiveOrders((data) => {
      setActiveOrders(data);
    });
    
    // Load unverified users once
    getUnverifiedUsers().then(setUnverifiedUsers).catch(console.error);
    
    // Load inventory to enable price mismatch checks
    loadInventory();
    return () => {
      unsubscribeOrders();
    };
  }, [isAdmin]);

  const loadHistoricalOrders = async (reset = false) => {
    setIsLoadingMore(true);
    const { orders: fetchedOrders, lastVisible } = await getPaginatedOrders(
      dateRange,
      reset ? null : lastVisibleOrder
    );
    
    const filtered = fetchedOrders.filter(o => [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));

    setHistoricalOrders(prev => reset ? filtered : [...prev, ...filtered]);
    setLastVisibleOrder(lastVisible);
    setHasMoreOrders(fetchedOrders.length === 50);
    setIsLoadingMore(false);
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadHistoricalOrders(true);
  }, [isAdmin, dateRange]);

  const loadInventory = async () => {
    setIsInventoryLoading(true);
    try {
      const items = await getAllMenuItemsAdmin();
      setMenuItems(items);
    } catch (e) {
      console.error("Failed to load inventory", e);
    } finally {
      setIsInventoryLoading(false);
    }
  };

  // --- ORDER HANDLERS ---
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

  const handleToggleStore = async () => {
    setIsTogglingStore(true);
    try {
      await setStoreOpen(!isStoreOpen);
    } catch (error: any) {
      console.error("Failed to toggle store", error);
      alert(`Error updating store status: ${error.message || 'Unknown error'}. Check your internet or permissions.`);
    } finally {
      setIsTogglingStore(false);
    }
  };

  // --- INVENTORY HANDLERS ---
  const handleToggleAvailability = async (item: MenuItem) => {
    try {
      // Optimistic update
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i));
      await updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    } catch (e) {
      console.error("Failed to update item availability", e);
      // Revert on failure
      loadInventory();
      alert("Failed to update item.");
    }
  };

  const startEditing = (item: MenuItem) => {
    setEditingItemId(item.id);
    setEditPrice(item.price.toString());
  };

  const savePriceEdit = async (id: string) => {
    const newPrice = parseFloat(editPrice);
    if (isNaN(newPrice) || newPrice <= 0) {
      alert("Please enter a valid price");
      return;
    }
    try {
      await updateMenuItem(id, { price: newPrice });
      setMenuItems(prev => prev.map(i => i.id === id ? { ...i, price: newPrice } : i));
      setEditingItemId(null);
    } catch (e) {
      alert("Failed to update price");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    try {
      await deleteMenuItem(id);
      setMenuItems(prev => prev.filter(i => i.id !== id));
    } catch (e) {
      alert("Failed to delete item");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addMenuItem({
        name: newItem.name,
        description: newItem.description,
        price: parseFloat(newItem.price),
        category: newItem.category,
        imageUrl: newItem.imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        preparationTime: parseInt(newItem.preparationTime),
        isAvailable: newItem.isAvailable,
        isVegetarian: newItem.isVegetarian,
        isSpicy: newItem.isSpicy
      });
      setShowSuccess(true);
      // Don't close immediately, wait for animation
    } catch (error: any) {
      alert("Failed to add item: " + error.message);
    }
  };

  const handleSuccessComplete = () => {
    setShowSuccess(false);
    setIsAddingItem(false);
    setNewItem({
      name: '', description: '', price: '', category: ProductCategory.Snacks, 
      imageUrl: '', preparationTime: '10', isAvailable: true,
      isVegetarian: true, isSpicy: false
    });
    loadInventory();
  };

  const displayOrders = activeOrderTab === 'active' ? activeOrders : historicalOrders;

  // --- STATISTICS CALCULATION ---
  const combinedOrders = [...activeOrders, ...historicalOrders];
  const verifiedRevenue = combinedOrders
    .filter(o => [OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED].includes(o.status))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingRevenue = combinedOrders
    .filter(o => o.status === OrderStatus.PENDING)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const totalOrdersCount = combinedOrders.filter(o => o.status !== OrderStatus.CANCELLED).length;

  return (
    <div className="space-y-8 pb-20">
      {user && <WelcomeToast name={user.displayName} />}
      
      <SuccessScreen 
        isVisible={showSuccess} 
        message="Item Added" 
        subMessage="Menu updated successfully"
        onComplete={handleSuccessComplete}
      />

      {/* HEADER AREA */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-black dark:border-white pb-8 transition-colors duration-300">
        <div>
           <h1 className="text-4xl font-serif font-bold text-black dark:text-white animate-fade-in">Command Center</h1>
           <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">Manage orders, inventory, and store status.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setCurrentView('orders')}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === 'orders' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-black dark:hover:text-white'}`}
          >
            Orders
          </button>
          
          <button
            onClick={() => setCurrentView('inventory')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === 'inventory' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-black dark:hover:text-white'}`}
          >
            <Package className="w-4 h-4" /> Inventory
          </button>

          <button
            onClick={() => setCurrentView('verification')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === 'verification' ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-black dark:hover:text-white'}`}
          >
            <UserCheck className="w-4 h-4" /> Verification
            {unverifiedUsers.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{unverifiedUsers.length}</span>
            )}
          </button>

          {/* Store Controls */}
          <button 
            onClick={handleToggleStore}
            disabled={isTogglingStore}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-bold uppercase tracking-widest border transition-all duration-300 ${
              isStoreOpen 
                ? 'bg-green-500 text-white dark:text-black border-green-500 hover:bg-green-600 dark:hover:bg-green-400' 
                : 'bg-red-700 text-white border-red-700 hover:bg-red-800'
            }`}
          >
            {isTogglingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isStoreOpen ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* --- STATISTICS SECTION --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-white transition-colors">
           <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">Verified Revenue</h3>
              <p className="text-3xl font-serif font-bold text-black dark:text-white mt-2">{formatPrice(verifiedRevenue)}</p>
           </div>
           <div className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-full">
              <DollarSign className="w-5 h-5" />
           </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-white transition-colors">
           <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">Pending Verification</h3>
              <p className="text-3xl font-serif font-bold text-gray-400 dark:text-gray-500 mt-2">{formatPrice(pendingRevenue)}</p>
           </div>
           <div className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-full">
              <CreditCard className="w-5 h-5" />
           </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 flex items-start justify-between group hover:border-black dark:hover:border-white transition-colors">
           <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 group-hover:text-black dark:group-hover:text-white transition-colors">Total Orders</h3>
              <p className="text-3xl font-serif font-bold text-black dark:text-white mt-2">{totalOrdersCount}</p>
           </div>
           <div className="p-3 bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 rounded-full">
              <TrendingUp className="w-5 h-5" />
           </div>
        </div>
      </div>

      {/* --- INVENTORY VIEW --- */}
      {currentView === 'inventory' && (
        <div className="animate-fade-in space-y-8">
          
          {/* Add Item Button */}
          {!isAddingItem ? (
            <button 
              onClick={() => setIsAddingItem(true)}
              className="w-full border border-dashed border-gray-300 dark:border-gray-700 p-8 text-gray-500 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-bold uppercase tracking-widest">Add New Menu Item</span>
            </button>
          ) : (
             <form onSubmit={handleAddItem} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 space-y-6 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-black dark:text-white font-bold uppercase tracking-widest text-lg">Add New Item</h3>
                  <button type="button" onClick={() => setIsAddingItem(false)}><X className="text-gray-400 hover:text-black dark:hover:text-white" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="md:col-span-2 relative group">
                     <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Item Name</label>
                     <input 
                        required 
                        placeholder="e.g. Chicken Caesar Salad" 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors" 
                     />
                   </div>
                   
                   <div>
                     <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Price</label>
                     <input required type="number" step="0.01" placeholder="0.00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors" />
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Category</label>
                      <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as ProductCategory})} className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors appearance-none">
                          {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Prep Time (min)</label>
                      <input type="number" placeholder="10" value={newItem.preparationTime} onChange={e => setNewItem({...newItem, preparationTime: e.target.value})} className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors" />
                   </div>
                   
                   {/* New Dietary Flags */}
                   <div className="grid grid-cols-2 gap-4 md:col-span-2">
                      <div className="flex items-center h-full pt-6">
                        <label className="flex items-center cursor-pointer gap-2">
                           <input 
                              type="checkbox" 
                              checked={newItem.isVegetarian}
                              onChange={e => setNewItem({...newItem, isVegetarian: e.target.checked})}
                              className="w-5 h-5 accent-green-600"
                           />
                           <span className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Vegetarian</span>
                        </label>
                      </div>
                      <div className="flex items-center h-full pt-6">
                        <label className="flex items-center cursor-pointer gap-2">
                           <input 
                              type="checkbox" 
                              checked={newItem.isSpicy}
                              onChange={e => setNewItem({...newItem, isSpicy: e.target.checked})}
                              className="w-5 h-5 accent-orange-600"
                           />
                           <span className="text-sm font-bold uppercase tracking-wide text-gray-600 dark:text-gray-400">Spicy</span>
                        </label>
                      </div>
                   </div>
                   
                   <div className="md:col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold">Image URL</label>
                      <input placeholder="https://..." value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors" />
                   </div>
                   
                   <div className="md:col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 block font-bold flex items-center gap-1">
                         Description
                      </label>
                      <textarea 
                        placeholder="Enter description..." 
                        value={newItem.description} 
                        onChange={e => setNewItem({...newItem, description: e.target.value})} 
                        className="w-full bg-white dark:bg-black border border-gray-300 dark:border-gray-700 p-4 text-black dark:text-white outline-none focus:border-black dark:focus:border-white h-24 transition-colors" 
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">Save Item</button>
             </form>
          )}

          {/* Inventory List */}
          {isInventoryLoading ? (
            <div className="text-center py-12"><Loader2 className="animate-spin w-8 h-8 text-black dark:text-white mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className={`flex flex-col md:flex-row items-center gap-6 p-6 bg-white dark:bg-black border transition-colors duration-300 ${item.isAvailable ? 'border-gray-200 dark:border-gray-800' : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'}`}>
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 flex-shrink-0 relative group border border-gray-200 dark:border-gray-800">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-xl font-serif font-bold text-black dark:text-white">{item.name}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-2">
                       <span className="text-xs text-gray-500 uppercase tracking-wider px-2 py-1 bg-gray-100 dark:bg-gray-900">{item.category}</span>
                       
                       {/* Tags */}
                       {item.isVegetarian !== undefined && (
                         <span className={`flex items-center text-xs font-bold uppercase px-2 py-0.5 border ${item.isVegetarian ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
                           {item.isVegetarian ? 'Veg' : 'Non-Veg'}
                         </span>
                       )}
                    </div>
                  </div>

                  {/* Price Editor */}
                  <div className="flex items-center gap-2">
                    {editingItemId === item.id ? (
                      <div className="flex items-center">
                        <input 
                          type="number" 
                          value={editPrice} 
                          onChange={(e) => setEditPrice(e.target.value)}
                          className="w-20 bg-gray-50 dark:bg-gray-900 border border-black dark:border-white p-2 text-black dark:text-white text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={() => savePriceEdit(item.id)} className="p-2 text-green-600 hover:text-green-500"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingItemId(null)} className="p-2 text-red-600 hover:text-red-500"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-mono text-black dark:text-white font-medium">{formatPrice(item.price)}</span>
                        <button onClick={() => startEditing(item)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-black dark:hover:text-white transition-opacity"><Edit2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest min-w-[100px] transition-colors ${item.isAvailable ? 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200' : 'bg-red-600 text-white hover:bg-red-500'}`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Sold Out'}
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- ORDERS VIEW --- */}
      {currentView === 'orders' && (
        <div className="space-y-8 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
            <div className="flex gap-8">
              <button 
                onClick={() => setActiveOrderTab('active')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${activeOrderTab === 'active' ? 'border-b-2 border-black dark:border-white text-black dark:text-white -mb-4' : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                Live Orders ({activeOrders.length})
              </button>
              <button 
                onClick={() => setActiveOrderTab('completed')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all duration-300 ${activeOrderTab === 'completed' ? 'border-b-2 border-black dark:border-white text-black dark:text-white -mb-4' : 'border-transparent text-gray-500 hover:text-black dark:hover:text-white'}`}
              >
                Archive
              </button>
            </div>
            
            {activeOrderTab === 'completed' && (
              <div className="flex gap-2">
                {(['today', 'week', 'all'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setDateRange(range)}
                    className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest border transition-colors ${dateRange === range ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white' : 'border-gray-300 dark:border-gray-700 text-gray-500 hover:border-black dark:hover:border-white'}`}
                  >
                    {range === 'today' ? "Today" : range === 'week' ? "This Week" : "All Time"}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayOrders.length === 0 && !isLoadingMore && (
              <div className="col-span-full text-center py-24 border border-dashed border-gray-300 dark:border-gray-800 animate-fade-in">
                <Coffee className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">No orders found.</p>
              </div>
            )}
            
            {displayOrders.map(order => {
              // --- Price Mismatch Detection ---
              let recomputedTotal = 0;
              let isMismatch = false;
              if (order.status === OrderStatus.PENDING) {
                recomputedTotal = order.items.reduce((sum, item) => {
                  const liveItem = menuItems.find(m => m.id === item.menuItemId);
                  const price = liveItem ? liveItem.price : item.price;
                  return sum + (price * item.quantity);
                }, 0);
                
                if (Math.abs(recomputedTotal - order.totalAmount) > 0.01) {
                  isMismatch = true;
                }
              }

              return (
              <div key={order.id} className={`bg-white dark:bg-black border p-6 transition-all duration-500 animate-fade-in relative ${order.status === OrderStatus.READY ? 'border-black dark:border-white ring-1 ring-black dark:ring-white shadow-xl' : 'border-gray-200 dark:border-gray-800'}`}>
                {order.status === OrderStatus.READY && (
                    <div className="absolute top-0 left-0 right-0 bg-black dark:bg-white text-white dark:text-black text-xs font-bold text-center py-1 uppercase tracking-widest animate-pop">Ready for Pickup</div>
                )}
                
                <div className={`flex justify-between items-start mb-4 ${order.status === OrderStatus.READY ? 'mt-4' : ''}`}>
                  <div>
                    <h3 className="font-bold text-xl text-black dark:text-white">{order.customerName || order.userEmail.split('@')[0]}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-gray-500">#{order.id.slice(0, 6)}</span>
                      {order.customerMobile && (
                        <a href={`tel:${order.customerMobile}`} className="flex items-center text-xs text-gray-400 hover:text-black dark:hover:text-white">
                          <Phone className="w-3 h-3 mr-1" /> {order.customerMobile}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-medium text-black dark:text-white">{formatTime(order.scheduledTime)}</p>
                    <p className={`text-xs font-mono mt-1 ${isMismatch ? 'text-red-500 font-bold' : 'text-gray-400'}`}>{formatPrice(order.totalAmount)}</p>
                  </div>
                </div>

                {isMismatch && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 p-3 mb-4 flex flex-col">
                    <span className="text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> ⚠️ Price Mismatch
                    </span>
                    <span className="text-red-600 dark:text-red-400 text-xs mt-1">
                      Customer total: {formatPrice(order.totalAmount)} <br/>
                      Actual total: {formatPrice(recomputedTotal)}
                    </span>
                  </div>
                )}

                {/* Transaction ID Display */}
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 mb-4 flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Transaction ID</span>
                    <span className="text-xs font-mono text-black dark:text-white">{order.transactionId || 'N/A'}</span>
                  </div>
                  {order.transactionId && (
                    <button 
                      onClick={() => copyToClipboard(order.transactionId)}
                      className="text-gray-400 hover:text-black dark:hover:text-white p-1"
                      title="Copy ID"
                    >
                      {copiedId === order.transactionId ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                <div className="border-t border-b border-gray-100 dark:border-gray-800 py-4 mb-6 space-y-2">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-medium text-gray-600 dark:text-gray-300"><span className="font-mono text-gray-400 dark:text-gray-500 mr-2">{item.quantity}x</span> {item.name}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {order.status === OrderStatus.PENDING && (
                    <button 
                      onClick={() => {
                        if (isMismatch) {
                          if (!window.confirm(`Warning: Price mismatch detected (Actual: ${formatPrice(recomputedTotal)}, Paid: ${formatPrice(order.totalAmount)}). Are you sure you want to verify and accept this order?`)) {
                            return;
                          }
                        }
                        handleStatusUpdate(order.id, OrderStatus.CONFIRMED);
                      }}
                      className={`col-span-2 flex items-center justify-center gap-2 py-3 text-xs font-bold uppercase tracking-widest transition-colors duration-200 ${
                        isMismatch 
                          ? 'bg-red-600 text-white hover:bg-red-700' 
                          : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                      }`}
                    >
                      Verify & Accept
                    </button>
                  )}
                  {order.status === OrderStatus.CONFIRMED && (
                    <button 
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.PREPARING)}
                      className="col-span-2 flex items-center justify-center gap-2 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white py-3 text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-200"
                    >
                      Start Preparation
                    </button>
                  )}
                  {order.status === OrderStatus.PREPARING && (
                    <button 
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.READY)}
                      className="col-span-2 flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
                    >
                      Mark Ready
                    </button>
                  )}
                  {order.status === OrderStatus.READY && (
                    <button 
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.COMPLETED)}
                      className="col-span-2 flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 py-3 text-xs font-bold uppercase tracking-widest hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors duration-200"
                    >
                      Archive
                    </button>
                  )}
                  
                  {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED || order.status === OrderStatus.PREPARING) && (
                    <button 
                      onClick={() => handleStatusUpdate(order.id, OrderStatus.CANCELLED)}
                      className="col-span-2 text-center text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-500 hover:underline mt-1 transition-colors duration-200"
                    >
                      Reject / Cancel
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>

          {activeOrderTab === 'completed' && hasMoreOrders && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => loadHistoricalOrders()}
                disabled={isLoadingMore}
                className="px-8 py-3 text-sm font-bold uppercase tracking-widest border border-black dark:border-white text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isLoadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load More
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- VERIFICATION VIEW --- */}
      {currentView === 'verification' && (
        <div className="space-y-8 animate-fade-in">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-4">
            <h2 className="text-2xl font-serif font-bold text-black dark:text-white">Pending Verification</h2>
            <p className="text-gray-500 text-sm mt-1">Review and approve accounts from non-college email domains.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unverifiedUsers.length === 0 && (
              <div className="col-span-full text-center py-24 border border-dashed border-gray-300 dark:border-gray-800 animate-fade-in">
                <UserCheck className="w-8 h-8 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 font-mono text-sm">No users pending verification.</p>
              </div>
            )}

            {unverifiedUsers.map(u => (
              <div key={u.uid} className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-lg text-black dark:text-white">{u.displayName}</h3>
                  <p className="text-gray-500 text-sm font-mono mt-1">{u.email}</p>
                  <p className="text-gray-400 text-xs mt-2">Joined: {u.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      await verifyUserAccount(u.uid);
                    } catch (e) {
                      console.error("Failed to verify user", e);
                      alert("Verification failed. Please check permissions.");
                    }
                  }}
                  className="mt-6 w-full flex items-center justify-center gap-2 bg-black dark:bg-white text-white dark:text-black py-3 text-xs font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors duration-200"
                >
                  <Check className="w-4 h-4" /> Verify Account
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};