import { Gift, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import './Friends.css';

const DUMMY_FRIENDS = [
  { id: 1, name: 'Alex Johnson', reward: 5000 },
  { id: 2, name: 'Maria Silva', reward: 5000 },
];

export default function Friends() {
  const [copied, setCopied] = useState(false);
  const inviteLink = "https://t.me/earnegg_bot?start=ref123";

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
        <h3 className="h3 section-title">Your Friends ({DUMMY_FRIENDS.length})</h3>
        
        <div className="friends-list">
          {DUMMY_FRIENDS.length > 0 ? (
            DUMMY_FRIENDS.map(friend => (
              <div key={friend.id} className="friend-card glass-panel">
                <div className="friend-avatar">
                  {friend.name.charAt(0)}
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
