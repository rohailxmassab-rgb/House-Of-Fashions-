import React, { createContext, useContext, useState, useEffect } from 'react';
import { getStoreSettings } from '../services/storeService';
import { StoreSettings } from '../types';

interface StoreContextType {
  settings: StoreSettings | null;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType>({
  settings: null,
  loading: true,
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = getStoreSettings((data) => {
      setSettings(data as StoreSettings);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <StoreContext.Provider value={{ settings, loading }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => useContext(StoreContext);
