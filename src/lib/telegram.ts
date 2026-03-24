import WebApp from '@twa-dev/sdk';

export const getTelegramUser = () => {
  try {
    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
      return WebApp.initDataUnsafe.user;
    }
  } catch (error) {
    console.warn("Not running inside Telegram WebApp");
  }
  
  // Mock user for local development
  return null;
};

export const hapticFeedback = (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
  try {
    if (WebApp.HapticFeedback) {
      WebApp.HapticFeedback.impactOccurred(style);
    }
  } catch (err) {
    // Ignored
  }
};
