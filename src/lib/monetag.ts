// Rewriting global service for Monetag
export interface MonetagRewardResult {
    success: boolean;
    reward_event_type?: string;
    estimated_price?: number;
}

/**
 * Global Monetag Service
 * Uses the global show_ZONE_ID function provided by the script tag in index.html
 */
export class MonetagService {
    private static getGlobalMethod(zoneId: string): any {
        return (window as any)[`show_${zoneId}`];
    }

    /**
     * Show Rewarded Interstitial
     */
    static async showRewarded(zoneId: string, userId?: string): Promise<MonetagRewardResult> {
        const method = this.getGlobalMethod(zoneId);
        if (!method) {
            console.error(`Monetag method show_${zoneId} not found`);
            return { success: false };
        }
        
        try {
            // Using the snippet format: show_ZONE_ID().then(...)
            // We pass ymid if present
            const result = await method({ ymid: userId });
            return { 
                success: true, 
                reward_event_type: result?.reward_event_type,
                estimated_price: result?.estimated_price
            };
        } catch (error) {
            console.error('Monetag Rewarded Error:', error);
            return { success: false };
        }
    }

    /**
     * Show Rewarded Popup (Direct Click to Offer)
     */
    static async showPopup(zoneId: string, userId?: string): Promise<boolean> {
        const method = this.getGlobalMethod(zoneId);
        if (!method) return false;
        
        try {
            // Using the snippet format: show_ZONE_ID('pop').then(...)
            await method({ type: 'pop', ymid: userId });
            return true;
        } catch (error) {
            console.error('Monetag Popup Error:', error);
            return false;
        }
    }

    /**
     * Initialize In-App Interstitials (Auto)
     */
    static initInApp(zoneId: string, options?: { frequency?: number; interval?: number; timeout?: number }) {
        const method = this.getGlobalMethod(zoneId);
        if (!method) return;
        
        try {
            // Using the snippet format for inApp
            method({
                type: 'inApp',
                inAppSettings: {
                    frequency: options?.frequency ?? 1,
                    capping: 0.1,
                    interval: options?.interval ?? 600,
                    timeout: options?.timeout ?? 60,
                    everyPage: false
                }
            });
        } catch (error) {
            console.error('Monetag In-App Error:', error);
        }
    }

    /**
     * Preload
     */
    static async preload(zoneId: string, userId?: string) {
        const method = this.getGlobalMethod(zoneId);
        if (!method) return;
        try {
            await method({ type: 'preload', ymid: userId });
        } catch (error) {
            // ignore
        }
    }
}
