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

export async function showRewardedAd(blockId: string): Promise<boolean> {
    if (!window.Adsgram) {
        console.error('AdsGram SDK not loaded');
        return false;
    }

    try {
        const AdController = window.Adsgram.init({ blockId });
        const result = await AdController.show();
        
        // done is true if user watch ad till the end, error is false
        return result.done && !result.error;
    } catch (error: any) {
        console.error('AdsGram Error:', error);
        return false;
    }
}
