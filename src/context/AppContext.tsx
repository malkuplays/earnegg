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
  tapBotLevel: number;
  referralBonusLevel: number;
  dailyRewardLevel: number;
  loginStreak: number;
  dailyRewardData: DailyRewardData | null;
  setDailyRewardData: (data: DailyRewardData | null) => void;
  handleTap: () => void;
  user: any | null;
  refreshStats: () => Promise<void>;
  adsBlockId: string | null;
  interstitialBlockId: string | null;
  taskBlockId: string | null;
  rewardAmount: number;
  interstitialAmount: number;
  taskAmount: number;
  handleAdReward: (amount?: number) => Promise<boolean>;
  popupHtml: string | null;
  dismissPopup: () => void;
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
  const [tapBotLevel, setTapBotLevel] = useState(1);
  const [referralBonusLevel, setReferralBonusLevel] = useState(1);
  const [dailyRewardLevel, setDailyRewardLevel] = useState(1);
  const [loginStreak, setLoginStreak] = useState(0);
  const [dailyRewardData, setDailyRewardData] = useState<DailyRewardData | null>(null);
  const [adsBlockId, setAdsBlockId] = useState<string | null>(null);
  const [interstitialBlockId, setInterstitialBlockId] = useState<string | null>(null);
  const [taskBlockId, setTaskBlockId] = useState<string | null>(null);
  const [rewardAmount, setRewardAmount] = useState<number>(1000);
  const [interstitialAmount, setInterstitialAmount] = useState<number>(500);
  const [taskAmount, setTaskAmount] = useState<number>(2500);
  const [popupHtml, setPopupHtml] = useState<string | null>(null);

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
      let safeName = activeUser?.username || activeUser?.first_name || 'Player';

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
        setTapBotLevel(data.tap_bot_level || 1);
        setReferralBonusLevel(data.referral_bonus_level || 1);
        setDailyRewardLevel(data.daily_reward_level || 1);
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

  // Fetch multiple ad configurations from Supabase
  const fetchConfig = async () => {
    const { data } = await supabase.from('config').select('key, value');
    if (data) {
      const rewardId = data.find(c => c.key === 'adsgram_block_id')?.value;
      const interId = data.find(c => c.key === 'adsgram_interstitial_id')?.value;
      const taskId = data.find(c => c.key === 'adsgram_task_id')?.value;
      
      const rAmt = data.find(c => c.key === 'adsgram_reward_amount')?.value;
      const iAmt = data.find(c => c.key === 'adsgram_interstitial_amount')?.value;
      const tAmt = data.find(c => c.key === 'adsgram_task_amount')?.value;

      if (rewardId) setAdsBlockId(rewardId);
      if (interId) setInterstitialBlockId(interId);
      if (taskId) setTaskBlockId(taskId);

      if (rAmt) setRewardAmount(parseInt(rAmt));
      if (iAmt) setInterstitialAmount(parseInt(iAmt));
      if (tAmt) setTaskAmount(parseInt(tAmt));

      const p_html = data.find(c => c.key === 'popup_html')?.value;
      if (p_html) {
        const seenHtml = localStorage.getItem('seen_popup_html');
        if (seenHtml !== p_html) {
          setPopupHtml(p_html);
        }
      }
    }
  };

    fetchUser();
    fetchConfig();
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
      setTapBotLevel(data.tap_bot_level || 1);
      setReferralBonusLevel(data.referral_bonus_level || 1);
      setDailyRewardLevel(data.daily_reward_level || 1);
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

  const handleAdReward = async (amount: number = 1000) => {
    if (!user?.id) return false;
    const { error } = await supabase.rpc('reward_ad_watch', { 
      p_telegram_id: user.id.toString(),
      p_reward_amount: amount
    });
    if (!error) {
       // Since the RPC doesn't return the new balance in the same way now, we refresh or assume success
       setBalance(prev => prev + amount);
       return true;
    }
    return false;
  };

  return (
    <AppContext.Provider value={{ 
      balance, 
      energy, 
      maxEnergy, 
      multitapLevel,
      energyLimitLevel,
      rechargeSpeedLevel,
      hasTapBot,
      tapBotLevel,
      referralBonusLevel,
      dailyRewardLevel,
      loginStreak,
      dailyRewardData,
      setDailyRewardData,
      handleTap, 
      user,
      refreshStats,
      adsBlockId,
      interstitialBlockId,
      taskBlockId,
      rewardAmount,
      interstitialAmount,
      taskAmount,
      handleAdReward,
      popupHtml,
      dismissPopup: () => {
        if (popupHtml) {
          localStorage.setItem('seen_popup_html', popupHtml);
          setPopupHtml(null);
        }
      }
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
