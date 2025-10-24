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

  if (name === 'home')                 setTopbar(true, 'Tsushima.Ru');
  else if (name === 'profile')         {
    setTopbar(true, 'Профиль');
    // Загружаем профиль с сервера при открытии экрана профиля
    loadProfileOnScreenOpen();
  }
  else if (name === 'trophies')        setTopbar(true, 'Трофеи');
  else if (name === 'trophyDetail')    setTopbar(true, 'Трофеи');
  else if (name === 'builds')          setTopbar(true, 'Билды');
  else if (name === 'buildCreate')     setTopbar(true, 'Создать билд');
  else if (name === 'buildDetail')     setTopbar(true, 'Билд');
  else if (name === 'buildPublicDetail') setTopbar(true, 'Билд');

  scrollTopSmooth();
}

// Загрузка профиля с сервера при открытии экрана профиля
async function loadProfileOnScreenOpen() {
  try {
    // Импортируем функцию динамически, чтобы избежать циклических зависимостей
    const { fetchProfile } = await import('./api.js');
    const serverProfile = await fetchProfile();
    
    if (serverProfile) {
      // Импортируем функции профиля
      const { saveProfile, loadProfileToForm } = await import('./profile.js');
      
      // Сохраняем в LocalStorage
      saveProfile(serverProfile);
      // Обновляем форму и отображение
      loadProfileToForm(serverProfile);
      console.log('Профиль загружен с сервера при открытии экрана');
    }
  } catch (error) {
    console.log('Ошибка загрузки профиля с сервера при открытии экрана:', error);
    // Не показываем ошибку пользователю, так как это не критично
  }
}

// Безопасные отступы (верх, низ, бока)
export function applySafeInsets() {
  const root = document.querySelector('main.container');
  if (!root) return;
  
  // Определяем боковые отступы в зависимости от платформы
  const cardSpacing = 16;
  
  // Используем системные безопасные зоны
  root.style.marginTop = `56px`;
  root.style.marginBottom = `16px`;
  root.style.paddingTop = `env(safe-area-inset-top, 0px)`;
  root.style.paddingLeft = `calc(env(safe-area-inset-left, 0px)`;
  root.style.paddingRight = `calc(env(safe-area-inset-right, 0px)`;
  root.style.paddingBottom = `env(safe-area-inset-bottom, 0px)`;
  
  // Добавляем отступы между карточками через CSS переменную
  root.style.setProperty('--card-spacing', `${cardSpacing}px`);
}
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(applySafeInsets, 100);
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
