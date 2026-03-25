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

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' | 'success' | 'warning' | 'error' = 'light') => {
  try {
    const app = getNativeWebApp();
    if (!app?.HapticFeedback) return;

    if (['success', 'warning', 'error'].includes(type)) {
      app.HapticFeedback.notificationOccurred(type as 'success' | 'warning' | 'error');
    } else {
      app.HapticFeedback.impactOccurred(type as 'light' | 'medium' | 'heavy' | 'rigid' | 'soft');
    }
  } catch (err) {
    // Ignored
  }
};
