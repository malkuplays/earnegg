export interface ShowPromiseResult {
    done: boolean;
    description: string;
    state: 'load' | 'render' | 'playing' | 'destroy';
    error: boolean;
}

export interface AdController {
    show: () => Promise<ShowPromiseResult>;
}

declare global {
    interface Window {
        Adsgram?: {
            init: (params: { blockId: string }) => AdController;
        };
    }
}

export type AdType = 'rewarded' | 'interstitial';

export async function showAd(blockId: string, type: AdType = 'rewarded'): Promise<boolean> {
    if (!window || !window.Adsgram) {
        console.error('AdsGram SDK not loaded');
        return false;
    }

    try {
        const controller = window.Adsgram.init({ blockId });
        const result = await controller.show();
        
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
