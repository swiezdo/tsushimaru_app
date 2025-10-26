// telegram.js
// Единая точка работы с Telegram WebApp SDK, тактильной отдачей и базовыми утилитами.

export const tg = window.Telegram?.WebApp || null;

// Определение платформы (вынесено в отдельную функцию для переиспользования)
function detectPlatform() {
  if (!tg) return { isMobile: false, isDesktop: false };
  
  const platform = tg.platform || 'unknown';
  const userAgent = navigator.userAgent.toLowerCase();
  
  const isMobileByPlatform = platform === 'ios' || platform === 'android';
  const isMobileByUserAgent = userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad');
  const isDesktopByPlatform = platform === 'desktop' || platform === 'macos' || platform === 'linux' || platform === 'windows';
  const isDesktopByUserAgent = userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux') || userAgent.includes('x11');
  
  const isMobile = isMobileByPlatform || isMobileByUserAgent;
  const isDesktop = isDesktopByPlatform || (isDesktopByUserAgent && !isMobile);
  
  return { isMobile, isDesktop };
}

// Инициализация Telegram WebApp + применение темы
(function initTG() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    
    const { isMobile } = detectPlatform();
    
    if (isMobile) {
      tg.requestFullscreen();
    } else {
    }

    // Применяем тему
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

// Утилита для закрытия клавиатуры на iOS
export function hideKeyboard() {
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

// Утилиты для определения платформы
export function isDesktop() {
  return detectPlatform().isDesktop;
}

export function isMobile() {
  return detectPlatform().isMobile;
}