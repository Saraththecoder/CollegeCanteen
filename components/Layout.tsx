import React, { useEffect, useState } from 'react';
import { Link, useLocation } from '../contexts/AuthContext';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import { useStore } from '../contexts/StoreContext';
import { ShoppingBag, User, LogOut, Menu as MenuIcon, X, Lock } from 'lucide-react';
import { CartDrawer } from './CartDrawer';
import { StoreClosed } from './StoreClosed';
import { ROUTES, APP_NAME } from '../constants';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAdmin, loading: authLoading } = useAuth();
  const { isStoreOpen, loading: storeLoading } = useStore();
  const { toggleCart, totalItems } = useCart();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [animateCart, setAnimateCart] = useState(false);

  useEffect(() => {
    if (totalItems > 0) {
      setAnimateCart(true);
      const timer = setTimeout(() => setAnimateCart(false), 200);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  const isActive = (path: string) => location.pathname === path;
  const isLoading = authLoading || storeLoading;

  // Determine if we should show the closed screen
  // Show closed if: Store is closed AND User is NOT an admin
  // Note: If user is not logged in, they are not admin, so they see closed screen.
  const showClosedScreen = !isLoading && !isStoreOpen && !isAdmin;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-black border-b border-white transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link to={ROUTES.HOME} className="font-serif font-bold text-2xl tracking-tighter text-white hover:text-gray-300 transition-colors">
                {APP_NAME}
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-12">
              <Link to={ROUTES.HOME} className={`text-sm tracking-wide uppercase font-medium transition-all duration-300 ${isActive(ROUTES.HOME) ? 'text-white border-b border-white' : 'text-gray-400 hover:text-white'}`}>
                Menu
              </Link>
              {user && (
                <Link to={ROUTES.ORDERS} className={`text-sm tracking-wide uppercase font-medium transition-all duration-300 ${isActive(ROUTES.ORDERS) ? 'text-white border-b border-white' : 'text-gray-400 hover:text-white'}`}>
                  Orders
                </Link>
              )}
              {isAdmin && (
                <Link to={ROUTES.ADMIN} className={`text-sm tracking-wide uppercase font-medium transition-all duration-300 ${isActive(ROUTES.ADMIN) ? 'text-white border-b border-white' : 'text-gray-400 hover:text-white'}`}>
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-6">
              {!showClosedScreen && (
                <button 
                  onClick={toggleCart} 
                  className="relative p-2 text-white hover:text-gray-300 transition-colors duration-300 group"
                  aria-label="Open cart"
                >
                  <ShoppingBag className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  {totalItems > 0 && (
                    <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-black bg-white rounded-full ${animateCart ? 'animate-pop' : ''}`}>
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <div className="relative group hidden md:block">
                  <button className="flex items-center space-x-2 text-sm font-medium text-white hover:text-gray-300 transition-colors">
                    <User className="w-5 h-5" />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-black border border-white shadow-none rounded-none opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right z-50">
                    <button onClick={() => logout()} className="w-full text-left px-6 py-3 text-sm text-white hover:bg-white hover:text-black flex items-center transition-colors duration-200">
                      <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link to={ROUTES.LOGIN} className="hidden md:inline-flex items-center justify-center px-6 py-2 border border-white text-sm font-medium text-white hover:bg-white hover:text-black transition-all duration-300 rounded-none uppercase tracking-wider">
                  Sign In
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button className="md:hidden text-white transition-transform duration-300 active:scale-90" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                 {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800 px-4 pt-2 pb-4 space-y-1 animate-fade-in absolute w-full z-50">
             <Link to={ROUTES.HOME} className="block px-3 py-4 text-lg font-serif font-bold text-white border-b border-gray-800 active:bg-gray-900 transition-colors">Menu</Link>
             {user && <Link to={ROUTES.ORDERS} className="block px-3 py-4 text-lg font-serif font-bold text-white border-b border-gray-800 active:bg-gray-900 transition-colors">My Orders</Link>}
             {isAdmin && <Link to={ROUTES.ADMIN} className="block px-3 py-4 text-lg font-serif font-bold text-white border-b border-gray-800 active:bg-gray-900 transition-colors">Dashboard</Link>}
             {user ? (
               <button onClick={() => logout()} className="block w-full text-left px-3 py-4 text-lg font-serif font-medium text-gray-500 hover:text-white transition-colors">Sign Out</button>
             ) : (
                <Link to={ROUTES.LOGIN} className="block px-3 py-4 text-lg font-serif font-bold text-white active:bg-gray-900 transition-colors">Sign In</Link>
             )}
          </div>
        )}
      </header>

      {!isLoading && !isStoreOpen && isAdmin && (
        <div className="bg-red-900/50 text-white text-center py-2 text-xs font-bold uppercase tracking-widest border-b border-red-500 flex items-center justify-center gap-2">
           <Lock className="w-3 h-3" /> Store is Closed (Admin Mode)
        </div>
      )}

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {showClosedScreen ? <StoreClosed /> : children}
      </main>

      {!showClosedScreen && <CartDrawer />}

      <footer className="bg-black border-t border-white py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
          <span className="font-serif font-bold text-lg mb-4 text-white">{APP_NAME}</span>
          <div className="text-gray-500 text-sm font-mono">
            EST. 2024 &bull; QUALITY FIRST
          </div>
        </div>
      </footer>
    </div>
  );
};