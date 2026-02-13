import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem } from '../types';

interface CartContextType {
  items: MenuItem[];
  quantities: Record<string, number>;
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isCartOpen: boolean;
  toggleCart: () => void;
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export const useCart = () => useContext(CartContext);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedCart = localStorage.getItem('noir_cart');
    if (savedCart) {
      const { items: savedItems, quantities: savedQuantities } = JSON.parse(savedCart);
      setItems(savedItems);
      setQuantities(savedQuantities);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    localStorage.setItem('noir_cart', JSON.stringify({ items, quantities }));
  }, [items, quantities]);

  const addToCart = (item: MenuItem) => {
    if (!quantities[item.id]) {
      setItems([...items, item]);
      setQuantities({ ...quantities, [item.id]: 1 });
    } else {
      setQuantities({ ...quantities, [item.id]: quantities[item.id] + 1 });
    }
    setIsCartOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems(items.filter(i => i.id !== itemId));
    const newQuantities = { ...quantities };
    delete newQuantities[itemId];
    setQuantities(newQuantities);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newQty = (quantities[itemId] || 0) + delta;
    if (newQty <= 0) {
      removeFromCart(itemId);
    } else {
      setQuantities({ ...quantities, [itemId]: newQty });
    }
  };

  const clearCart = () => {
    setItems([]);
    setQuantities({});
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  const totalItems = Object.values(quantities).reduce((a: number, b: number) => a + b, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * (quantities[item.id] || 0)), 0);

  return (
    <CartContext.Provider value={{ 
      items, quantities, addToCart, removeFromCart, updateQuantity, 
      clearCart, totalItems, totalPrice, isCartOpen, toggleCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};