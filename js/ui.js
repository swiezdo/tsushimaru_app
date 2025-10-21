// ui.js
// Управление экранами, верхней панелью, безопасными отступами и умным скроллом к полям ввода.

import { tg, scrollTopSmooth } from './telegram.js';

// Ссылки на экраны
export const screens = {
  home:               document.getElementById('homeScreen'),
  profile:            document.getElementById('profileScreen'),
  trophies:           document.getElementById('trophiesScreen'),
  trophyDetail:       document.getElementById('trophyDetailScreen'),
  builds:             document.getElementById('buildsScreen'),
  buildCreate:        document.getElementById('buildCreateScreen'),
  buildDetail:        document.getElementById('buildDetailScreen'),
  buildPublicDetail:  document.getElementById('buildPublicDetailScreen'),
};

// Топбар
export function setTopbar(visible, title) {
  const tb = document.querySelector('.topbar');
  if (tb) tb.style.display = visible ? 'flex' : 'none';
  if (title) {
    const t = document.getElementById('appTitle');
    if (t) t.textContent = title;
  }
}

// Показ экрана
export function showScreen(name) {
  Object.values(screens).forEach((el) => el && el.classList.add('hidden'));
  const el = screens[name];
  if (el) el.classList.remove('hidden');

  if (tg) {
    const withBack = ['profile','trophies','builds','buildCreate','buildDetail','buildPublicDetail','trophyDetail'];
    if (withBack.includes(name)) tg.BackButton.show();
    else tg.BackButton.hide();
  }

  if (name === 'home')                 setTopbar(false);
  else if (name === 'profile')         setTopbar(true, 'Профиль');
  else if (name === 'trophies')        setTopbar(true, 'Трофеи');
  else if (name === 'trophyDetail')    setTopbar(true, 'Трофеи');
  else if (name === 'builds')          setTopbar(true, 'Билды');
  else if (name === 'buildCreate')     setTopbar(true, 'Создать билд');
  else if (name === 'buildDetail')     setTopbar(true, 'Билд');
  else if (name === 'buildPublicDetail') setTopbar(true, 'Билд');

  scrollTopSmooth();
}

// Безопасный верхний отступ
export function applyTopInset() {
  const root = document.querySelector('main.container');
  if (!root) return;
  const TOP_OFFSET_PX = 64;
  root.style.paddingTop = `calc(env(safe-area-inset-top, 0px) + ${TOP_OFFSET_PX}px)`;
}
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(applyTopInset, 100);
});

// ===== Умный скролл к полю (с учётом экранной клавиатуры) =====
export function focusAndScrollIntoView(el) {
  if (!el) return;
  try { el.focus({ preventScroll: true }); } catch(_) { try { el.focus(); } catch {} }

  const behavior = 'smooth';
  const pad = 16;
  const rect = el.getBoundingClientRect();

  if (window.visualViewport) {
    const vv = window.visualViewport;
    const topOk = rect.top >= pad;
    const bottomOk = rect.bottom <= (vv.height - pad);
    if (!topOk || !bottomOk) {
      const targetY = rect.top + window.scrollY - Math.max(0, (vv.height/2 - rect.height/2));
      window.scrollTo({ top: targetY, behavior });
    }
  } else {
    el.scrollIntoView({ block: 'center', behavior });
  }
}

// Глобально: держим текущий фокус в видимой области
(function installGlobalSmartScroll(){
  // При фокусе на любом input/textarea — подскроллим
  document.addEventListener('focusin', (e) => {
    const t = e.target;
    if (!t) return;
    const tag = t.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      setTimeout(() => focusAndScrollIntoView(t), 50);
    }
  }, { passive: true });

  // Если высота вьюпорта меняется (клавиатура) — удерживаем поле в зоне видимости
  window.visualViewport?.addEventListener('resize', () => {
    const a = document.activeElement;
    if (!a) return;
    const tag = a.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') {
      focusAndScrollIntoView(a);
    }
  });
})();
