import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import './Leaderboard.css';

interface PlayerRank {
  id: string;
  username: string;
  balance: number;
}

export default function Leaderboard() {
  const { user } = useApp();
  const [players, setPlayers] = useState<PlayerRank[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase.rpc('get_leaderboard');
      if (data && !error) {
        setPlayers(data);
      }
      setLoading(false);
    };
    fetchLeaderboard();
  }, []);

  const top3 = players.slice(0, 3);
  const theRest = players.slice(3);

  return (
    <div className="page-container leaderboard-page animate-fade-in">
      <div className="page-header center-header text-center">
        <Trophy size={48} className="text-warning mx-auto trophy-glow" />
        <h1 className="h1 gold-gradient-text mt-3">Top Miners</h1>
        <p className="body text-dim">The elite of Earnegg community.</p>
      </div>

      {!loading && top3.length > 0 && (
        <div className="podium-container">
          {/* Rank 2 */}
          {top3[1] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="podium-item rank-2"
            >
              <div className="podium-avatar-wrap">
                <Medal size={32} color="#C0C0C0" />
                <div className="podium-badge">2</div>
              </div>
              <span className="podium-name">{top3[1].username || 'Anonymous'}</span>
              <span className="podium-balance">
                <span className="coin-mini">💰</span> {top3[1].balance.toLocaleString()}
              </span>
              <span className="podium-inr">₹{(top3[1].balance / 1000).toFixed(2)}</span>
            </motion.div>
          )}

          {/* Rank 1 */}
          {top3[0] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="podium-item rank-1"
            >
              <div className="podium-avatar-wrap">
                <Trophy size={40} color="#f0c929" />
                <div className="podium-badge">1</div>
              </div>
              <span className="podium-name">{top3[0].username || 'Anonymous'}</span>
              <span className="podium-balance">
                <span className="coin-mini">💰</span> {top3[0].balance.toLocaleString()}
              </span>
              <span className="podium-inr">₹{(top3[0].balance / 1000).toFixed(2)}</span>
            </motion.div>
          )}

          {/* Rank 3 */}
          {top3[2] && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="podium-item rank-3"
            >
              <div className="podium-avatar-wrap">
                <Award size={32} color="#CD7F32" />
                <div className="podium-badge">3</div>
              </div>
              <span className="podium-name">{top3[2].username || 'Anonymous'}</span>
              <span className="podium-balance">
                <span className="coin-mini">💰</span> {top3[2].balance.toLocaleString()}
              </span>
              <span className="podium-inr">₹{(top3[2].balance / 1000).toFixed(2)}</span>
            </motion.div>
          )}
        </div>
      )}

      <div className="leaderboard-list">
        {loading ? (
          <div className="text-center py-10">
            <div className="loading-spinner"></div>
            <p className="text-dim mt-4">Calculatings rankings...</p>
          </div>
        ) : (
          theRest.map((player, index) => {
            const actualRank = index + 4;
            const isMe = user?.id?.toString() === player.id;
            return (
              <motion.div 
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`leaderboard-card glass-panel ${isMe ? 'is-me' : ''}`}
              >
                <div className="rank-wrap">
                  #{actualRank}
                </div>
                <div className="player-avatar">
                  {(player.username || 'A').charAt(0).toUpperCase()}
                </div>
                <div className="player-info">
                  <span className="player-name">
                    {player.username || 'Anonymous'} {isMe && '(You)'}
                  </span>
                  <div className="player-balance-row">
                    <div className="player-balance">
                      <span className="coin-mini">💰</span>
                      {player.balance.toLocaleString()}
                    </div>
                    <div className="player-inr">
                      ₹{(player.balance / 1000).toFixed(2)}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-dim opacity-30" />
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
