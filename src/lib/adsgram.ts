import type { AdController, ShowPromiseResult } from '../types/adsgram';

export type AdType = 'rewarded' | 'interstitial';

export async function showAd(blockId: string, type: AdType = 'rewarded'): Promise<boolean> {
    if (!window || !window.Adsgram) {
        console.error('AdsGram SDK not loaded');
        return false;
    }

    try {
        const controller: AdController = (window as any).Adsgram.init({ blockId });
        const result: ShowPromiseResult = await controller.show();
        
        if (type === 'rewarded') {
            // Rewarded must be completed
            return result.done && !result.error;
        } else {
            // Interstitial can be skipped but should not have error
            return !result.error;
        }
    } catch (error: any) {
        console.error('AdsGram Error:', error);
        return false;
    }
}

// Keeping the old one for compatibility while I migate
export const showRewardedAd = (blockId: string) => showAd(blockId, 'rewarded');
