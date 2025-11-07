// telegram.js
// Единая точка работы с Telegram WebApp SDK, тактильной отдачей и базовыми утилитами.

export const tg = window.Telegram?.WebApp || null;

// Определение платформы (вычисляется один раз при загрузке)
const platformInfo = (() => {
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
})();

// Определение светлой/темной темы по цвету фона
function isLightTheme(bgColor) {
  if (!bgColor) return false;
  
  // Если цвет в формате #RRGGBB, конвертируем в RGB
  let r, g, b;
  if (bgColor.startsWith('#')) {
    r = parseInt(bgColor.slice(1, 3), 16);
    g = parseInt(bgColor.slice(3, 5), 16);
    b = parseInt(bgColor.slice(5, 7), 16);
  } else if (bgColor.startsWith('rgb')) {
    // Если rgb(r, g, b) или rgba(r, g, b, a)
    const match = bgColor.match(/\d+/g);
    if (match && match.length >= 3) {
      r = parseInt(match[0]);
      g = parseInt(match[1]);
      b = parseInt(match[2]);
    } else {
      return false;
    }
  } else if (/^[0-9a-fA-F]{6}$/.test(bgColor)) {
    // Если цвет без # (например, "ffffff")
    r = parseInt(bgColor.slice(0, 2), 16);
    g = parseInt(bgColor.slice(2, 4), 16);
    b = parseInt(bgColor.slice(4, 6), 16);
  } else {
    return false;
  }
  
  // Проверяем на валидность
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return false;
  }
  
  // Вычисляем яркость по формуле W3C
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}

// Применение темы с адаптивными цветами
function applyTheme() {
  if (!tg) return;
  
  const th = tg.themeParams || {};
  const bgColor = th.bg_color || '#0e1621';
  const textColor = th.text_color || '#ffffff';
  const hintColor = th.hint_color || '#aeb7c2';
  
  const isLight = isLightTheme(bgColor);
  
  // Применяем базовые цвета Telegram
  document.documentElement.style.setProperty('--tg-bg', bgColor);
  document.documentElement.style.setProperty('--tg-tx', textColor);
  document.documentElement.style.setProperty('--tg-hint', hintColor);
  
  // Адаптивные цвета для карточек и элементов
  if (isLight) {
    // Светлая тема: используем темные полупрозрачные цвета с увеличенной контрастностью
    document.documentElement.style.setProperty('--card-bg', 'rgba(0, 0, 0, 0.06)');
    document.documentElement.style.setProperty('--stroke-color', 'rgba(0, 0, 0, 0.15)');
    document.documentElement.style.setProperty('--elem-bg', 'rgba(0, 0, 0, 0.08)');
    document.documentElement.style.setProperty('--lightbox-bg', 'rgba(0, 0, 0, 0.75)');
    document.documentElement.style.setProperty('--modal-bg', bgColor);
    // Темно-серый фон для квадратиков с иконками на светлой теме
    document.documentElement.style.setProperty('--icon-bg', 'rgba(0, 0, 0, 0.12)');
  } else {
    // Темная тема: используем светлые полупрозрачные цвета
    document.documentElement.style.setProperty('--card-bg', 'rgba(255, 255, 255, 0.04)');
    document.documentElement.style.setProperty('--stroke-color', 'rgba(255, 255, 255, 0.08)');
    document.documentElement.style.setProperty('--elem-bg', 'rgba(255, 255, 255, 0.06)');
    document.documentElement.style.setProperty('--lightbox-bg', 'rgba(0, 0, 0, 0.85)');
    document.documentElement.style.setProperty('--modal-bg', bgColor);
    // Светлый фон для квадратиков с иконками на темной теме
    document.documentElement.style.setProperty('--icon-bg', 'rgba(255, 255, 255, 0.06)');
  }
  
  // Добавляем класс для CSS-селекторов при необходимости
  document.documentElement.classList.toggle('theme-light', isLight);
  document.documentElement.classList.toggle('theme-dark', !isLight);
}

// Инициализация Telegram WebApp + применение темы
(function initTG() {
  if (!tg) return;
  try {
    tg.ready();
    tg.expand();
    
    const { isMobile } = platformInfo;
    
    if (isMobile) {
      tg.requestFullscreen();
    }
    
    // Применяем тему при инициализации
    applyTheme();
    
    document.documentElement.classList.add('tg');
    tg.MainButton.hide();
    
    // Обработчик изменения темы в реальном времени
    tg.onEvent('themeChanged', () => {
      applyTheme();
    });
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

// Утилиты для определения платформы (используют кешированные значения)
export function isDesktop() {
  return platformInfo.isDesktop;
}

export function isMobile() {
  return platformInfo.isMobile;
}