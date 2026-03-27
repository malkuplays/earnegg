import './Tasks.css';
import { CheckCircle2, ChevronRight, Play } from 'lucide-react';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { showAd } from '../lib/adsgram';
import { hapticFeedback } from '../lib/telegram';
import AdsGramTask from '../components/AdsGramTask';

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
  const { user, taskBlockId, handleAdReward, taskAmount } = useApp();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loadingTask, setLoadingTask] = useState<number | null>(null);
  const [adLoading, setAdLoading] = useState(false);

  const [cooldowns, setCooldowns] = useState<Record<number, string>>({});
  const COOLDOWN_HOURS = 6;

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
      const interval = setInterval(updateTimers, 1000);
      return () => clearInterval(interval);
    }
  }, [user, tasks.length]); // Re-run when tasks are loaded to initiate timers

  const updateTimers = () => {
    const newCooldowns: Record<number, string> = {};
    let hasChanges = false;

    tasks.forEach(task => {
      if (task.last_completed_at) {
        const lastTime = new Date(task.last_completed_at).getTime();
        const now = new Date().getTime();
        const diff = now - lastTime;
        const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;

        if (diff < cooldownMs) {
          const remaining = cooldownMs - diff;
          const hours = Math.floor(remaining / (1000 * 60 * 60));
          const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
          newCooldowns[task.id] = `${hours}h ${minutes}m ${seconds}s`;
          hasChanges = true;
        }
      }
    });

    if (hasChanges || Object.keys(cooldowns).length > 0) {
      setCooldowns(newCooldowns);
    }
  };

  const fetchTasks = async () => {
    // Fetch all available tasks
    const { data: allTasks } = await supabase.from('tasks').select('*');
    
    // Fetch completed tasks for current user
    const { data: completed } = await supabase
      .from('player_tasks')
      .select('task_id, completed_at')
      .eq('player_id', user.id.toString());
      
    if (allTasks) {
      setTasks(allTasks.map(t => {
        // Find latest completion for this task
        const taskCompletions = completed?.filter((c: any) => c.task_id === t.id) || [];
        const latest = taskCompletions.length > 0 
          ? taskCompletions.reduce((prev: any, current: any) => 
              (new Date(current.completed_at) > new Date(prev.completed_at)) ? current : prev
            )
          : null;

        const lastTime = latest ? new Date(latest.completed_at).getTime() : 0;
        const now = new Date().getTime();
        const isOnCooldown = latest && (now - lastTime < COOLDOWN_HOURS * 60 * 60 * 1000);

        return {
          ...t,
          completed: isOnCooldown, // It's "done" only if it's currently on cooldown
          last_completed_at: latest?.completed_at
        };
      }));
    }
  };

  const completeTask = async (taskId: number, action_url?: string) => {
    if (cooldowns[taskId]) return; // Prevent click if on cooldown

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
        const rewarded = await handleAdReward(taskAmount);
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
        {/* AdsGram Task Ads (3 slots) */}
        {taskBlockId && [1, 2, 3].map((idx) => (
          taskBlockId.startsWith('task-') ? (
            <AdsGramTask 
              key={`ad-task-${idx}`}
              blockId={taskBlockId} 
              className="task-card glass-panel ad-task" 
            />
          ) : (
            <motion.div 
              key={`ad-video-${idx}`}
              variants={itemVariants}
              className="task-card glass-panel ad-task"
            >
              <div className="task-icon-wrapper">
                <Play className="text-accent" size={24} fill="currentColor" />
              </div>
              <div className="task-info">
                <h3 className="h3">Sponsored Video {idx}</h3>
                <div className="task-reward">
                  <span className="coin-mini">💰</span>
                  <span className="reward-amount">+{taskAmount.toLocaleString()}</span>
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
          )
        ))}

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
                <div className="cooldown-wrapper">
                  <span className="caption text-dim">Cooldown</span>
                  <span className="countdown-timer">{cooldowns[task.id] || 'Ready!'}</span>
                </div>
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
