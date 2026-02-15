import React, { createContext, useContext, useEffect, useState } from 'react';
import { subscribeToStoreSettings, updateStoreStatus } from '../services/firestoreService';

interface StoreContextType {
  isStoreOpen: boolean;
  loading: boolean;
  setStoreOpen: (isOpen: boolean) => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

export const useStore = () => useContext(StoreContext);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToStoreSettings((status) => {
      setIsStoreOpen(status);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const setStoreOpen = async (isOpen: boolean) => {
    try {
      await updateStoreStatus(isOpen);
    } catch (e) {
      console.error("Failed to update store status", e);
      throw e;
    }
  };

  return (
    <StoreContext.Provider value={{ isStoreOpen, loading, setStoreOpen }}>
      {children}
    </StoreContext.Provider>
  );
};