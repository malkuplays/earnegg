import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getTelegramUser } from '../lib/telegram';
// import { supabase } from '../lib/supabase'; // We'd use this if backend was ready

interface AppContextType {
  balance: number;
  energy: number;
  maxEnergy: number;
  handleTap: () => void;
  user: any | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const maxEnergy = 1000;
  const [user, setUser] = useState<any | null>(null);
  
  // Ref for debouncing Supabase updates
  const pendingTaps = useRef(0);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Init user
    const tgUser = getTelegramUser();
    setUser(tgUser);
    
    // In a real scenario, we would fetch the initial user profile from Supabase here
    // const { data } = await supabase.from('users').select('*').eq('id', tgUser.id).single();
    // setBalance(data.balance);
    // setEnergy(data.energy);
    
    // Setup energy regeneration interval
    const interval = setInterval(() => {
      setEnergy(prev => (prev < maxEnergy ? prev + 1 : prev));
    }, 2000); // 1 energy every 2 seconds
    
    return () => clearInterval(interval);
  }, []);

  const syncWithDatabase = useCallback(async () => {
    if (pendingTaps.current === 0) return;
    
    const tapsToSync = pendingTaps.current;
    // Optimistically reset
    pendingTaps.current = 0;
    syncTimeoutRef.current = null;
    
    console.log(`Syncing ${tapsToSync} taps to database...`);
    // Example Supabase call:
    // await supabase.rpc('increment_coins', { amount: tapsToSync, energy_cost: tapsToSync });
  }, []);

  const handleTap = useCallback(() => {
    if (energy > 0) {
      setBalance(prev => prev + 1);
      setEnergy(prev => prev - 1);
      
      pendingTaps.current += 1;
      
      // Debounce logic
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      // @ts-ignore
      syncTimeoutRef.current = setTimeout(() => {
        syncWithDatabase();
      }, 1000);
    }
  }, [energy, syncWithDatabase]);

  return (
    <AppContext.Provider value={{ balance, energy, maxEnergy, handleTap, user }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
