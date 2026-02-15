import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStore } from '../contexts/StoreContext';
import { 
  subscribeToAllOrders, 
  updateOrderStatus, 
  getAllMenuItemsAdmin,
  updateMenuItem,
  addMenuItem,
  deleteMenuItem
} from '../services/firestoreService';
import { Order, OrderStatus, MenuItem, ProductCategory } from '../types';
import { formatTime, formatPrice } from '../utils/formatters';
import { Navigate } from '../contexts/AuthContext';
import { ROUTES } from '../constants';
import { Coffee, Copy, Check, Phone, Power, Loader2, Package, Plus, Trash2, Save, X, Edit2, Flame, Dumbbell, Scale, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { isStoreOpen, setStoreOpen } = useStore();
  
  // View State
  const [currentView, setCurrentView] = useState<'orders' | 'inventory'>('orders');
  
  // Orders State
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrderTab, setActiveOrderTab] = useState<'active' | 'completed'>('active');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Store Toggle State
  const [isTogglingStore, setIsTogglingStore] = useState(false);

  // Inventory State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  
  // Add Item Form State
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    description: string;
    price: string;
    category: ProductCategory;
    imageUrl: string;
    preparationTime: string;
    calories: string;
    isAvailable: boolean;
    fitnessGoal: 'muscle_gain' | 'weight_loss' | '';
  }>({
    name: '',
    description: '',
    price: '',
    category: ProductCategory.Snacks,
    imageUrl: '',
    preparationTime: '10',
    calories: '',
    isAvailable: true,
    fitnessGoal: ''
  });

  useEffect(() => {
    if (!isAdmin) return;
    const unsubscribe = subscribeToAllOrders((data) => {
      setOrders(data);
    });
    return () => unsubscribe();
  }, [isAdmin]);

  // Load inventory when switching to inventory view
  useEffect(() => {
    if (currentView === 'inventory' && isAdmin) {
      loadInventory();
    }
  }, [currentView, isAdmin]);

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

  if (!user || !isAdmin) return <Navigate to={ROUTES.HOME} replace />;

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

  const generateDetails = async () => {
    if (!newItem.name.trim()) return;
    
    // Don't regenerate if we just generated for this name (simple check could be added here, 
    // but for now we allow re-generation if user blurs again to correct/retry)
    
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `For a dish named "${newItem.name}", generate:
            1. A short menu description (max 15 words).
            2. Estimated calories (integer only).
            3. Fitness goal category: return "muscle_gain" if it is high protein/nutrient dense, or "weight_loss" if it is low calorie/light.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: { type: Type.STRING },
                        calories: { type: Type.INTEGER },
                        fitnessGoal: { type: Type.STRING, enum: ["muscle_gain", "weight_loss"] }
                    }
                }
            }
        });

        const text = response.text;
        if (text) {
            const data = JSON.parse(text);
            setNewItem(prev => ({
                ...prev,
                description: data.description || prev.description,
                calories: data.calories ? data.calories.toString() : prev.calories,
                fitnessGoal: (data.fitnessGoal as 'muscle_gain' | 'weight_loss') || prev.fitnessGoal
            }));
        }
    } catch (e) {
        console.error("AI Generation failed", e);
    } finally {
        setIsGenerating(false);
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
        calories: newItem.calories ? parseInt(newItem.calories) : undefined,
        fitnessGoal: newItem.fitnessGoal || undefined
      });
      setIsAddingItem(false);
      setNewItem({
        name: '', description: '', price: '', category: ProductCategory.Snacks, 
        imageUrl: '', preparationTime: '10', calories: '', isAvailable: true, fitnessGoal: ''
      });
      loadInventory();
    } catch (error: any) {
      alert("Failed to add item: " + error.message);
    }
  };

  const activeOrders = orders.filter(o => [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(o.status));
  const completedOrders = orders.filter(o => [OrderStatus.COMPLETED, OrderStatus.CANCELLED].includes(o.status));
  const displayOrders = activeOrderTab === 'active' ? activeOrders : completedOrders;

  return (
    <div className="space-y-8 pb-20">
      {/* HEADER AREA */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 border-b border-white pb-8">
        <div>
           <h1 className="text-4xl font-serif font-bold text-white animate-fade-in">Command Center</h1>
           <p className="text-gray-400 mt-2 text-sm">Manage orders, inventory, and store status.</p>
        </div>
        
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setCurrentView('orders')}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === 'orders' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
          >
            Orders
          </button>
          
          <button
            onClick={() => setCurrentView('inventory')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === 'inventory' ? 'bg-white text-black' : 'bg-gray-900 text-gray-400 hover:text-white'}`}
          >
            <Package className="w-4 h-4" /> Inventory
          </button>

          {/* Store Controls */}
          <button 
            onClick={handleToggleStore}
            disabled={isTogglingStore}
            className={`flex items-center gap-3 px-6 py-3 text-sm font-bold uppercase tracking-widest border transition-all duration-300 ${
              isStoreOpen 
                ? 'bg-green-500 text-black border-green-500 hover:bg-green-400' 
                : 'bg-red-900 text-white border-red-900 hover:bg-red-800'
            }`}
          >
            {isTogglingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isStoreOpen ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* --- INVENTORY VIEW --- */}
      {currentView === 'inventory' && (
        <div className="animate-fade-in space-y-8">
          
          {/* Add Item Button */}
          {!isAddingItem ? (
            <button 
              onClick={() => setIsAddingItem(true)}
              className="w-full border border-dashed border-gray-700 p-8 text-gray-500 hover:text-white hover:border-white transition-colors flex flex-col items-center justify-center gap-2"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-bold uppercase tracking-widest">Add New Menu Item</span>
            </button>
          ) : (
             <form onSubmit={handleAddItem} className="bg-gray-900 border border-gray-800 p-6 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-bold uppercase tracking-widest">Add New Item</h3>
                  <button type="button" onClick={() => setIsAddingItem(false)}><X className="text-gray-400 hover:text-white" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div className="md:col-span-2 relative group">
                     <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Item Name</label>
                     <input 
                        required 
                        placeholder="e.g. Chicken Caesar Salad" 
                        value={newItem.name} 
                        onChange={e => setNewItem({...newItem, name: e.target.value})}
                        onBlur={generateDetails}
                        className="w-full bg-black border border-gray-700 p-3 pr-12 text-white outline-none focus:border-white" 
                     />
                     <div className="absolute right-2 top-8 text-gray-400">
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />}
                     </div>
                   </div>
                   
                   <div>
                     <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Price</label>
                     <input required type="number" step="0.01" placeholder="0.00" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white" />
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Category</label>
                      <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value as ProductCategory})} className="w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white">
                          {Object.values(ProductCategory).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                   </div>
                   
                   <div>
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Prep Time (min)</label>
                      <input type="number" placeholder="10" value={newItem.preparationTime} onChange={e => setNewItem({...newItem, preparationTime: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white" />
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 md:col-span-1">
                     <div className="relative">
                       <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block flex items-center gap-1">
                          Calories {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                       </label>
                       <input 
                          type="number" 
                          placeholder="Auto-calc" 
                          value={newItem.calories} 
                          onChange={e => setNewItem({...newItem, calories: e.target.value})} 
                          className={`w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white transition-colors ${isGenerating ? 'opacity-50' : ''}`}
                       />
                     </div>
                     
                     <div className="relative">
                       <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block flex items-center gap-1">
                          Goal {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                       </label>
                       <select 
                          value={newItem.fitnessGoal} 
                          onChange={e => setNewItem({...newItem, fitnessGoal: e.target.value as any})} 
                          className={`w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white transition-colors ${isGenerating ? 'opacity-50' : ''}`}
                       >
                          <option value="">None</option>
                          <option value="muscle_gain">Muscle Gain</option>
                          <option value="weight_loss">Weight Loss</option>
                       </select>
                     </div>
                   </div>
                   
                   <div className="md:col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block">Image URL</label>
                      <input placeholder="https://..." value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white" />
                   </div>
                   
                   <div className="md:col-span-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 block flex items-center gap-1">
                         Description {isGenerating && <Loader2 className="w-3 h-3 animate-spin" />}
                      </label>
                      <textarea 
                        placeholder="Auto-generated description..." 
                        value={newItem.description} 
                        onChange={e => setNewItem({...newItem, description: e.target.value})} 
                        className={`w-full bg-black border border-gray-700 p-3 text-white outline-none focus:border-white h-24 transition-colors ${isGenerating ? 'opacity-50' : ''}`} 
                      />
                   </div>
                </div>
                <button type="submit" className="w-full bg-white text-black py-3 font-bold uppercase tracking-widest hover:bg-gray-200">Save Item</button>
             </form>
          )}

          {/* Inventory List */}
          {isInventoryLoading ? (
            <div className="text-center py-12"><Loader2 className="animate-spin w-8 h-8 text-white mx-auto" /></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {menuItems.map(item => (
                <div key={item.id} className={`flex flex-col md:flex-row items-center gap-6 p-4 bg-black border ${item.isAvailable ? 'border-gray-800' : 'border-red-900/50 bg-red-900/10'}`}>
                  <div className="w-16 h-16 bg-gray-900 flex-shrink-0 relative group">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    {item.calories && (
                       <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-[10px] text-white text-center py-0.5">
                         {item.calories} cal
                       </div>
                    )}
                  </div>
                  
                  <div className="flex-grow text-center md:text-left">
                    <h3 className="text-white font-bold">{item.name}</h3>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1">
                       <span className="text-xs text-gray-500 uppercase tracking-wider">{item.category}</span>
                       {item.calories && (
                         <span className="flex items-center text-xs text-orange-500">
                           <Flame className="w-3 h-3 mr-0.5" /> {item.calories}
                         </span>
                       )}
                       {item.fitnessGoal === 'muscle_gain' && (
                         <span className="flex items-center text-xs text-blue-400 font-bold uppercase">
                           <Dumbbell className="w-3 h-3 mr-1" /> Muscle Gain
                         </span>
                       )}
                       {item.fitnessGoal === 'weight_loss' && (
                         <span className="flex items-center text-xs text-green-400 font-bold uppercase">
                           <Scale className="w-3 h-3 mr-1" /> Weight Loss
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
                          className="w-20 bg-gray-900 border border-white p-1 text-white text-sm"
                          autoFocus
                        />
                        <button onClick={() => savePriceEdit(item.id)} className="p-2 text-green-500 hover:text-green-400"><Save className="w-4 h-4" /></button>
                        <button onClick={() => setEditingItemId(null)} className="p-2 text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <span className="font-mono text-white">{formatPrice(item.price)}</span>
                        <button onClick={() => startEditing(item)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleToggleAvailability(item)}
                      className={`px-4 py-2 text-xs font-bold uppercase tracking-widest min-w-[100px] ${item.isAvailable ? 'bg-white text-black hover:bg-gray-200' : 'bg-red-600 text-white hover:bg-red-500'}`}
                    >
                      {item.isAvailable ? 'In Stock' : 'Sold Out'}
                    </button>
                    
                    <button 
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-2 text-gray-600 hover:text-red-500 transition-colors"
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
      )}
    </div>
  );
};