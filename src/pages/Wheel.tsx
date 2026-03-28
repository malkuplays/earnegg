import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import { showAd } from '../lib/adsgram';
import { ArrowLeft, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FloatingAssets from '../components/FloatingAssets';
import './Wheel.css';

export default function Wheel() {
  const { 
    spinWheel, wheelRewards, 
    spinsToday, freeSpinsPerDay, adsBlockId,
    addExtraSpin
  } = useApp();
  const navigate = useNavigate();
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [showReward, setShowReward] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const canSpin = spinsToday < freeSpinsPerDay && !spinning;

  const handleSpin = async () => {
    if (!canSpin) return;

    setSpinning(true);
    setResult(null);
    setShowReward(false);
    hapticFeedback('medium');

    const data = await spinWheel();
    
    if (data && data.success) {
      const rewardIndex = data.reward_index;
      const segmentAngle = 360 / wheelRewards.length;
      
      // Calculate final rotation
      // 8 full circles (2880 deg) + offset for the reward index
      const extraRotation = (360 * 8) + (360 - (rewardIndex * segmentAngle + segmentAngle / 2));
      const finalRotation = rotation + extraRotation;
      
      setRotation(finalRotation);
      setResult(data.reward);

      // Add periodic haptics to simulate ticker
      const interval = setInterval(() => {
        hapticFeedback('light');
      }, 150);

      // Wait for animation to finish (3s)
      setTimeout(() => {
        clearInterval(interval);
        setSpinning(false);
        setShowReward(true);
        hapticFeedback('success');
        
        // Show ad after spin
        if (adsBlockId) {
          setTimeout(async () => {
             await showAd(adsBlockId, 'interstitial');
          }, 1500);
        }
      }, 3000);
    } else {
      setSpinning(false);
      alert(data.message || 'Error spinning wheel');
    }
  };

  return (
    <div className="page-container wheel-page animate-fade-in">
      <FloatingAssets />
      
      <div className="wheel-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="wheel-stats">
          <div className="stat-pill">
            <span className="stat-label">Spins Today</span>
            <span className="stat-value">{spinsToday} / {freeSpinsPerDay}</span>
          </div>
        </div>
      </div>

      <div className="wheel-content">
        <div className={`wheel-outer ${spinning ? 'is-spinning' : ''}`}>
          <div className="wheel-pointer">▼</div>
          <div 
            ref={wheelRef}
            className={`wheel-inner ${spinning ? 'is-spinning' : ''}`}
            style={{ 
              transform: `rotate(${rotation}deg)`
            }}
          >
            <svg viewBox="0 0 100 100" className="wheel-svg">
              {wheelRewards.map((reward, i) => {
                const angle = 360 / wheelRewards.length;
                const startAngle = i * angle;
                const endAngle = (i + 1) * angle;
                
                // SVG path for a slice
                const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
                const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
                const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
                const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);
                
                const path = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;
                const colors = ['#f0c929', '#0d0f14', '#e0b020', '#1a1d24'];
                
                return (
                  <g key={i}>
                    <path d={path} fill={colors[i % colors.length]} stroke="#333" strokeWidth="0.5" />
                    <text
                      x="50"
                      y="20"
                      transform={`rotate(${startAngle + angle / 2}, 50, 50)`}
                      fill={i % 2 === 0 ? "#0d0f14" : "#f0c929"}
                      fontSize="4"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {reward.label}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="wheel-center">
              <div className="wheel-center-dot" />
            </div>
          </div>
        </div>

        <button 
          className={`spin-btn ${!canSpin ? 'disabled' : ''}`}
          onClick={handleSpin}
          disabled={!canSpin}
        >
          {spinning ? 'Spinning...' : canSpin ? 'SPIN NOW' : 'Daily spins exhausted'}
        </button>

        {!canSpin && !spinning && adsBlockId && (
          <button 
            className="extra-spin-ad-btn glass-panel"
            onClick={async () => {
              setSpinning(true);
              const success = await showAd(adsBlockId, 'rewarded');
              if (success) {
                await addExtraSpin();
                alert('Extra spin granted!');
              }
              setSpinning(false);
            }}
          >
            <Zap size={20} className="text-secondary" />
            Watch Ad for Extra Spin
          </button>
        )}
      </div>

      <AnimatePresence>
        {showReward && result && (
          <motion.div 
            className="reward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="reward-modal glass-panel"
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
            >
              <div className="reward-glow" />
              <h2 className="reward-title">Congratulations!</h2>
              <div className="reward-visual">
                <div className="reward-icon">
                  {result.type === 'coins' ? '💰' : '⚡'}
                </div>
                <div className="reward-amount">+{result.amount.toLocaleString()}</div>
                <div className="reward-type">{result.type.toUpperCase()}</div>
              </div>
              <button className="claim-btn" onClick={() => setShowReward(false)}>
                Awesome!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
