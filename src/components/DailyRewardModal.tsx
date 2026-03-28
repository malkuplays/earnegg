import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CheckCircle2, Circle, TrendingUp, Zap } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { showAd } from '../lib/adsgram';
import './DailyRewardModal.css';

interface DailyRewardModalProps {
  reward: number;
  streak: number;
  onClose: () => void;
}

export default function DailyRewardModal({ reward, streak, onClose }: DailyRewardModalProps) {
  const { adsBlockId, doubleDailyReward } = useApp();
  const [loading, setLoading] = useState(false);
  const [isDoubled, setIsDoubled] = useState(false);

  // Calculate day in 7-day cycle (1-7)
  const dayInCycle = ((streak - 1) % 7) + 1;

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.4, 
        ease: [0.16, 1, 0.3, 1] as any,
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div 
          className="modal-content premium-modal shadow-glow"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className="modal-glow" />
          
          <motion.div className="modal-header" variants={itemVariants}>
            <div className="premium-badge">
              <Sparkles size={16} className="text-gold" />
              <span>STREAK DAY {streak}</span>
            </div>
            <h2 className="h2 gold-gradient-text mt-2">Daily Bonus</h2>
          </motion.div>

          <motion.div className="streak-visualizer" variants={itemVariants}>
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div key={day} className={`streak-day ${day < dayInCycle ? 'completed' : day === dayInCycle ? 'current' : ''}`}>
                <div className="day-label">Day {day}</div>
                <div className="day-dot">
                  {day < dayInCycle ? (
                    <CheckCircle2 size={16} />
                  ) : day === dayInCycle ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Circle size={16} fill="var(--accent-primary)" />
                    </motion.div>
                  ) : (
                    <Circle size={16} />
                  )}
                </div>
              </div>
            ))}
          </motion.div>
          
          <motion.div className="reward-showcase" variants={itemVariants}>
            <div className="reward-icon-wrapper">
              <span className="reward-emoji">🥚</span>
              <div className="reward-glow" />
            </div>
            <div className="reward-details">
              <div className="reward-label px-2 py-1 rounded-full text-[10px] font-bold tracking-widest bg-yellow-400/20 text-yellow-400 mb-1 inline-block border border-yellow-400/30 uppercase">YOU WON</div>
              <div className="reward-value">+{isDoubled ? (reward * 2).toLocaleString() : reward.toLocaleString()}</div>
              <div className="reward-currency-label">COINS</div>
            </div>
          </motion.div>

          <motion.div className="modal-footer flex flex-col gap-3" variants={itemVariants}>
            {!isDoubled && adsBlockId && (
              <button 
                className="double-btn-premium"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const success = await showAd(adsBlockId, 'rewarded');
                  if (success) {
                    const doubled = await doubleDailyReward();
                    if (doubled) setIsDoubled(true);
                  }
                  setLoading(false);
                }}
              >
                <Zap size={18} fill="currentColor" />
                <span>DOUBLE REWARD (2X)</span>
              </button>
            )}

            <button 
              className="claim-btn-premium"
              onClick={onClose}
              disabled={loading}
            >
              {isDoubled ? 'CLAIM 2X BONUS' : 'CLAIM REWARD'}
            </button>
            <p className="caption text-dim mt-1">
              <TrendingUp size={12} className="inline mr-1" />
              Keep your streak alive for bigger rewards!
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
