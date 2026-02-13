import React, { useState } from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { Plus, Clock } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

interface Props {
  item: MenuItem;
}

export const MenuItemCard: React.FC<Props> = ({ item }) => {
  const { addToCart } = useCart();
  const [isAnimating, setIsAnimating] = useState(false);

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    
    addToCart(item);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  return (
    <div className={`group relative bg-black border border-white/20 hover:border-white transition-all duration-300 flex flex-col h-full ${!item.isAvailable ? 'opacity-50' : ''} animate-fade-in`}>
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-900 relative border-b border-white/20">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-[1px]">
            <span className="bg-white text-black text-xs font-bold px-4 py-2 uppercase tracking-widest border border-white">Sold Out</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-serif font-bold text-white leading-tight pr-4">{item.name}</h3>
          <span className="font-mono text-lg font-medium text-white">{formatPrice(item.price)}</span>
        </div>
        
        <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-grow">{item.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-800 mt-auto">
          <div className="flex items-center text-xs text-gray-500 font-mono uppercase tracking-wide">
            <Clock className="w-3 h-3 mr-2" />
            {item.preparationTime} MIN
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex items-center justify-center w-10 h-10 border border-white bg-black text-white hover:bg-white hover:text-black transition-all duration-200 disabled:opacity-0 disabled:cursor-not-allowed ${isAnimating ? 'animate-pop bg-white text-black' : ''}`}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};