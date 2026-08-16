const tg = typeof window !== 'undefined' ? window.Telegram?.WebApp : undefined;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
}

export function getInitData() {
  return tg?.initData || '';
}

export function getTelegramUser() {
  return tg?.initDataUnsafe?.user || null;
}

export function hapticSelection() {
  tg?.HapticFeedback?.selectionChanged();
}

export function hapticNotification(type = 'success') {
  tg?.HapticFeedback?.notificationOccurred(type);
}

export function setBackButton(onClick) {
  if (!tg) return () => {};
  tg.BackButton.show();
  tg.BackButton.onClick(onClick);
  return () => {
    tg.BackButton.offClick(onClick);
    tg.BackButton.hide();
  };
}

export function hideBackButton() {
  tg?.BackButton?.hide();
}

export default tg;
