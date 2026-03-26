import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { ChevronRight, Play } from 'lucide-react';
import './AdsGramTask.css';

interface AdsGramTaskProps {
    blockId: string;
    debug?: boolean;
    rewardText?: string;
    className?: string;
}

export default function AdsGramTask({ blockId, debug = false, rewardText, className = "" }: AdsGramTaskProps) {
    const taskRef = useRef<any>(null);
    const { handleAdReward, taskAmount } = useApp();
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const handleReward = async (event: any) => {
            console.log("AdsGram Task Reward Event:", event.detail);
            await handleAdReward(taskAmount);
        };

        const node = taskRef.current;
        if (node) {
            node.addEventListener("reward", handleReward);
            
            // Wait for the component to actually render its content
            // We'll check if it has internal elements or a shadow root with content
            const checkLoading = setInterval(() => {
                // Some AdsGram components might have a 'state' or just shadow content
                if (node.shadowRoot && node.shadowRoot.childElementCount > 0) {
                    setIsLoaded(true);
                    clearInterval(checkLoading);
                }
            }, 500);

            // Timeout after 5 seconds to stop polling if never loads
            const timeout = setTimeout(() => {
                clearInterval(checkLoading);
            }, 5000);

            return () => {
                node.removeEventListener("reward", handleReward);
                clearInterval(checkLoading);
                clearTimeout(timeout);
            };
        }
    }, [handleAdReward, taskAmount]);

    return (
        <div className={`adsgram-task-wrapper ${isLoaded ? 'loaded' : 'loading'} ${className}`}>
            <adsgram-task
                data-block-id={blockId}
                data-debug={debug ? "true" : "false"}
                ref={taskRef}
                className="adsgram-task-element"
            >
                {/* Custom slots to match Earnegg design and hide skeletons */}
                <div slot="icon" className="task-icon-wrapper sponsored-icon">
                    <Play className="text-accent" size={24} fill="currentColor" />
                </div>

                <div slot="title" className="sponsored-title">
                    Sponsored Task
                </div>

                <div slot="description" style={{ display: 'none' }}></div>
                
                <div slot="reward" className="task-reward-slot">
                    <span className="coin-mini">💰</span>
                    <span>+{rewardText || taskAmount.toLocaleString()}</span>
                </div>
                
                <div slot="button" className="task-btn go-btn">
                    <ChevronRight size={28} />
                </div>
                
                <div slot="claim" className="task-btn claim-btn">
                    <Play size={20} fill="currentColor" />
                </div>
                
                <div slot="done" className="task-done-status">
                    ✅ Done
                </div>
            </adsgram-task>
        </div>
    );
}
