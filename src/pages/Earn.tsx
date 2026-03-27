import { useState, useRef, useCallback, useEffect, type PointerEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import { supabase } from '../lib/supabase';
import { showAd } from '../lib/adsgram';
import { Play, Zap } from 'lucide-react';
import FloatingAssets from '../components/FloatingAssets';
import { MonetagNativeBanner } from '../components/MonetagAds';
import './Earn.css';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
}

export default function Earn() {
  const { 
    balance, energy, maxEnergy, handleTap, multitapLevel, 
    adsBlockId, interstitialBlockId, handleAdReward,
    rewardAmount, interstitialAmount,
    monetagNativeId, user
  } = useApp();
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [adLoading, setAdLoading] = useState(false);
  const [showRewardPopup, setShowRewardPopup] = useState<{show: boolean, amount: number}>({show: false, amount: 0});
  const [encouragement, setEncouragement] = useState<string>("Keep tapping!");
  const [normalEncouragements, setNormalEncouragements] = useState<string[]>(["Keep tapping!"]);
  const [lowEnergyAlerts, setLowEnergyAlerts] = useState<string[]>(["Energy running low!"]);
  const eggRef = useRef<HTMLDivElement>(null);
  const particleIdCounter = useRef(0);

  useEffect(() => {
    const fetchEncouragements = async () => {
      const { data } = await supabase.from('encouragements').select('message, type');
      if (data && data.length > 0) {
        const normals = data.filter(d => d.type === 'normal').map(d => d.message);
        const lows = data.filter(d => d.type === 'low_energy').map(d => d.message);
        if (normals.length) setNormalEncouragements(normals);
        if (lows.length) setLowEnergyAlerts(lows);
      }
    };
    fetchEncouragements();
  }, []);

  const isLowEnergy = energy < maxEnergy * 0.15; // 15% threshold
  
  useEffect(() => {
    if (isLowEnergy) {
       setEncouragement(lowEnergyAlerts[Math.floor(Math.random() * lowEnergyAlerts.length)] || "Energy low!");
    } else {
       setEncouragement(normalEncouragements[Math.floor(Math.random() * normalEncouragements.length)] || "Keep tapping!");
    }
  }, [isLowEnergy, normalEncouragements, lowEnergyAlerts]);

  const handlePointerDown = useCallback((e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (energy <= 0) {
      hapticFeedback('rigid'); // Notify user they are out of energy
      return;
    }

    handleTap();
    
    // Add particle logic for the +1 animation
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newParticleId = particleIdCounter.current++;
    setParticles(prev => [...prev, { id: newParticleId, x, y }]);
    
    hapticFeedback('light');

    setTimeout(() => {
      setParticles(prev => prev.filter(p => p.id !== newParticleId));
    }, 1000);
  }, [energy, handleTap]);

  const onWatchAd = async () => {
    if (!adsBlockId) return;
    console.log('Ad Watch triggered. adsBlockId:', adsBlockId);
    setAdLoading(true);
    try {
      const success = await showAd(adsBlockId, 'rewarded');
      console.log('Ad show success:', success);
      if (success) {
        const rewarded = await handleAdReward(rewardAmount);
        if (rewarded) {
          hapticFeedback('success');
          setEncouragement(`Awesome! +${rewardAmount.toLocaleString()} coins earned! 💰`);
          setShowRewardPopup({ show: true, amount: rewardAmount });
          setTimeout(() => setShowRewardPopup({ show: false, amount: 0 }), 2500);
        } else {
          console.error('handleAdReward failed after successful ad watch');
          setEncouragement("Balance update failed. Check internet!");
        }
      } else {
        console.warn('Ad was not completed or failed to show');
        setEncouragement("Watch full ad to get coins! 📺");
      }
    } catch (e) {
      console.error('AdsGram Exception:', e);
      hapticFeedback('error');
    }
    setAdLoading(false);
  };

  const onWatchInterstitial = async () => {
    if (!interstitialBlockId) return;
    console.log('Quick Ad triggered. interstitialBlockId:', interstitialBlockId);
    setAdLoading(true);
    try {
      const success = await showAd(interstitialBlockId, 'interstitial');
      console.log('Quick show success:', success);
      if (success) {
        const rewarded = await handleAdReward(interstitialAmount);
        if (rewarded) {
          hapticFeedback('success');
          setEncouragement(`Quick bonus! +${interstitialAmount.toLocaleString()} coins! ⚡`);
          setShowRewardPopup({ show: true, amount: interstitialAmount });
          setTimeout(() => setShowRewardPopup({ show: false, amount: 0 }), 2500);
        } else {
          console.error('handleAdReward failed after quick ad watch');
          setEncouragement("Reward sync failed!");
        }
      } else {
        console.warn('Quick ad was skipped or failed');
        setEncouragement("Quick ad failed to load.");
      }
    } catch (e) {
      console.error('AdsGram Exception (Quick):', e);
      hapticFeedback('error');
    }
    setAdLoading(false);
  };

  return (
    <div className="page-container earn-page animate-fade-in">
      <FloatingAssets />
      
      <AnimatePresence>
        {showRewardPopup.show && (
          <div className="reward-popup-overlay">
            <motion.div 
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -100 }}
              className="reward-popup"
            >
              <div className="reward-popup-content">
                <span className="reward-plus">+</span>
                <span className="reward-amount">{showRewardPopup.amount.toLocaleString()}</span>
                <span className="reward-coins">COINS</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      <div className="balance-container">
        <h2 className="caption mt-2">Coin Balance</h2>
        <div className="balance-amount">
          <span className="coin-icon">💰</span>
          <span className="balance-number">{balance.toLocaleString()}</span>
        </div>
        <p className={`encouragement-text ${isLowEnergy ? 'low-energy-alert' : ''}`}>
          {encouragement}
        </p>
      </div>

      <div className="egg-container">
        <motion.div
          ref={eggRef}
          className="interactive-egg"
          onPointerDown={handlePointerDown}
          animate={{
            boxShadow: [
              "inset -10px -10px 40px rgba(0,0,0,0.5), 0 0 40px rgba(240, 201, 41, 0.2), 0 20px 40px rgba(0,0,0,0.4)",
              "inset -10px -10px 40px rgba(0,0,0,0.5), 0 0 80px rgba(240, 201, 41, 0.8), 0 20px 40px rgba(0,0,0,0.6)",
              "inset -10px -10px 40px rgba(0,0,0,0.5), 0 0 40px rgba(240, 201, 41, 0.2), 0 20px 40px rgba(0,0,0,0.4)"
            ],
            scale: [1, 1.02, 1],
            y: [0, -5, 0]
          }}
          transition={{
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop"
          }}
          whileTap={{ 
            scale: 0.92, 
            rotate: [0, -4, 4, -2, 2, 0], 
            y: 0,
            transition: { type: 'spring', stiffness: 400, damping: 10 } 
          }}
          style={{ touchAction: 'none' }} // crucial for multi-touch prevent-scrolling
        >
          {/* We use an emoji for simplicity, but could be an image */}
          <div className="egg-emoji">🥚</div>

          {/* Floating +1 Particles */}
          <AnimatePresence>
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="click-particle"
                initial={{ opacity: 1, y: p.y - 20, x: p.x - 10, scale: 0.8 }}
                animate={{ opacity: 0, y: p.y - 120, scale: 1.2 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                +{multitapLevel}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
      
      <div className="energy-bar-container">
        <div className="energy-labels">
          <span className="caption">Energy</span>
          <span className="caption">{energy} / {maxEnergy} ⚡</span>
        </div>
        <div className="energy-bar-bg">
          <div className="energy-bar-fill" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
        </div>
      </div>

      {monetagNativeId && user && (
        <MonetagNativeBanner 
          zoneId={monetagNativeId} 
          userId={user.id.toString()} 
          onReward={() => {
            handleAdReward(500); // Fixed 500 reward for native banner
            setEncouragement("Native Bonus! +500 coins! 🎁");
            setShowRewardPopup({ show: true, amount: 500 });
            setTimeout(() => setShowRewardPopup({ show: false, amount: 0 }), 2500);
          }}
        />
      )}

      {/* Ad Buttons Grid */}
      <div className="ad-buttons-container">
        {adsBlockId && (
          <button 
            className={`ad-bonus-btn reward interactive-btn ${adLoading ? 'loading' : ''}`}
            onClick={onWatchAd}
            disabled={adLoading}
          >
            <Play size={18} fill="currentColor" />
            <span>{adLoading ? '...' : `Watch (+${rewardAmount.toLocaleString()})`}</span>
          </button>
        )}
        {interstitialBlockId && (
          <button 
            className={`ad-bonus-btn inter interactive-btn ${adLoading ? 'loading' : ''}`}
            onClick={onWatchInterstitial}
            disabled={adLoading}
          >
            <Zap size={18} fill="currentColor" />
            <span>{adLoading ? '...' : `Quick (+${interstitialAmount.toLocaleString()})`}</span>
          </button>
        )}
      </div>
    </div>
  );
}
