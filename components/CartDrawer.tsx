import React from 'react';
import { useCart } from '../contexts/CartContext';
import { formatPrice } from '../utils/formatters';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useNavigate } from '../contexts/AuthContext';
import { ROUTES } from '../constants';

export const CartDrawer: React.FC = () => {
  const { items, quantities, updateQuantity, totalPrice, isCartOpen, toggleCart } = useCart();
  const navigate = useNavigate();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/20 dark:bg-white/10 backdrop-blur-sm" onClick={toggleCart} />
      
      <div className="absolute inset-y-0 right-0 max-w-md w-full flex">
        <div className="w-full h-full bg-white dark:bg-black border-l border-gray-200 dark:border-white flex flex-col animate-slide-in shadow-2xl">
          
          <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 dark:border-white">
            <h2 className="text-2xl font-serif font-bold text-black dark:text-white flex items-center">
              Cart
              <span className="ml-3 text-sm font-mono font-normal text-gray-500 dark:text-gray-400">[{items.length}]</span>
            </h2>
            <button onClick={toggleCart} className="text-black dark:text-white hover:rotate-90 transition-transform">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-20 h-20 border border-gray-300 dark:border-gray-800 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-serif font-bold text-black dark:text-white">Empty Cart</h3>
                  <p className="text-sm text-gray-500 mt-2 max-w-[200px] mx-auto">Select items from the menu to get started.</p>
                </div>
                <button onClick={toggleCart} className="text-sm font-bold text-black dark:text-white uppercase tracking-widest hover:underline underline-offset-4">
                  View Menu
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="flex gap-6 group">
                  <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-900 overflow-hidden border border-gray-200 dark:border-gray-800">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-all" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-bold text-black dark:text-white text-lg leading-none">{item.name}</h4>
                      <p className="text-sm font-mono text-gray-500 dark:text-gray-400">{formatPrice(item.price)}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-black dark:border-white">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="px-3 py-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-black dark:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm font-mono font-medium w-8 text-center border-l border-r border-black/10 dark:border-white/20 py-1 text-black dark:text-white">{quantities[item.id]}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="px-3 py-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors text-black dark:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-mono font-bold text-black dark:text-white">
                        {formatPrice(item.price * quantities[item.id])}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {items.length > 0 && (
            <div className="border-t border-gray-200 dark:border-white p-8 space-y-6 bg-gray-50 dark:bg-black">
              <div className="flex justify-between items-end">
                <p className="text-sm text-gray-500 uppercase tracking-widest">Total</p>
                <p className="font-serif font-bold text-3xl text-black dark:text-white">{formatPrice(totalPrice)}</p>
              </div>
              <button
                onClick={() => {
                  toggleCart();
                  navigate(ROUTES.CHECKOUT);
                }}
                className="w-full flex justify-center items-center px-8 py-4 bg-black dark:bg-white text-white dark:text-black text-sm font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Checkout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};