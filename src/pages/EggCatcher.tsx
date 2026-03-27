import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Zap, Heart, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { hapticFeedback } from '../lib/telegram';
import { showAd } from '../lib/adsgram';
import FloatingAssets from '../components/FloatingAssets';
import './EggCatcher.css';

interface GameObject {
  id: number;
  x: number;
  y: number;
  type: 'egg' | 'gold' | 'bomb';
  speed: number;
}

export default function EggCatcher() {
  const { energy, completeEggCatcher, interstitialBlockId } = useApp();
  const navigate = useNavigate();
  
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
  const [countdown, setCountdown] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [basketX, setBasketX] = useState(50); // percentage
  const [objects, setObjects] = useState<GameObject[]>([]);
  const [popups, setPopups] = useState<{id: number, x: number, y: number, text: string}[]>([]);
  const [isShaking, setIsShaking] = useState(false);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [loading, setLoading] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const gameStateRef = useRef<'start' | 'playing' | 'gameover'>('start');
  const lastSpawnRef = useRef<number>(0);
  const objectsRef = useRef<GameObject[]>([]);
  const basketXRef = useRef<number>(50);
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(3);
  const containerRef = useRef<HTMLDivElement>(null);

  const spawnObject = useCallback(() => {
    const types: ('egg' | 'gold' | 'bomb')[] = ['egg', 'egg', 'egg', 'gold', 'gold', 'bomb', 'bomb'];
    const type = types[Math.floor(Math.random() * types.length)];
    const newObj: GameObject = {
      id: Date.now() + Math.random(),
      x: Math.random() * 80 + 10, // 10% to 90%
      y: -10,
      type,
      speed: 1.2 + (scoreRef.current / 1500) // Slightly slower start, scales better
    };
    objectsRef.current = [...objectsRef.current, newObj];
    setObjects([...objectsRef.current]);
  }, []);

  const addPopup = (x: number, y: number, text: string) => {
    const id = Date.now() + Math.random();
    setPopups(prev => [...prev, { id, x, y, text }]);
    setTimeout(() => {
      setPopups(prev => prev.filter(p => p.id !== id));
    }, 800);
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  };

  const updateGame = useCallback((time: number) => {
    if (gameStateRef.current !== 'playing') return;

    // Respawn logic
    if (time - lastSpawnRef.current > 1100 - Math.min(scoreRef.current / 3, 500)) {
      spawnObject();
      lastSpawnRef.current = time;
    }

    const nextObjects: GameObject[] = [];
    const basketWidth = 25; 
    const basketYTrigger = 75; // Matches new basket position

    objectsRef.current.forEach(obj => {
      const nextY = obj.y + obj.speed;

      // Collision detection with new basket position
      if (nextY >= basketYTrigger && nextY <= basketYTrigger + 5) {
        const dist = Math.abs(obj.x - basketXRef.current);
        if (dist < basketWidth / 2) {
          // Caught!
          if (obj.type === 'egg') {
            scoreRef.current += 10;
            addPopup(obj.x, obj.y, '+10');
            hapticFeedback('light');
          } else if (obj.type === 'gold') {
            scoreRef.current += 50;
            addPopup(obj.x, obj.y, '+50');
            hapticFeedback('medium');
          } else if (obj.type === 'bomb') {
            livesRef.current -= 1;
            triggerShake();
            hapticFeedback('error');
            if (livesRef.current <= 0) {
              // endGame will be called at the end of loop for safety
            }
          }
          return; 
        }
      }

      if (nextY > 100) {
        // Missed - could add penalty here if desired
      } else {
        nextObjects.push({ ...obj, y: nextY });
      }
    });

    objectsRef.current = nextObjects;
    setObjects(nextObjects);
    setScore(scoreRef.current);
    setLives(livesRef.current);
    
    if (livesRef.current <= 0) {
      endGame();
      return;
    }

    gameLoopRef.current = requestAnimationFrame(updateGame);
  }, [spawnObject]);

  const startGame = () => {
    if (energy < 500) {
      alert('Not enough energy! You need at least 500 energy to play.');
      return;
    }
    
    // Reset stats
    setScore(0);
    setLives(3);
    setObjects([]);
    setPopups([]);
    scoreRef.current = 0;
    livesRef.current = 3;
    objectsRef.current = [];
    
    // Start countdown
    setGameState('playing');
    gameStateRef.current = 'start'; // Keep internal state 'start' until countdown finishes
    setCountdown(3);
    hapticFeedback('medium');
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
      // Countdown finished
      const timer = setTimeout(() => {
        setCountdown(null);
        gameStateRef.current = 'playing';
        lastSpawnRef.current = performance.now();
        gameLoopRef.current = requestAnimationFrame(updateGame);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [countdown, updateGame]);

  const endGame = async () => {
    if (gameStateRef.current === 'gameover') return;
    gameStateRef.current = 'gameover';
    setGameState('gameover');
    setScore(scoreRef.current); // Ensure final score is set
    
    if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    
    setLoading(true);
    try {
      const result = await completeEggCatcher(scoreRef.current);
      if (result && result.success) {
        setCoinsEarned(result.coins_earned);
      } else {
        // Fallback to score if RPC fails or is slow
        setCoinsEarned(scoreRef.current);
      }
    } catch (err) {
      console.error("Failed to complete game:", err);
      setCoinsEarned(scoreRef.current);
    }
    setLoading(false);
  };

  const handlePlayAgain = async () => {
    // Show Ad if block ID is available
    if (interstitialBlockId) {
      setLoading(true);
      await showAd(interstitialBlockId, 'interstitial');
      setLoading(false);
    }
    startGame();
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameStateRef.current !== 'playing' || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let clientX;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const boundedX = Math.max(12, Math.min(88, x));
    setBasketX(boundedX);
    basketXRef.current = boundedX;
  };

  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []);

  return (
    <div className="page-container egg-catcher-page animate-fade-in">
      <FloatingAssets />
      
      <div 
        ref={containerRef}
        className={`game-canvas-container ${isShaking ? 'shake' : ''}`}
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        <div className="game-bg-elements" />
        
        <div className="game-header">
          <button className="back-btn" onClick={() => navigate('/games')}>
            <ArrowLeft size={24} />
          </button>
          
          <div className="game-stats-top">
            <div className="game-stat-item">
              <span className="game-stat-label">Score</span>
              <span className="game-stat-value score">{score}</span>
            </div>
            <div className="game-stat-item">
              <span className="game-stat-label">Lives</span>
              <div className="game-lives">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    size={16} 
                    className={`heart-icon ${i >= lives ? 'lost' : ''}`}
                    fill={i < lives ? "#ff4d4d" : "transparent"}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {objects.map(obj => (
          <div 
            key={obj.id}
            className={`game-object ${obj.type}`}
            style={{ left: `${obj.x}%`, top: `${obj.y}%` }}
          >
            {obj.type === 'bomb' && <div className="bomb-fuse" />}
          </div>
        ))}

        {popups.map(popup => (
          <motion.div
            key={popup.id}
            className="score-popup"
            initial={{ opacity: 1, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, y: -100, scale: 1.5 }}
            style={{ left: `${popup.x}%`, top: `${popup.y}%` }}
          >
            {popup.text}
          </motion.div>
        ))}

        <div 
          className="game-basket"
          style={{ left: `${basketX}%` }}
        />

        <AnimatePresence>
          {countdown !== null && (
            <motion.div 
              className="countdown-overlay"
              initial={{ opacity: 0, scale: 2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              key={countdown}
            >
              <span className="countdown-number">{countdown === 0 ? 'GO!' : countdown}</span>
            </motion.div>
          )}

          {gameState === 'start' && (
            <motion.div 
              className="start-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h1 className="game-title">Egg Catcher</h1>
              <p className="game-description">Catch the eggs, avoid the bombs!</p>
              
              <div className="energy-cost">
                <Zap size={16} className="icon" />
                <span>Cost: 500 Energy</span>
              </div>

              <div className="game-legend">
                <div className="legend-item">
                    <div className="legend-icon">
                      <div className="game-object egg" />
                    </div>
                    <span className="legend-text">Normal: +10</span>
                </div>
                <div className="legend-item">
                    <div className="legend-icon">
                      <div className="game-object egg gold" />
                    </div>
                    <span className="legend-text">Gold: +50</span>
                </div>
                <div className="legend-item full-width">
                    <div className="legend-icon">
                      <div className="game-object bomb">
                        <div className="bomb-fuse" />
                      </div>
                    </div>
                    <span className="legend-text">Bomb: -1 Life</span>
                </div>
              </div>

              <button className="start-btn" onClick={startGame}>
                START GAME
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
                <h1 className="game-over-title">Game Over</h1>
                
                <div className="game-over-stats">
                  <div className="stat-group">
                    <span className="stat-label">FINAL SCORE</span>
                    <motion.span 
                      className="stat-value"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      {score}
                    </motion.span>
                  </div>

                  <div className="reward-section">
                    <div className="reward-glow" />
                    <div className="reward-content">
                      <div className="reward-icon-wrapper">
                        <Coins size={32} className="reward-coin-icon" />
                      </div>
                      <div className="reward-info">
                        <span className="reward-label">COINS EARNED</span>
                        <span className="reward-amount">
                          {loading ? '...' : `+${coinsEarned || score}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="game-over-actions">
                  <button className="restart-btn-v2" onClick={handlePlayAgain} disabled={loading}>
                    < Zap size={20} fill="currentColor" />
                    PLAY AGAIN
                  </button>
                  <button 
                    className="hub-btn-v2" 
                    onClick={() => navigate('/games')}
                  >
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
