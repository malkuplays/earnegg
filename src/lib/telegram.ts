import WebApp from '@twa-dev/sdk';

// Helper to reliably get the native Telegram WebApp object
const getNativeWebApp = () => {
  if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
    return (window as any).Telegram.WebApp;
  }
  return WebApp; // Fallback to sdk
};

export const getTelegramUser = () => {
  try {
    const app = getNativeWebApp();
    return app?.initDataUnsafe?.user || null;
  } catch (error) {
    return null;
  }
};

export const getTelegramStartParam = () => {
  try {
    const app = getNativeWebApp();
    return app?.initDataUnsafe?.start_param || null;
  } catch (error) {
    return null;
  }
};

export const hapticFeedback = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
  try {
    const app = getNativeWebApp();
    if (app?.HapticFeedback) {
      app.HapticFeedback.impactOccurred(style);
    }
  } catch (err) {
    // Ignored
  }
};
