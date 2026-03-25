import { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
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
            // event.detail contains the blockId
            await handleAdReward(taskAmount);
        };

        const node = taskRef.current;
        if (node) {
            node.addEventListener("reward", handleReward);
            // Check if the component is already upgraded/rendered
            setIsLoaded(true);
        }

        return () => {
            if (node) {
                node.removeEventListener("reward", handleReward);
            }
        };
    }, [handleAdReward, taskAmount]);

    return (
        <div className={`adsgram-task-wrapper ${isLoaded ? 'loaded' : 'loading'} ${className}`}>
            <adsgram-task
                data-block-id={blockId}
                data-debug={debug ? "true" : "false"}
                ref={taskRef}
                className="adsgram-task-element"
            >
                {/* Custom slots to match Earnegg design */}
                <div slot="reward" className="task-reward-slot">
                    <span className="coin-mini">💰</span>
                    <span>+{rewardText || taskAmount.toLocaleString()}</span>
                </div>
                
                <div slot="button" className="task-btn go-btn">
                    Go
                </div>
                
                <div slot="claim" className="task-btn claim-btn">
                    Claim
                </div>
                
                <div slot="done" className="task-done-status">
                    ✅ Done
                </div>
            </adsgram-task>
        </div>
    );
}
