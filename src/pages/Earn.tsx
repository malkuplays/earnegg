import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import './Earn.css';

interface ClickParticle {
  id: number;
  x: number;
  y: number;
}

export default function Earn() {
  const { balance, energy, maxEnergy, handleTap } = useApp();
  const [particles, setParticles] = useState<ClickParticle[]>([]);
  const eggRef = useRef<HTMLDivElement>(null);
  const particleIdCounter = useRef(0);

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

  return (
    <div className="page-container earn-page animate-fade-in">
      <div className="balance-container">
        <h2 className="caption">Coin Balance</h2>
        <div className="balance-amount">
          <span className="coin-icon">💰</span>
          <span className="balance-number">{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="egg-container">
        <motion.div
          ref={eggRef}
          className="interactive-egg"
          onPointerDown={handlePointerDown}
          whileTap={{ scale: 0.95, rotate: [0, -2, 2, -1, 1, 0] }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
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
                +1
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
    </div>
  );
}
