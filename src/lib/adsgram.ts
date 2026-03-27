import type { AdController, ShowPromiseResult } from '../types/adsgram';

export type AdType = 'rewarded' | 'interstitial';

const controllers: Record<string, AdController> = {};

export async function showAd(blockId: string, type: AdType = 'rewarded'): Promise<boolean> {
    if (!window || !window.Adsgram) {
        console.error('AdsGram SDK not loaded');
        return false;
    }

    try {
        // Reuse or initialize controller
        if (!controllers[blockId]) {
            controllers[blockId] = (window as any).Adsgram.init({ blockId });
        }
        
        const result: ShowPromiseResult = await controllers[blockId].show();
        
        if (type === 'rewarded') {
            return result.done && !result.error;
        } else {
            return !result.error;
        }
    } catch (error: any) {
        console.error('AdsGram Error:', error);
        return false;
    }
}

// Keeping the old one for compatibility while I migate
export const showRewardedAd = (blockId: string) => showAd(blockId, 'rewarded');
