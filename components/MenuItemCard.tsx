import React, { useState } from 'react';
import { MenuItem } from '../types';
import { formatPrice } from '../utils/formatters';
import { Plus, Clock, Flame, Dumbbell, Scale, Heart } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { toggleFavorite } from '../services/firestoreService';

interface Props {
  item: MenuItem;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
}

// Reusable Veg/Non-Veg Icon
const VegIcon: React.FC<{ isVeg: boolean }> = ({ isVeg }) => (
  <div className={`w-4 h-4 border-2 flex items-center justify-center ${isVeg ? 'border-green-600' : 'border-red-600'}`}>
    <div className={`w-2 h-2 rounded-full ${isVeg ? 'bg-green-600' : 'bg-red-600'}`} />
  </div>
);

export const MenuItemCard: React.FC<Props> = ({ item, isFavorite = false, onToggleFavorite }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);

  const handleAddToCart = () => {
    if (!item.isAvailable) return;
    
    addToCart(item);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 200);
  };

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return; // Or trigger login
    
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 300);

    if (onToggleFavorite) {
      onToggleFavorite(item.id); // Optimistic UI update via parent
    }
    
    try {
      await toggleFavorite(user.uid, item.id, isFavorite);
    } catch (error) {
      console.error("Failed to toggle favorite", error);
    }
  };

  return (
    <div className={`group relative bg-white dark:bg-black border border-gray-200 dark:border-white/20 hover:border-black dark:hover:border-white transition-all duration-300 flex flex-col h-full ${!item.isAvailable ? 'opacity-50' : ''} animate-fade-in`}>
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-900 relative border-b border-gray-100 dark:border-white/20">
        <img 
          src={item.imageUrl} 
          alt={item.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        {!item.isAvailable && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-[1px]">
            <span className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 uppercase tracking-widest border border-black dark:border-white">Sold Out</span>
          </div>
        )}
        
        {/* Fitness Goal Badge */}
        {item.fitnessGoal === 'muscle_gain' && (
          <div className="absolute top-2 left-2 bg-blue-600/90 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex items-center backdrop-blur-sm shadow-sm">
             <Dumbbell className="w-3 h-3 mr-1" /> Muscle Gain
          </div>
        )}
        {item.fitnessGoal === 'weight_loss' && (
          <div className="absolute top-2 left-2 bg-green-600/90 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider flex items-center backdrop-blur-sm shadow-sm">
             <Scale className="w-3 h-3 mr-1" /> Weight Loss
          </div>
        )}

        {/* Favorite Button */}
        {user && (
          <button 
            onClick={handleFavoriteClick}
            className="absolute top-2 right-2 p-2 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full text-black dark:text-white hover:scale-110 transition-transform shadow-sm"
          >
            <Heart className={`w-4 h-4 transition-colors ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'} ${isHeartAnimating ? 'animate-pop' : ''}`} />
          </button>
        )}
      </div>

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col pr-4">
             <div className="flex items-center gap-2 mb-1">
                {item.isVegetarian !== undefined && <VegIcon isVeg={item.isVegetarian} />}
                {item.isSpicy && <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />}
             </div>
             <h3 className="text-xl font-serif font-bold text-black dark:text-white leading-tight">{item.name}</h3>
          </div>
          <span className="font-mono text-lg font-medium text-black dark:text-white">{formatPrice(item.price)}</span>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 flex-grow line-clamp-2">{item.description}</p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-auto">
          <div className="flex gap-4">
            <div className="flex items-center text-xs text-gray-500 font-mono uppercase tracking-wide">
                <Clock className="w-3 h-3 mr-2" />
                {item.preparationTime} MIN
            </div>
            {item.calories && (
                <div className="flex items-center text-xs text-orange-500 font-mono uppercase tracking-wide">
                    <Flame className="w-3 h-3 mr-1" />
                    {item.calories} CAL
                </div>
            )}
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={!item.isAvailable}
            className={`flex items-center justify-center w-10 h-10 border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-200 disabled:opacity-0 disabled:cursor-not-allowed ${isAnimating ? 'animate-pop bg-black dark:bg-white text-white dark:text-black' : ''}`}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};