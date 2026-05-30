export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'selection' = 'light') => {
  if (
    typeof window !== 'undefined' &&
    window.Telegram &&
    window.Telegram.WebApp &&
    window.Telegram.WebApp.HapticFeedback
  ) {
    try {
      if (type === 'selection') {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
      } else {
        window.Telegram.WebApp.HapticFeedback.impactOccurred(type);
      }
    } catch(e) {}
  }
};

export const triggerNotification = (type: 'error' | 'success' | 'warning' = 'success') => {
  if (
    typeof window !== 'undefined' &&
    window.Telegram &&
    window.Telegram.WebApp &&
    window.Telegram.WebApp.HapticFeedback
  ) {
    try {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred(type);
    } catch(e) {}
  }
};
