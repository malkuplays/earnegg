import './Tasks.css';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';

const DUMMY_TASKS = [
  { id: 1, title: 'Join Official Channel', reward: 5000, type: 'telegram', completed: false },
  { id: 2, title: 'Follow us on X (Twitter)', reward: 2000, type: 'social', completed: false },
  { id: 3, title: 'Connect Wallet', reward: 10000, type: 'action', completed: true },
  { id: 4, title: 'Invite 3 Friends', reward: 15000, type: 'invite', completed: false },
];

export default function Tasks() {
  return (
    <div className="page-container tasks-page animate-fade-in">
      <div className="page-header">
        <h1 className="h1">Earn More</h1>
        <p className="body text-dim">Complete simple tasks to earn massive coin rewards.</p>
      </div>

      <div className="tasks-list">
        {DUMMY_TASKS.map(task => (
          <div key={task.id} className={`task-card glass-panel ${task.completed ? 'completed' : ''}`}>
            
            <div className="task-icon-wrapper">
              {task.completed ? (
                <CheckCircle2 className="text-success" size={28} />
              ) : (
                <Play className="text-accent" size={24} fill="currentColor" />
              )}
            </div>

            <div className="task-info">
              <h3 className="h3">{task.title}</h3>
              <div className="task-reward">
                <span className="coin-mini">💰</span>
                <span className="reward-amount">+{task.reward.toLocaleString()}</span>
              </div>
            </div>

            <div className="task-action">
              {task.completed ? (
                <span className="caption text-success">Done</span>
              ) : (
                <button className="go-btn"><ChevronRight size={20} /></button>
              )}
            </div>
            
          </div>
        ))}
      </div>
    </div>
  );
}
