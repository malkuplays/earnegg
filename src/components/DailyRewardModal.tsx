import { motion, AnimatePresence } from 'framer-motion';
import { Calendar } from 'lucide-react';
import './DailyRewardModal.css';

interface DailyRewardModalProps {
  reward: number;
  streak: number;
  onClose: () => void;
}

export default function DailyRewardModal({ reward, streak, onClose }: DailyRewardModalProps) {
  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div 
          className="modal-content glass-panel reward-modal shadow-glow"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="modal-badge-icon">
            <Calendar size={40} className="text-warning" />
          </div>
          
          <h2 className="h2 text-warning mb-2">Daily Reward!</h2>
          <p className="body text-dim mb-6">Day {streak} streak. Keep coming back for bigger rewards!</p>
          
          <div className="reward-box mb-6">
            <span className="reward-coin">💰</span>
            <div className="reward-amount">+{reward.toLocaleString()}</div>
          </div>

          <button 
            className="claim-btn"
            onClick={onClose}
          >
            Claim
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
