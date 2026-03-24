import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getTelegramUser, getTelegramStartParam } from '../lib/telegram';
import { supabase } from '../lib/supabase';

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
    let tgUser: any = getTelegramUser();
    // Fallback for local web testing so Supabase doesn't fail on null ID
    if (!tgUser) {
      let localId = localStorage.getItem('earnegg_device_id');
      if (!localId) {
        localId = 'web_' + Math.floor(Math.random() * 1000000000).toString();
        localStorage.setItem('earnegg_device_id', localId);
      }
      tgUser = { id: localId, username: 'Web Player', first_name: 'Web' };
    }
    setUser(tgUser);
    
    // Fetch or Register user profile with Supabase securely
    const fetchUser = async () => {
      const startParam = getTelegramStartParam() || '';
      const referrerId = startParam.startsWith('ref_') ? startParam.replace('ref_', '') : '';
      
      let safeId = tgUser?.id?.toString() || '';
      let safeName = tgUser?.username || tgUser?.first_name || 'tester';

      const { data, error } = await supabase.rpc('register_player', {
        p_telegram_id: safeId,
        p_username: safeName,
        p_referrer_id: referrerId
      });
      
      if (data && !error) {
        setBalance(Number(data.balance));
        setEnergy(data.energy);
      } else {
        // Fallback
        setBalance(0);
        setEnergy(maxEnergy);
      }
    };
    fetchUser();
    
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
    
    // Make sure we have a user
    let currentUserId = user?.id?.toString() || localStorage.getItem('earnegg_device_id') || '123456789';
    let currentUsername = user?.username || user?.first_name || 'tester';

    const { data, error } = await supabase.rpc('sync_taps', { 
      p_telegram_id: currentUserId,
      p_username: currentUsername,
      p_taps: tapsToSync,
      p_max_energy: maxEnergy 
    });

    if (error) {
      console.error("Error syncing to Supabase", error);
    } else if (data) {
      // Sync local state exactly with what DB calculated, in case of discrepancies
      const serverBalance = Number(data.balance);
      const serverEnergy = Number(data.energy);
      // We only update if we haven't tapped again in the meantime
      if (pendingTaps.current === 0) {
        setBalance(serverBalance);
        setEnergy(serverEnergy);
      }
    }
  }, [user, maxEnergy]);

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
