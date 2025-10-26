// telegram.js
// Единая точка работы с Telegram WebApp SDK, тактильной отдачей и базовыми утилитами.

export const tg = window.Telegram?.WebApp || null;

// Инициализация Telegram WebApp + применение темы
(function initTG() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    
    // Определяем платформу более точно
    const platform = tg.platform || 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Проверяем по нескольким критериям
    const isDesktopByPlatform = platform === 'desktop' || platform === 'macos' || platform === 'linux' || platform === 'windows';
    const isDesktopByUserAgent = userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux') || userAgent.includes('x11');
    const isMobileByPlatform = platform === 'ios' || platform === 'android';
    const isMobileByUserAgent = userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad');
    
    const isDesktop = isDesktopByPlatform || (isDesktopByUserAgent && !isMobileByUserAgent);
    const isMobile = isMobileByPlatform || isMobileByUserAgent;
    
    console.log('🔍 Platform detection:', {
      tgPlatform: platform,
      userAgent: userAgent,
      isDesktopByPlatform,
      isDesktopByUserAgent,
      isMobileByPlatform,
      isMobileByUserAgent,
      finalIsDesktop: isDesktop,
      finalIsMobile: isMobile
    });
    
    if (isDesktop) {
      // На ПК используем только expand() - НЕ запрашиваем полноэкранный режим
      console.log('🖥️ Desktop detected - using expand mode only');
    } else if (isMobile) {
      // На мобильных устройствах используем полноэкранный режим
      tg.requestFullscreen();
      console.log('📱 Mobile detected - using fullscreen mode');
    } else {
      // Если не можем определить - используем только expand()
      console.log('❓ Unknown platform - using expand mode only');
    }

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
  // Убираем фокус с активного элемента
  if (document.activeElement && document.activeElement.blur) {
    document.activeElement.blur();
  }
}

// Утилиты для управления полноэкранным режимом
export function enterFullscreen() {
  try { tg?.requestFullscreen(); } catch {}
}

export function exitFullscreen() {
  try { tg?.exitFullscreen(); } catch {}
}

export function isFullscreen() {
  try { return tg?.isFullscreen || false; } catch { return false; }
}

// Утилиты для определения платформы
export function getPlatform() {
  try { return tg?.platform || 'unknown'; } catch { return 'unknown'; }
}

export function isDesktop() {
  try {
    const platform = tg?.platform || 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    
    const isDesktopByPlatform = platform === 'desktop' || platform === 'macos' || platform === 'linux' || platform === 'windows';
    const isDesktopByUserAgent = userAgent.includes('windows') || userAgent.includes('macintosh') || userAgent.includes('linux') || userAgent.includes('x11');
    const isMobileByUserAgent = userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad');
    
    return isDesktopByPlatform || (isDesktopByUserAgent && !isMobileByUserAgent);
  } catch { 
    return false; 
  }
}

export function isMobile() {
  try {
    const platform = tg?.platform || 'unknown';
    const userAgent = navigator.userAgent.toLowerCase();
    
    const isMobileByPlatform = platform === 'ios' || platform === 'android';
    const isMobileByUserAgent = userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone') || userAgent.includes('ipad');
    
    return isMobileByPlatform || isMobileByUserAgent;
  } catch { 
    return false; 
  }
}