import React, { useEffect, useState } from 'react';
import { MonetagService } from '../lib/monetag';
import './MonetagAds.css';

interface NativeBannerProps {
    zoneId: string;
    userId: string;
    onReward: () => void;
}

export const MonetagNativeBanner: React.FC<NativeBannerProps> = ({ zoneId, userId, onReward }) => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (zoneId) {
            MonetagService.preload(zoneId, userId).then(() => setIsLoaded(true));
        }
    }, [zoneId, userId]);

    const handleClick = async () => {
        const result = await MonetagService.showRewarded(zoneId, userId);
        if (result.success) {
            onReward();
        }
    };

    if (!isLoaded || !zoneId) return null;

    return (
        <div className="monetag-native-container" onClick={handleClick}>
            <div className="monetag-native-badge">AD</div>
            <div className="monetag-native-content">
                <h4>Special Bonus Reward</h4>
                <p>Click here to visit our partner and claim extra coins!</p>
            </div>
            <div className="monetag-native-reward">
                <span>+500</span>
                <img src="/coin.png" alt="coin" />
            </div>
        </div>
    );
};

interface RewardedPopupButtonProps {
    zoneId: string;
    userId: string;
    label: string;
    className?: string;
    onStarted: () => void;
}

export const MonetagRewardedButton: React.FC<RewardedPopupButtonProps> = ({ 
    zoneId, 
    userId, 
    label, 
    className,
    onStarted 
}) => {
    const handleClick = async () => {
        const success = await MonetagService.showPopup(zoneId, userId);
        if (success) {
            onStarted();
        }
    };

    if (!zoneId) return null;

    return (
        <button className={className} onClick={handleClick}>
            {label}
        </button>
    );
};
