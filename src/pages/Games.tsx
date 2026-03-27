import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Disc } from 'lucide-react';
import FloatingAssets from '../components/FloatingAssets';
import './Games.css';

export default function Games() {
  const navigate = useNavigate();


  return (
    <div className="page-container games-page animate-fade-in">
      <FloatingAssets />
      
      <div className="header-section">
        <h1 className="page-title">Game Hub</h1>
        <p className="page-subtitle">Play and earn <span style={{ color: 'var(--accent-primary)' }}>rewards</span>!</p>
      </div>

      <div className="featured-section">
        <div className="section-header">
          <span className="section-label">Featured Game</span>
        </div>
        
        <motion.div
          className="featured-card glass-panel"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/wheel')}
        >
          <div className="featured-content">
            <div className="featured-info">
              <h2 className="featured-title">Wheel of Fortune</h2>
              <p className="featured-desc">Spin daily to win coins, energy, and exclusive bonuses!</p>
              <div className="featured-badge">Available Now</div>
            </div>
            <motion.div 
              className="featured-visual"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Disc size={120} className="floating-wheel-icon" />
            </motion.div>
          </div>
          <div className="pulse-overlay"></div>
        </motion.div>

        <motion.div
          className="featured-card glass-panel secondary-featured"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/egg-catcher')}
          style={{ marginTop: '20px' }}
        >
          <div className="featured-content">
            <div className="featured-info">
              <h2 className="featured-title">Egg Catcher</h2>
              <p className="featured-desc">Catch the eggs, earn rewards! Costs 500 energy.</p>
              <div className="featured-badge hot">HOT!</div>
            </div>
            <div className="featured-visual static-egg">
              🥚
            </div>
          </div>
        </motion.div>
      </div>

      <div className="coming-soon-section">
        <div className="coming-soon-badge">Coming Soon</div>
        <div className="coming-soon-games">
          <div className="placeholder-game glass-panel">
            <div className="placeholder-icon">🥚</div>
            <span>Egg Match-3</span>
          </div>
          <div className="placeholder-game glass-panel">
            <div className="placeholder-icon">🚀</div>
            <span>Space Egg</span>
          </div>
        </div>
      </div>
    </div>
  );
}
