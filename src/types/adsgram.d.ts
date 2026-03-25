import { DOMAttributes } from "react";

export interface ShowPromiseResult { 
    done: boolean; 
    description: string; 
    state: 'load' | 'render' | 'playing' | 'destroy'; 
    error: boolean; 
} 

export type BannerType = 'RewardedVideo' | 'FullscreenMedia'; 

export interface AdsgramInitParams { 
    blockId: string; 
    debug?: boolean; 
    debugBannerType?: BannerType; 
    debugConsole?: boolean;
} 

export type EventType = 
    | 'onReward' 
    | 'onComplete' 
    | 'onStart' 
    | 'onSkip' 
    | 'onBannerNotFound' 
    | 'onNonStopShow' 
    | 'onTooLongSession' 
    | 'onError'; 

export type HandlerType = () => void; 

export interface AdController { 
    show(): Promise<ShowPromiseResult>; 
    addEventListener(event: EventType, handler: HandlerType): void; 
    removeEventListener(event: EventType, handler: HandlerType): void; 
    destroy(): void; 
} 

declare global { 
    interface Window { 
        Adsgram?: { 
            init(params: AdsgramInitParams): AdController; 
        }; 
    } 
}

// React JSX Support for <adsgram-task>
type CustomElement<T> = Partial<T & DOMAttributes<T> & { children: any; className?: string; ref?: any }>;

declare module "react/jsx-runtime" {
    namespace JSX {
        interface IntrinsicElements {
            "adsgram-task": CustomElement<HTMLDivElement> & {
                "data-block-id": string;
                "data-debug"?: string | boolean;
                "data-debug-console"?: string | boolean;
            };
        }
    }
}

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "adsgram-task": CustomElement<HTMLDivElement> & {
                "data-block-id": string;
                "data-debug"?: string | boolean;
                "data-debug-console"?: string | boolean;
            };
        }
    }
}
