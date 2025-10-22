// telegram.js
// Единая точка работы с Telegram WebApp SDK, тактильной отдачей и базовыми утилитами.

export const tg = window.Telegram?.WebApp || null;

// Инициализация Telegram WebApp + применение темы
(function initTG() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();

    const th = tg.themeParams || {};
    if (th.bg_color)   document.documentElement.style.setProperty('--tg-bg', th.bg_color);
    if (th.text_color) document.documentElement.style.setProperty('--tg-tx', th.text_color);
    if (th.hint_color) document.documentElement.style.setProperty('--tg-hint', th.hint_color);

    document.documentElement.classList.add('tg');
    tg.MainButton.hide();
  } catch (_) {}
})();

// Базовые хаптики
export function hapticOK()  { try { tg?.HapticFeedback?.notificationOccurred('success'); } catch {} }
export function hapticERR() { try { tg?.HapticFeedback?.notificationOccurred('error'); }   catch {} }
export function hapticTap() { try { tg?.HapticFeedback?.impactOccurred('light'); }         catch {} }

// «Умный» Tap: не срабатывает, если жест был прокруткой
export function hapticTapSmart() {
  try {
    if (window.__tsuShouldHaptic?.()) hapticTap();
  } catch {}
}

// Утилиты DOM/скролла
export function $(id) {
  return document.getElementById(id);
}
export function scrollTopSmooth() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
