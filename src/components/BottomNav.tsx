import { NavLink } from 'react-router-dom';
import { Pickaxe, CheckSquare, Users, Wallet, Rocket, Trophy } from 'lucide-react';
import './BottomNav.css';

const navItems = [
  { path: '/earn', icon: Pickaxe, label: 'Earn' },
  { path: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { path: '/boosts', icon: Rocket, label: 'Boosts' },
  { path: '/friends', icon: Users, label: 'Friends' },
  { path: '/leaderboard', icon: Trophy, label: 'Rank' },
  { path: '/wallet', icon: Wallet, label: 'Wallet' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav glass-panel">
      <div className="nav-items">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <div className="icon-container">
                <Icon size={24} strokeWidth={2.5} />
              </div>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
