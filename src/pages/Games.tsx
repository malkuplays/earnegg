import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Disc, ChevronRight } from 'lucide-react';
import FloatingAssets from '../components/FloatingAssets';
import './Games.css';

export default function Games() {
  const navigate = useNavigate();

  const gameCards = [
    {
      id: 'wheel',
      title: 'Wheel of Fortune',
      description: 'Spin daily to win coins, energy, and more!',
      icon: Disc,
      color: '#f0c929',
      path: '/wheel'
    },
    {
      id: 'leaderboard',
      title: 'Leaderboard',
      description: 'See the top players and your current rank.',
      icon: Trophy,
      color: '#4facfe',
      path: '/leaderboard'
    }
  ];

  return (
    <div className="page-container games-page animate-fade-in">
      <FloatingAssets />
      
      <div className="header-section">
        <h1 className="page-title">Game Hub</h1>
        <p className="page-subtitle">Play games, climb the ranks, and earn rewards!</p>
      </div>

      <div className="games-grid">
        {gameCards.map((game, index) => {
          const Icon = game.icon;
          return (
            <motion.div
              key={game.id}
              className="game-card glass-panel"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => navigate(game.path)}
              whileTap={{ scale: 0.98 }}
            >
              <div className="game-card-icon" style={{ backgroundColor: `${game.color}20`, color: game.color }}>
                <Icon size={32} />
              </div>
              <div className="game-card-content">
                <h3 className="game-card-title">{game.title}</h3>
                <p className="game-card-description">{game.description}</p>
              </div>
              <ChevronRight className="game-card-arrow" size={20} />
            </motion.div>
          );
        })}
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
