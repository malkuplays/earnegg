import './Tasks.css';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { showAd } from '../lib/adsgram';
import { hapticFeedback } from '../lib/telegram';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function Tasks() {
  const { user, taskBlockId, handleAdReward } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTask, setLoadingTask] = useState<number | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    // Fetch all available tasks
    const { data: allTasks } = await supabase.from('tasks').select('*');
    
    // Fetch completed tasks for current user
    const { data: completed } = await supabase
      .from('player_tasks')
      .select('task_id')
      .eq('player_id', user.id.toString());
      
    const completedIds = completed?.map((c: any) => c.task_id) || [];
    
    if (allTasks) {
      setTasks(allTasks.map(t => ({
        ...t,
        completed: completedIds.includes(t.id)
      })));
    }
  };

  const completeTask = async (taskId: number, action_url?: string) => {
    if (action_url) {
      // Use Telegram's native method to open links externally or in-app browser
      const tgApp = (window as any).Telegram?.WebApp;
      try {
        if (action_url.includes('t.me') && tgApp?.openTelegramLink) {
          tgApp.openTelegramLink(action_url);
        } else if (tgApp?.openLink) {
          tgApp.openLink(action_url);
        } else {
          window.open(action_url, '_blank');
        }
      } catch (e) {
        window.open(action_url, '_blank');
      }
    }
    
    if (!user?.id) return;
    setLoadingTask(taskId);
    
    const { data, error } = await supabase.rpc('complete_task', {
      p_player_id: user.id.toString(),
      p_task_id: taskId
    });
    
    if (data && !error) {
      // Refresh local tasks visually
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      hapticFeedback('success');
    }
    setLoadingTask(null);
  };

  const onWatchTaskAd = async () => {
    if (!taskBlockId) return;
    setAdLoading(true);
    try {
      // For Task format ads, AdsGram documentation implies they are often standard links 
      // or specific showAd calls. If it's the "Task" format, usually it's a specific blockId.
      const success = await showAd(taskBlockId, 'rewarded');
      if (success) {
        const rewarded = await handleAdReward(2500);
        if (rewarded) {
          hapticFeedback('success');
        }
      }
    } catch (e) {
      console.error(e);
      hapticFeedback('error');
    }
    setAdLoading(false);
  };
  return (
    <div className="page-container tasks-page animate-fade-in">
      <div className="page-header">
        <h1 className="h1">Earn More</h1>
        <p className="body text-dim">Complete simple tasks to earn massive coin rewards.</p>
      </div>

      <motion.div 
        className="tasks-list"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {/* AdsGram Task Ad */}
        {taskBlockId && (
          <motion.div 
            variants={itemVariants}
            className="task-card glass-panel ad-task"
          >
            <div className="task-icon-wrapper">
              <Play className="text-accent" size={24} fill="currentColor" />
            </div>
            <div className="task-info">
              <h3 className="h3">Sponsored Video</h3>
              <div className="task-reward">
                <span className="coin-mini">💰</span>
                <span className="reward-amount">+2,500</span>
              </div>
            </div>
            <div className="task-action">
              <button 
                className="go-btn" 
                onClick={onWatchTaskAd}
                disabled={adLoading}
              >
                {adLoading ? '...' : <ChevronRight size={20} />}
              </button>
            </div>
          </motion.div>
        )}

        {tasks.map(task => (
          <motion.div 
            variants={itemVariants}
            key={task.id} 
            className={`task-card glass-panel ${task.completed ? 'completed' : ''}`}
          >
            
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
                <button 
                  className="go-btn" 
                  onClick={() => completeTask(task.id, task.action_url || task.url)}
                  disabled={loadingTask === task.id}
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </div>
            
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
