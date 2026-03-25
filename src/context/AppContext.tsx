import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getTelegramStartParam } from '../lib/telegram';
import { supabase } from '../lib/supabase';

interface DailyRewardData {
  reward: number;
  streak: number;
}

interface AppContextType {
  balance: number;
  energy: number;
  maxEnergy: number;
  multitapLevel: number;
  energyLimitLevel: number;
  rechargeSpeedLevel: number;
  hasTapBot: boolean;
  loginStreak: number;
  dailyRewardData: DailyRewardData | null;
  setDailyRewardData: (data: DailyRewardData | null) => void;
  handleTap: () => void;
  user: any | null;
  refreshStats: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode, initialUser: any }> = ({ children, initialUser }) => {
  const [balance, setBalance] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [user, setUser] = useState<any | null>(initialUser);

  const [multitapLevel, setMultitapLevel] = useState(1);
  const [energyLimitLevel, setEnergyLimitLevel] = useState(1);
  const [rechargeSpeedLevel, setRechargeSpeedLevel] = useState(1);
  const [hasTapBot, setHasTapBot] = useState(false);
  const [loginStreak, setLoginStreak] = useState(0);
  const [dailyRewardData, setDailyRewardData] = useState<DailyRewardData | null>(null);

  const maxEnergy = 1000 + (energyLimitLevel - 1) * 500;
  
  // Ref for debouncing Supabase updates
  const pendingTaps = useRef(0);
  const syncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // Sync internal user state if initialUser changes (though it shouldn't once mounted)
    if (initialUser && !user) {
      setUser(initialUser);
    }
    
    // Fetch or Register user profile with Supabase securely
    const fetchUser = async () => {
      const activeUser = initialUser || user;
      if (!activeUser) return;
      const startParam = getTelegramStartParam() || '';
      const referrerId = startParam.startsWith('ref_') ? startParam.replace('ref_', '') : '';
      
      let safeId = activeUser?.id?.toString() || '';
      let safeName = activeUser?.username || activeUser?.first_name || 'tester';

      const { data, error } = await supabase.rpc('register_player', {
        p_telegram_id: safeId,
        p_username: safeName,
        p_referrer_id: referrerId
      });
      
      if (data && !error) {
        setBalance(Number(data.balance));
        setEnergy(data.energy);
        setMultitapLevel(data.multitap_level || 1);
        setEnergyLimitLevel(data.energy_limit_level || 1);
        setRechargeSpeedLevel(data.recharge_speed_level || 1);
        setHasTapBot(data.has_tap_bot || false);
        setLoginStreak(data.login_streak || 0);

        if (data.has_tap_bot) {
          const botRes = await supabase.rpc('sync_bot_earnings', { p_player_id: safeId });
          if (botRes.data && botRes.data > 0) {
            setBalance(prev => prev + botRes.data);
          }
        }

        const dailyRes = await supabase.rpc('claim_daily_reward', { p_player_id: activeUser.id.toString() });
        if (dailyRes.data && dailyRes.data.success) {
           setDailyRewardData({
             reward: dailyRes.data.reward,
             streak: dailyRes.data.streak
           });
           setBalance(prev => prev + dailyRes.data.reward);
        }
      } else {
        // Fallback
        setBalance(0);
        setEnergy(1000);
      }
    };
    fetchUser();
  }, []);

  // Energy regeneration interval
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => (prev < maxEnergy ? Math.min(prev + rechargeSpeedLevel, maxEnergy) : prev));
    }, 2000); 
    
    return () => clearInterval(interval);
  }, [maxEnergy, rechargeSpeedLevel]);

  const refreshStats = async () => {
    if (!user) return;
    const { data } = await supabase.from('players').select('*').eq('id', user.id.toString()).single();
    if (data) {
      setBalance(Number(data.balance));
      setEnergy(data.energy);
      setMultitapLevel(data.multitap_level || 1);
      setEnergyLimitLevel(data.energy_limit_level || 1);
      setRechargeSpeedLevel(data.recharge_speed_level || 1);
      setHasTapBot(data.has_tap_bot || false);
      setLoginStreak(data.login_streak || 0);
    }
  };

  const syncWithDatabase = useCallback(async () => {
    if (pendingTaps.current === 0) return;
    
    const tapsToSync = pendingTaps.current;
    // Optimistically reset
    pendingTaps.current = 0;
    syncTimeoutRef.current = null;
    
    console.log(`Syncing ${tapsToSync} taps to database...`);
    
    // Make sure we have a user
    if (!user) return;
    let currentUserId = user.id.toString();
    let currentUsername = user.username || user.first_name || 'User';

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
      setBalance(prev => prev + (1 * multitapLevel));
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
    <AppContext.Provider value={{ 
      balance, 
      energy, 
      maxEnergy, 
      multitapLevel,
      energyLimitLevel,
      rechargeSpeedLevel,
      hasTapBot,
      loginStreak,
      dailyRewardData,
      setDailyRewardData,
      handleTap, 
      user,
      refreshStats
    }}>
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
