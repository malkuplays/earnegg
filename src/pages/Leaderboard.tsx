import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award } from 'lucide-react';
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

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy size={24} className="text-warning" />;
    if (index === 1) return <Medal size={24} className="text-secondary" style={{ color: '#C0C0C0' }} />;
    if (index === 2) return <Award size={24} className="text-secondary" style={{ color: '#cd7f32' }} />;
    return <span className="rank-number">#{index + 1}</span>;
  };

  return (
    <div className="page-container leaderboard-page animate-fade-in">
      <div className="page-header center-header text-center">
        <Trophy size={48} className="text-warning mx-auto" style={{ margin: '0 auto 16px' }} />
        <h1 className="h1">Top Miners</h1>
        <p className="body text-dim">The richest players in Earnegg.</p>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <p className="text-center text-dim mt-4">Loading top players...</p>
        ) : (
          players.map((player, index) => {
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
                  {getRankIcon(index)}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.username || 'Anonymous'} {isMe && '(You)'}</span>
                </div>
                <div className="player-balance font-bold">
                  {player.balance.toLocaleString()} <span className="coin-mini">💰</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
