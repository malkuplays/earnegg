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
      <div className="modal-overlay z-50 fixed inset-0 flex items-center justify-center bg-black/80 p-4">
        <motion.div 
          className="modal-content glass-panel reward-modal text-center p-6 relative w-full max-w-sm rounded-2xl border border-[rgba(255,255,255,0.1)]"
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 p-4 bg-bg-secondary rounded-full shadow-[0_0_30px_rgba(240,201,41,0.5)] border border-[rgba(240,201,41,0.3)]">
            <Calendar size={40} className="text-warning" />
          </div>
          
          <h2 className="h2 text-warning mb-2 mt-8">Daily Reward!</h2>
          <p className="body text-dim mb-6">Day {streak} streak. Keep coming back for bigger rewards!</p>
          
          <div className="reward-box bg-bg-tertiary rounded-xl p-4 mb-6">
            <span className="text-4xl">💰</span>
            <div className="text-2xl font-bold mt-2">+{reward.toLocaleString()}</div>
          </div>

          <button 
            className="w-full py-3 bg-accent-primary text-black font-bold rounded-xl text-lg hover:brightness-110 transition-all"
            onClick={onClose}
          >
            Claim
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
