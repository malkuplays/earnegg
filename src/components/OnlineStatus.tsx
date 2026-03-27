import React from 'react';
import { useApp } from '../context/AppContext';
import { Users } from 'lucide-react';
import './OnlineStatus.css';

const OnlineStatus: React.FC = () => {
  const { onlineCount } = useApp();

  return (
    <div className="online-status-container">
      <div className="online-indicator">
        <span className="dot"></span>
        <span className="pulse"></span>
      </div>
      <div className="online-info">
        <Users size={14} className="online-icon" />
        <span className="online-text">
          <span className="online-number">{onlineCount.toLocaleString()}</span> Online Now
        </span>
      </div>
    </div>
  );
};

export default OnlineStatus;
