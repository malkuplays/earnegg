import { Gift, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import './Friends.css';

export default function Friends() {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  // Real invite link leveraging Telegram start param
  const inviteLink = user?.id 
    ? `https://t.me/earnegg_bot?start=ref_${user.id}`
    : "https://t.me/earnegg_bot";

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
        
        <div className="friends-list">
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.id} className="friend-card glass-panel">
                <div className="friend-avatar">
                  {friend.name.charAt(0).toUpperCase()}
                </div>
                <div className="friend-info">
                  <span className="friend-name">{friend.name}</span>
                  <span className="friend-reward">+{friend.reward.toLocaleString()} coins</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <span className="text-dim">You haven't invited anyone yet.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
