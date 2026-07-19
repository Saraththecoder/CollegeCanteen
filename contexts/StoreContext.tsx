import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoreSettings, updateStoreStatus } from '../services/firestoreService';

interface StoreContextType {
  isStoreOpen: boolean;
  loading: boolean;
  setStoreOpen: (isOpen: boolean) => Promise<void>;
  refreshStoreSettings: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType>({} as StoreContextType);

export const useStore = () => useContext(StoreContext);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const status = await getStoreSettings();
      setIsStoreOpen(status);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const setStoreOpen = async (isOpen: boolean) => {
    try {
      await updateStoreStatus(isOpen);
      setIsStoreOpen(isOpen); // Optimistic update
    } catch (e) {
      console.error("Failed to update store status", e);
      throw e;
    }
  };

  return (
    <StoreContext.Provider value={{ isStoreOpen, loading, setStoreOpen, refreshStoreSettings: fetchSettings }}>
      {children}
    </StoreContext.Provider>
  );
};