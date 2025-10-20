// ui.js
// Управление экранами, верхней панелью и безопасными отступами.

import { tg, scrollTopSmooth } from './telegram.js';

// Ссылки на экраны (section-ы). Поддерживает show/hide по классу .hidden.
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

// Управление видимостью топбара и заголовком
export function setTopbar(visible, title) {
  const tb = document.querySelector('.topbar');
  if (tb) tb.style.display = visible ? 'flex' : 'none';
  if (title) {
    const t = document.getElementById('appTitle');
    if (t) t.textContent = title;
  }
}

// Универсальный показ экрана + синхронизация BackButton Telegram
export function showScreen(name) {
  Object.values(screens).forEach((el) => el && el.classList.add('hidden'));
  const el = screens[name];
  if (el) el.classList.remove('hidden');

  // Telegram BackButton
  if (tg) {
    const withBack = ['profile','trophies','builds','buildCreate','buildDetail','buildPublicDetail','trophyDetail'];
    if (withBack.includes(name)) tg.BackButton.show();
    else tg.BackButton.hide();
  }

  // Заголовки топбара
  if (name === 'home')                 setTopbar(false);
  else if (name === 'profile')         setTopbar(true, 'Профиль');
  else if (name === 'trophies')        setTopbar(true, 'Трофеи');
  else if (name === 'trophyDetail')    setTopbar(true, 'Трофеи');
  else if (name === 'builds')          setTopbar(true, 'Билды');
  else if (name === 'buildCreate')     setTopbar(true, 'Создать билд');
  else if (name === 'buildDetail')     setTopbar(true, 'Билд');
  else if (name === 'buildPublicDetail') setTopbar(true, 'Билд');

  // Всегда аккуратно наверх после переключения экрана
  scrollTopSmooth();
}

// Безопасный верхний отступ под системные панели Telegram + вырезы
export function applyTopInset() {
  const root = document.querySelector('main.container');
  if (!root) return;
  const TOP_OFFSET_PX = 64; // запас под верхнюю область Telegram
  root.style.paddingTop = `calc(env(safe-area-inset-top, 0px) + ${TOP_OFFSET_PX}px)`;
}

// Авто-обновление отступа при изменении размера окна/вьюпорта
window.addEventListener('resize', applyTopInset);
