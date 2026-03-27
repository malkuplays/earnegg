import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { Zap, Battery, Timer, Bot, ChevronRight, UserPlus, Gift, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import AdsterraBanner from '../components/AdsterraBanner';
import AdsterraNative from '../components/AdsterraNative';
import './Boosts.css';

export default function Boosts() {
  const { 
    balance, 
    multitapLevel, 
    energyLimitLevel, 
    rechargeSpeedLevel, 
    hasTapBot, 
    tapBotLevel,
    referralBonusLevel,
    dailyRewardLevel,
    user, 
    refreshStats 
  } = useApp();

  const [loading, setLoading] = useState<string | null>(null);

  const upgrades = [
    {
      id: 'multitap',
      name: 'Multitap',
      description: 'Earn more coins per tap',
      icon: <Zap size={24} className="text-accent" />,
      level: multitapLevel,
      cost: multitapLevel * 1000,
      maxLevel: 50
    },
    {
      id: 'energy_limit',
      name: 'Energy Limit',
      description: 'Increase your maximum energy',
      icon: <Battery size={24} className="text-warning" />,
      level: energyLimitLevel,
      cost: energyLimitLevel * 2000,
      maxLevel: 50
    },
    {
      id: 'recharge_speed',
      name: 'Recharging Speed',
      description: 'Fill energy faster',
      icon: <Timer size={24} className="text-success" />,
      level: rechargeSpeedLevel,
      cost: rechargeSpeedLevel * 3000,
      maxLevel: 25
    },
    {
      id: 'tap_bot',
      name: 'Tap Bot',
      description: 'Auto-mines coins while you are offline (up to 12h)',
      icon: <Bot size={24} className="text-secondary" />,
      level: hasTapBot ? 'Active' : 0,
      cost: hasTapBot ? 0 : 300000,
      maxLevel: 1 
    },
    {
      id: 'tap_bot_efficiency',
      name: 'Bot Efficiency',
      description: 'Mining speed & longer offline time',
      icon: <Cpu size={24} style={{ color: '#a855f7' }} />,
      level: tapBotLevel,
      cost: tapBotLevel * 10000,
      maxLevel: 20
    },
    {
      id: 'referral_bonus',
      name: 'Referral Bonus',
      description: 'Get more coins from every invite',
      icon: <UserPlus size={24} style={{ color: '#06b6d4' }} />,
      level: referralBonusLevel,
      cost: referralBonusLevel * 50000,
      maxLevel: 10
    },
    {
      id: 'daily_reward_bonus',
      name: 'Daily Bonus',
      description: 'Higher coins on daily login streak',
      icon: <Gift size={24} style={{ color: '#f43f5e' }} />,
      level: dailyRewardLevel,
      cost: dailyRewardLevel * 25000,
      maxLevel: 10
    }
  ];

  const handleBuy = async (id: string, cost: number, currentLevel: number | string, maxLevel: number) => {
    if (!user) return;
    if (balance < cost) return;
    if (currentLevel === maxLevel || currentLevel === 'Active') return; // Maxed out
    
    setLoading(id);
    const { data, error } = await supabase.rpc('buy_upgrade', {
      p_player_id: user.id.toString(),
      p_upgrade_type: id,
      p_cost: cost
    });

    if (data && !error) {
      await refreshStats();
    }
    setLoading(null);
  };

  return (
    <div className="page-container boosts-page animate-fade-in">
      <div className="page-header center-header text-center">
        <h1 className="h1">Boosts</h1>
        <p className="body text-dim">Upgrade your mining empire.</p>
        <div className="balance-badge">
          <span>💰</span> {balance.toLocaleString()}
        </div>
      </div>

      <AdsterraBanner />

      <div className="boosts-list">
        {upgrades.map((upgrade) => {
          const isMaxxed = upgrade.level === upgrade.maxLevel || upgrade.level === 'Active';
          const cantAfford = balance < upgrade.cost && !isMaxxed;

          return (
            <motion.div 
              key={upgrade.id}
              className={`boost-card glass-panel ${isMaxxed ? 'maxxed' : ''}`}
            >
              <div className="boost-icon-wrap">
                {upgrade.icon}
              </div>
              <div className="boost-info">
                <h3 className="h3 title-row">
                  {upgrade.name}
                  <span className="level-badge">Lvl {upgrade.level}</span>
                </h3>
                <p className="caption text-dim">{upgrade.description}</p>
                <div className="cost-row">
                  {!isMaxxed ? (
                    <>
                      <span className="coin-mini">💰</span>
                      <span className={cantAfford ? 'text-error font-bold' : 'font-bold'}>
                        {upgrade.cost.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-success font-bold">Maxed Out</span>
                  )}
                </div>
              </div>
              <div className="boost-action">
                {!isMaxxed && (
                  <button 
                    className="buy-btn"
                    disabled={cantAfford || loading === upgrade.id}
                    onClick={() => handleBuy(upgrade.id, upgrade.cost, upgrade.level, upgrade.maxLevel)}
                  >
                    {loading === upgrade.id ? '...' : <ChevronRight size={20} />}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <AdsterraNative />
    </div>
  );
}
