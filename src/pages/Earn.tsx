import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import { supabase } from '../lib/supabase';
import { showAd } from '../lib/adsgram';
import { Play, Zap } from 'lucide-react';
import FloatingAssets from '../components/FloatingAssets';
import './Earn.css';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
}

export default function Earn() {
  const { balance, energy, maxEnergy, handleTap, multitapLevel, adsBlockId, interstitialBlockId, handleAdReward } = useApp();
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const [adLoading, setAdLoading] = useState(false);
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

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
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
    
    setAdLoading(true);
    try {
      const success = await showAd(adsBlockId, 'rewarded');
      if (success) {
        const rewarded = await handleAdReward(1000);
        if (rewarded) {
          hapticFeedback('success');
          setEncouragement("Awesome! +1,000 coins earned! 💰");
        }
      }
    } catch (e) {
      console.error(e);
      hapticFeedback('error');
    }
    setAdLoading(false);
  };

  const onWatchInterstitial = async () => {
    if (!interstitialBlockId) return;
    
    setAdLoading(true);
    try {
      const success = await showAd(interstitialBlockId, 'interstitial');
      if (success) {
        const rewarded = await handleAdReward(500);
        if (rewarded) {
          hapticFeedback('success');
          setEncouragement("Quick bonus! +500 coins! ⚡");
        }
      }
    } catch (e) {
      console.error(e);
      hapticFeedback('error');
    }
    setAdLoading(false);
  };

  return (
    <div className="page-container earn-page animate-fade-in">
      <FloatingAssets />
      
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

      {/* Ad Buttons Grid */}
      <div className="ad-buttons-container">
        {adsBlockId && (
          <button 
            className={`ad-bonus-btn reward interactive-btn ${adLoading ? 'loading' : ''}`}
            onClick={onWatchAd}
            disabled={adLoading}
          >
            <Play size={18} fill="currentColor" />
            <span>{adLoading ? '...' : 'Watch (+1,000)'}</span>
          </button>
        )}
        {interstitialBlockId && (
          <button 
            className={`ad-bonus-btn inter interactive-btn ${adLoading ? 'loading' : ''}`}
            onClick={onWatchInterstitial}
            disabled={adLoading}
          >
            <Zap size={18} fill="currentColor" />
            <span>{adLoading ? '...' : 'Quick (+500)'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
