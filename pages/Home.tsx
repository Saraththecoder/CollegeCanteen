import React, { useEffect, useState, useRef } from 'react';
import { MenuItem, ProductCategory } from '../types';
import { getMenuItems, seedMenu, MOCK_MENU_ITEMS } from '../services/firestoreService';
import { MenuItemCard } from '../components/MenuItemCard';
import { Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isInitialized = useRef(false);

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

  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...Object.values(ProductCategory)];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-96 bg-gray-900 border border-gray-800"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white pb-8">
        <div className="max-w-xl">
          <h1 className="text-5xl font-serif font-bold text-white mb-4 leading-tight">Menu</h1>
          <p className="text-gray-400 font-light text-lg">Curated selection of seasonal dishes focused on simplicity and quality ingredients.</p>
        </div>
        
        <div className="w-full md:w-auto">
          <div className="flex items-center gap-3 border-b border-gray-700 pb-2 focus-within:border-white transition-colors w-full md:w-64">
            <Search className="w-4 h-4 text-white" />
            <input 
              type="text" 
              placeholder="SEARCH DISHES" 
              className="outline-none text-sm bg-transparent flex-grow placeholder:text-gray-600 font-medium tracking-wide text-white"
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
                ? 'bg-white text-black border-white' 
                : 'bg-black text-gray-500 border-gray-800 hover:border-white hover:text-white'
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
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <div className="text-center py-32 border border-dashed border-gray-800">
            <>
              <p className="text-white font-serif text-2xl italic">No matches found.</p>
              <button 
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
                className="mt-6 text-xs font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-gray-400 hover:border-gray-400"
              >
                Clear all filters
              </button>
            </>
        </div>
      )}
    </div>
  );
};