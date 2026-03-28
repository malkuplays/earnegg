import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import { showAd } from '../lib/adsgram';
import './EggTower.css';

interface TowerLayer {
  id: number;
  x: number; // percentage
  y: number; // pixels from bottom base
  wobbleOffset: number;
}

interface Popup {
  id: number;
  x: number;
  y: number;
  text: string;
}

export default function EggTower() {
  const { 
    balance, 
    energy, 
    startEggTower, 
    completeEggTower, 
    interstitialBlockId, 
    adsBlockId, 
    handleAdReward 
  } = useApp();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [tower, setTower] = useState<TowerLayer[]>([]);
  const [wobble, setWobble] = useState(0); // 0 to 100
  const [craneX, setCraneX] = useState(50);
  const [fallingEgg, setFallingEgg] = useState<{ x: number, y: number } | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDoubled, setIsDoubled] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const gameStateRef = useRef<'start' | 'playing' | 'gameover'>('start');
  const cranePosRef = useRef(50);
  const fallingEggRef = useRef<{ x: number, y: number } | null>(null);
  const towerRef = useRef<TowerLayer[]>([]);
  const scoreRef = useRef(0);
  const wobbleRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef(0);

  const LAYER_HEIGHT = 42; // pixels
  const BASE_Y = 140; // pixels from bottom (base 100 + height 40)
  const CRANE_Y = 150; // pixels from top
  const WOBBLE_LIMIT = 40; // max cumulative offset before collapse

  const addPopup = (x: number, y: number, text: string) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 800);
  };

  const updateGame = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return;

    if (!lastTimeRef.current) lastTimeRef.current = time;
    const delta = time - lastTimeRef.current;
    lastTimeRef.current = time;

    // 1. Move Crane
    if (!fallingEggRef.current) {
      const speed = 0.002 + (scoreRef.current / 50000); // Speed up as score increases
      const x = 50 + Math.sin(time * speed) * 35;
      cranePosRef.current = x;
      setCraneX(x);
    }

    // 2. Move Falling Egg
    if (fallingEggRef.current) {
      const gravity = 0.6;
      fallingEggRef.current.y += gravity * delta;
      setFallingEgg({ ...fallingEggRef.current });

      // Collision Detection
      const containerHeight = containerRef.current?.offsetHeight || 600;
      const towerTopY = containerHeight - BASE_Y - (towerRef.current.length * LAYER_HEIGHT);
      
      if (fallingEggRef.current.y >= towerTopY) {
        // Landing check
        const prevX = towerRef.current.length > 0 
          ? towerRef.current[towerRef.current.length - 1].x 
          : 50;
        
        const offset = Math.abs(fallingEggRef.current.x - prevX);
        const MAX_OFFSET = 12; // Max offset to still "land"

        if (offset < MAX_OFFSET) {
          // Success!
          const bonus = offset < 2 ? 50 : 0; // Perfect bonus
          
          scoreRef.current += 10 + bonus;
          wobbleRef.current += offset * 1.5;
          
          const newLayer: TowerLayer = {
            id: Date.now(),
            x: fallingEggRef.current.x,
            y: towerRef.current.length * LAYER_HEIGHT,
            wobbleOffset: (fallingEggRef.current.x - prevX) * 0.5
          };

          towerRef.current = [...towerRef.current, newLayer];
          setTower([...towerRef.current]);
          setScore(scoreRef.current);
          setWobble(Math.min(100, (wobbleRef.current / WOBBLE_LIMIT) * 100));
          
          if (bonus > 0) {
            addPopup(fallingEggRef.current.x, 30, "PERFECT! +50");
            hapticFeedback('medium');
          } else {
            hapticFeedback('light');
          }

          fallingEggRef.current = null;
          setFallingEgg(null);

          // Check if wobble is too high
          if (wobbleRef.current >= WOBBLE_LIMIT) {
            endGame();
            return;
          }
        } else {
          // Missed!
          hapticFeedback('error');
          endGame();
          return;
        }
      }
    }

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, []);

  const handleDrop = () => {
    if (gameStateRef.current !== 'playing' || fallingEggRef.current || countdown !== null) return;
    
    fallingEggRef.current = {
      x: cranePosRef.current,
      y: CRANE_Y
    };
    setFallingEgg({ ...fallingEggRef.current });
    hapticFeedback('light');
  };

  const startGame = async () => {
    if (balance < 1000) {
      alert('Not enough coins! (Need 1000)');
      return;
    }
    if (energy < 500) {
      alert('Not enough energy! (Need 500)');
      return;
    }

    setLoading(true);
    try {
      const res = await startEggTower();
      if (!res.success) {
        alert(res.message || 'Failed to start game');
        setLoading(false);
        return;
      }
    } catch (err) {
      alert('Error starting game');
      setLoading(false);
      return;
    }
    setLoading(false);
    
    setScore(0);
    setTower([]);
    setWobble(0);
    setPopups([]);
    setFallingEgg(null);
    scoreRef.current = 0;
    wobbleRef.current = 0;
    towerRef.current = [];
    fallingEggRef.current = null;
    
    setGameState('playing');
    gameStateRef.current = 'start'; // Keep it start until countdown ends
    setCountdown(3);
    setIsDoubled(false);
    hapticFeedback('medium');
    lastTimeRef.current = 0; // Reset time
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        hapticFeedback('light');
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setTimeout(() => {
        setCountdown(null);
        gameStateRef.current = 'playing';
        lastTimeRef.current = performance.now();
        if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = requestAnimationFrame(updateGame);
      }, 500);
    }
  }, [countdown, updateGame]);

  const endGame = async () => {
    if (gameStateRef.current === 'gameover') return;
    gameStateRef.current = 'gameover';
    setGameState('gameover');
    setScore(scoreRef.current);
    
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    
    setLoading(true);
    try {
      const data = await completeEggTower(scoreRef.current);
      
      
      if (data?.success) {
        // We could use data.coins_earned if needed, but we reflect score in UI
      }
    } catch (err) {
      console.error("Failed to complete game:", err);
    }
    setLoading(false);
  };

  const handlePlayAgain = async () => {
    if (interstitialBlockId) {
      setLoading(true);
      await showAd(interstitialBlockId, 'interstitial');
      setLoading(false);
    }
    startGame();
  };

  const handleBackToHub = async () => {
    if (interstitialBlockId) {
      setLoading(true);
      await showAd(interstitialBlockId, 'interstitial');
      setLoading(false);
    }
    navigate('/games');
  };

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  // Camera Offset: Move tower down as it grows
  const cameraOffset = Math.max(0, (tower.length - 5) * LAYER_HEIGHT);

  return (
    <div className="egg-tower-page animate-fade-in" onClick={handleDrop}>
      <div 
        ref={containerRef}
        className="game-canvas-container"
      >
        <div className="game-bg-elements" />
        
        <div className="game-header">
          <button className="back-btn" onClick={(e) => { e.stopPropagation(); navigate('/games'); }}>
            <ArrowLeft size={24} />
          </button>
          
          <div className="game-stats-top">
            <div className="game-stat-item">
              <span className="game-stat-label">Height</span>
              <span className="game-stat-value">{tower.length}</span>
            </div>
            <div className="game-stat-item">
              <span className="game-stat-label">Score</span>
              <span className="game-stat-value score">{score}</span>
            </div>
          </div>
        </div>

        {/* Wobble Meter */}
        <div className="wobble-container">
          <div className="wobble-fill" style={{ height: `${wobble}%` }} />
        </div>

        {/* Crane & Oscillating Egg */}
        <div className="crane-container">
          <div className="crane-line" style={{ left: `${craneX}%` }} />
          {!fallingEgg && (
            <div className="crane-egg egg" style={{ left: `${craneX}%` }} />
          )}
        </div>

        {/* Falling Egg */}
        {fallingEgg && (
          <div 
            className="falling-egg egg" 
            style={{ 
              left: `${fallingEgg.x}%`, 
              top: `${fallingEgg.y}px`,
              transform: 'translate3d(-50%, 0, 0)'
            }} 
          />
        )}

        {/* Tower Container */}
        <div 
          className="tower-container" 
          style={{ 
            transform: `translate3d(0, ${cameraOffset}px, 0)` 
          }}
        >
          <div className="tower-base" />
          {tower.map((layer, index) => (
            <div 
              key={layer.id}
              className="tower-layer egg"
              style={{ 
                left: `${layer.x}%`, 
                bottom: `${BASE_Y + (index * LAYER_HEIGHT)}px`,
                transform: `translate3d(-50%, 0, 0) rotate(${layer.wobbleOffset}deg)`
              }}
            />
          ))}
        </div>

        {/* Popups */}
        {popups.map(popup => (
          <motion.div
            key={popup.id}
            className="score-popup"
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -100, scale: 1.5 }}
            style={{ left: `${popup.x}%`, top: `40%` }}
          >
            {popup.text}
          </motion.div>
        ))}

        {/* Overlays */}
        <AnimatePresence>
          {countdown !== null && (
            <motion.div className="countdown-overlay" key={countdown}>
              <span className="countdown-number">{countdown === 0 ? 'GO!' : countdown}</span>
            </motion.div>
          )}

          {gameState === 'start' && (
            <motion.div className="start-overlay">
              <button 
                className="back-btn-start" 
                onClick={() => navigate('/games')}
              >
                <ArrowLeft size={24} />
              </button>
              <h1 className="game-title">Egg Tower</h1>
              <p className="game-description">Stack eggs with precision. Avoid the wobble!</p>
              
              <div className="energy-cost">
                <Coins size={16} className="icon" style={{ color: '#f0c929' }} />
                <span style={{ marginRight: '10px' }}>Fee: 1000 Coins</span>
                <Zap size={16} className="icon" />
                <span>500 Energy</span>
              </div>

              <button 
                className="start-btn" 
                onClick={(e) => { e.stopPropagation(); startGame(); }}
                disabled={loading}
              >
                {loading ? 'STARTING...' : 'START STACKING'}
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              className="game-over-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div 
                className="game-over-card glass-panel"
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: "spring", damping: 15 }}
              >
                <div className="game-over-header">
                  <div className="crown-icon">👑</div>
                  <h1 className="game-over-title">Tower Collapsed!</h1>
                </div>

                <div className="game-over-stats">
                  <div className="stat-row">
                    <div className="stat-card">
                      <span className="stat-label">FINAL SCORE</span>
                      <span className="stat-value">{score}</span>
                    </div>
                    <div className="stat-card">
                      <span className="stat-label">HEIGHT</span>
                      <span className="stat-value">{tower.length}</span>
                    </div>
                  </div>

                  <div className="reward-section-v2">
                    <div className="reward-content-v2">
                        <div className="reward-icon-container">
                          <Coins size={32} style={{ color: score >= 1000 ? '#f0c929' : '#ff4d4d' }} />
                        </div>
                        <div className="reward-details">
                            <div className="fee-breakdown">
                              <span className="fee-item">Fee: -1000</span>
                              <span className="fee-item">Earned: +{score}</span>
                            </div>
                            <div className="net-balance-container">
                              <span className="net-label">NET BALANCE</span>
                              <span className="net-amount" style={{ color: (isDoubled ? score * 2 : score) >= 1000 ? '#4ade80' : '#ff4d4d' }}>
                                {loading ? '...' : `${(isDoubled ? score * 2 : score) >= 1000 ? '+' : ''}${(isDoubled ? score * 2 : score) - 1000}`}
                              </span>
                            </div>
                        </div>
                    </div>
                  </div>

                  {!isDoubled && adsBlockId && score > 0 && (
                    <button 
                      className="double-reward-ad-btn glass-panel"
                      disabled={loading}
                      onClick={async (e) => {
                        e.stopPropagation();
                        setLoading(true);
                        const success = await showAd(adsBlockId, 'rewarded');
                        if (success) {
                          const rewardSuccess = await handleAdReward(score);
                          if (rewardSuccess) {
                            setIsDoubled(true);
                            hapticFeedback('success');
                          }
                        }
                        setLoading(false);
                      }}
                    >
                      <Zap size={18} fill="currentColor" />
                      Double My Coins (2X)
                    </button>
                  )}
                </div>

                <div className="game-over-actions">
                  <button className="restart-btn-v2" onClick={(e) => { e.stopPropagation(); handlePlayAgain(); }} disabled={loading}>
                    <Zap size={20} fill="currentColor" />
                    TRY AGAIN
                  </button>
                  <button className="hub-btn-v3" onClick={(e) => { e.stopPropagation(); handleBackToHub(); }} disabled={loading}>
                    BACK TO HUB
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
