import React, { useEffect, useState, useRef } from 'react';
import { MenuItem, ProductCategory } from '../types';
import { getMenuItems, seedMenu, MOCK_MENU_ITEMS, getUserFavorites } from '../services/firestoreService';
import { MenuItemCard } from '../components/MenuItemCard';
import { Search, Heart, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { WelcomeToast } from '../components/WelcomeToast';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Filter States
  const [showVegOnly, setShowVegOnly] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  
  const isInitialized = useRef(false);

  // Fetch Menu
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const fetchMenu = async () => {
      try {
        let data = await getMenuItems();
        
        if (data.length === 0) {
          if (user) {
            try {
              await seedMenu();
              data = await getMenuItems();
            } catch (e) {
              data = MOCK_MENU_ITEMS;
            }
          } else {
             data = MOCK_MENU_ITEMS;
          }
        }
        
        setItems(data);
      } catch (err) {
        console.error("Unexpected error in Home", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, [user]);

  // Fetch Favorites
  useEffect(() => {
    if (user) {
      getUserFavorites(user.uid).then(favs => {
        setUserFavorites(new Set(favs));
      });
    } else {
      setUserFavorites(new Set());
    }
  }, [user]);

  const toggleFavoriteLocal = (itemId: string) => {
    setUserFavorites(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Veg Filter
    if (showVegOnly && !item.isVegetarian) return false;

    // Favorites Filter
    if (showFavoritesOnly && !userFavorites.has(item.id)) return false;

    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Object.values(ProductCategory)];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-96 bg-gray-200 dark:bg-gray-900 border border-gray-300 dark:border-gray-800"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {user && <WelcomeToast name={user.displayName || 'Guest'} />}
      
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-black dark:border-white pb-8 transition-colors duration-300">
        <div className="max-w-xl">
          <h1 className="text-5xl font-serif font-bold text-black dark:text-white mb-4 leading-tight transition-colors duration-300">Menu</h1>
          <p className="text-gray-600 dark:text-gray-400 font-light text-lg">Curated selection of seasonal dishes focused on simplicity and quality ingredients.</p>
        </div>
        
        <div className="w-full xl:w-auto flex flex-col md:flex-row gap-6 md:items-center">
          {/* Smart Filters */}
          <div className="flex gap-3">
             <button
               onClick={() => setShowVegOnly(!showVegOnly)}
               className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${
                 showVegOnly 
                   ? 'bg-green-600 text-white border-green-600' 
                   : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-green-600 hover:text-green-600'
               }`}
             >
               <Leaf className="w-3 h-3" /> Veg Only
             </button>

             {user && (
               <button
                 onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                 className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all ${
                   showFavoritesOnly 
                     ? 'bg-red-600 text-white border-red-600' 
                     : 'bg-transparent text-gray-500 border-gray-300 dark:border-gray-700 hover:border-red-600 hover:text-red-600'
                 }`}
               >
                 <Heart className={`w-3 h-3 ${showFavoritesOnly ? 'fill-white' : ''}`} /> Favorites
               </button>
             )}
          </div>

          <div className="flex items-center gap-3 border-b border-gray-300 dark:border-gray-700 pb-2 focus-within:border-black dark:focus-within:border-white transition-colors w-full md:w-64">
            <Search className="w-4 h-4 text-black dark:text-white" />
            <input 
              type="text" 
              placeholder="SEARCH DISHES" 
              className="outline-none text-sm bg-transparent flex-grow placeholder:text-gray-500 font-medium tracking-wide text-black dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-4">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-6 py-2 text-sm font-bold uppercase tracking-widest transition-all border ${
              activeCategory === cat 
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white' 
                : 'bg-white dark:bg-black text-gray-500 dark:text-gray-500 border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredItems.map(item => (
            <MenuItemCard 
              key={item.id} 
              item={item} 
              isFavorite={userFavorites.has(item.id)}
              onToggleFavorite={toggleFavoriteLocal}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border border-dashed border-gray-300 dark:border-gray-800">
            <>
              <p className="text-black dark:text-white font-serif text-2xl italic">No dishes found.</p>
              <p className="text-gray-500 mt-2 text-sm">Try adjusting your filters.</p>
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); setShowVegOnly(false); setShowFavoritesOnly(false); }}
                className="mt-6 text-xs font-bold uppercase tracking-widest border-b border-black dark:border-white pb-1 hover:text-gray-500 hover:border-gray-500 transition-colors"
              >
                Clear all filters
              </button>
            </>
        </div>
      )}
    </div>
  );
};