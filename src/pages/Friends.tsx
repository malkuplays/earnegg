import { Gift, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './Friends.css';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Friends() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  // Real invite link leveraging Telegram start param
  const inviteLink = user?.id 
    ? `https://t.me/earneggbot/earneager?startapp=ref_${user.id}`
    : "https://t.me/earneggbot/earneager";

  useEffect(() => {
    if (user?.id) fetchReferrals();
  }, [user]);

  const fetchReferrals = async () => {
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', user.id.toString());
      
    if (refs && refs.length > 0) {
      const friendIds = refs.map((r: any) => r.referred_id);
      const { data: players } = await supabase
        .from('players')
        .select('id, username')
        .in('id', friendIds);
        
      const merged = refs.map((r: any) => {
        const p = players?.find((pl: any) => pl.id === r.referred_id);
        return {
          id: r.referred_id,
          name: p?.username || 'Unknown Friend',
          reward: r.reward
        };
      });
      setFriends(merged);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container friends-page animate-fade-in">
      <div className="invite-hero glass-panel">
        <Gift size={48} className="text-accent gift-icon" />
        <h2 className="h2">Invite Friends</h2>
        <p className="body text-dim text-center">
          Earn <span className="text-accent text-bold">5,000 coins</span> for you and your friend.
        </p>
        
        <div className="invite-link-box">
          <span className="link-text">{inviteLink}</span>
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? <Check size={20} className="text-success" /> : <Copy size={20} />}
          </button>
        </div>
        
        <button className="share-btn interactive-btn">Share Invite Link</button>
      </div>

      <div className="friends-list-container">
        <h3 className="h3 section-title">Your Friends ({friends.length})</h3>
        
        <motion.div 
          className="friends-list"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {friends.length > 0 ? (
            friends.map(friend => (
              <motion.div variants={itemVariants} key={friend.id} className="friend-card glass-panel">
                <div className="friend-avatar">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-reward">+{friend.reward.toLocaleString()} coins</span>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div variants={itemVariants} className="empty-state">
              <span className="text-dim">You haven't invited anyone yet.</span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
