// ui.js
// Управление экранами, верхней панелью, безопасными отступами и умным скроллом к полям ввода.

import { tg, scrollTopSmooth } from './telegram.js';
import { loadProfileOnScreenOpen } from './profile.js';
import { renderMasteryButtons } from './mastery.js';
import { renderTrophiesCollection } from './trophies.js';
import { renderTrophiesButtons } from './trophies_list.js';
import { renderWhatsNewCards } from './whatsNew.js';
import { openStoryScreen } from './story.js';
import { refreshParticipantsList, resetParticipantSearch } from './participants.js';
import { initHome, initRotationScreen } from './home.js';

// Ссылки на экраны
export const screens = {
  home:               document.getElementById('homeScreen'),
  rotation:           document.getElementById('rotationScreen'),
  story:              document.getElementById('storyScreen'),
  profile:            document.getElementById('profileScreen'),
  profileEdit:        document.getElementById('profileEditScreen'),
  waves:              document.getElementById('wavesScreen'),
  participants:       document.getElementById('participantsScreen'),
  participantDetail:  document.getElementById('participantDetailScreen'),
  builds:             document.getElementById('buildsScreen'),
  buildCreate:        document.getElementById('buildCreateScreen'),
  buildEdit:          document.getElementById('buildEditScreen'),
  buildDetail:        document.getElementById('buildDetailScreen'),
  buildPublicDetail:  document.getElementById('buildPublicDetailScreen'),
  whatsNew:           document.getElementById('whatsNewScreen'),
  feedback:           document.getElementById('feedbackScreen'),
  reward:             document.getElementById('rewardScreen'),
  rewardDetail:       document.getElementById('rewardDetailScreen'),
  trophyDetail:       document.getElementById('trophyDetailScreen'),
};

const SCREEN_TITLES = {
  home: 'Tsushima.Ru',
  rotation: 'Ротация',
  story: 'Сюжет',
  profile: 'Профиль',
  profileEdit: 'Редактировать профиль',
  waves: 'Волны',
  participants: 'Участники',
  participantDetail: 'Участник',
  builds: 'Билды',
  buildCreate: 'Создать билд',
  buildEdit: 'Редактирование',
  buildDetail: 'Билд',
  buildPublicDetail: 'Билд',
  whatsNew: 'Что нового?',
  feedback: 'Отправить отзыв',
  reward: 'Награды',
};

const SCREENS_WITH_BACK = new Set([
  'story',
  'waves',
  'profileEdit',
  'participantDetail',
  'buildCreate',
  'buildEdit',
  'buildDetail',
  'buildPublicDetail',
  'whatsNew',
  'feedback',
  'rewardDetail',
  'trophyDetail',
]);

const SCREEN_HOOKS = {
  home: () => initHome(),
  rotation: () => initRotationScreen(),
  story: () => openStoryScreen(),
  profile: () => {
    loadProfileOnScreenOpen();
    renderTrophiesCollection(true);
  },
  profileEdit: () => loadProfileOnScreenOpen(),
  participants: () => {
    resetParticipantSearch();
    refreshParticipantsList().catch((err) => {
      console.error('Ошибка обновления списка участников:', err);
    }).then(() => {
      // Восстанавливаем позицию скролла после загрузки списка участников
      const savedPosition = scrollPositions.get('participants');
      if (savedPosition !== undefined && savedPosition > 0) {
        setTimeout(() => {
          window.scrollTo({ top: savedPosition, behavior: 'auto' });
        }, 150);
      }
    });
  },
  reward: () => {
    renderMasteryButtons();
    renderTrophiesButtons();
    // Восстанавливаем позицию скролла после рендеринга контента
    const savedPosition = scrollPositions.get('reward');
    if (savedPosition !== undefined && savedPosition > 0) {
      setTimeout(() => {
        window.scrollTo({ top: savedPosition, behavior: 'auto' });
      }, 150);
    }
  },
  whatsNew: () => {
    renderWhatsNewCards();
  },
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

// Обновление активного состояния bottom navigation
export function updateBottomNav(activeScreen) {
  const bottomNav = document.getElementById('bottomNav');
  if (!bottomNav) return;
  
  // Удаляем класс active со всех кнопок
  const buttons = bottomNav.querySelectorAll('.bottom-nav-btn');
  buttons.forEach(btn => btn.classList.remove('active'));
  
  // Добавляем класс active к соответствующей кнопке
  if (activeScreen) {
    const activeBtn = bottomNav.querySelector(`[data-screen="${activeScreen}"]`);
    if (activeBtn) {
      activeBtn.classList.add('active');
    }
  }
}

// Хранилище позиций скролла для экранов
const scrollPositions = new Map();

// Экраны, для которых нужно сохранять позицию скролла (списки)
const SCREENS_WITH_SCROLL_POSITION = new Set([
  'participants',
  'builds',
  'reward',
]);

// Сохранение позиции скролла для экрана
function saveScrollPosition(screenName) {
  // Сохраняем позицию только для экранов-списков
  if (SCREENS_WITH_SCROLL_POSITION.has(screenName)) {
    if (screens[screenName] && screens[screenName].classList.contains('hidden') === false) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      scrollPositions.set(screenName, scrollY);
    }
  }
}

// Восстановление позиции скролла для экрана
function restoreScrollPosition(screenName) {
  // Восстанавливаем позицию только для экранов-списков
  if (!SCREENS_WITH_SCROLL_POSITION.has(screenName)) {
    return false;
  }
  
  const savedPosition = scrollPositions.get(screenName);
  if (savedPosition !== undefined && savedPosition > 0) {
    // Используем двойной requestAnimationFrame для восстановления после полного рендеринга
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: savedPosition, behavior: 'auto' });
      });
    });
    return true;
  }
  return false;
}

// Показ экрана
export function showScreen(name, options = {}) {
  // Определяем текущий активный экран перед переключением
  let currentActiveScreen = null;
  for (const [screenName, screenEl] of Object.entries(screens)) {
    if (screenEl && !screenEl.classList.contains('hidden')) {
      currentActiveScreen = screenName;
      break;
    }
  }

  // Сохраняем позицию скролла для текущего экрана перед переключением
  if (currentActiveScreen) {
    saveScrollPosition(currentActiveScreen);
  }

  Object.values(screens).forEach((el) => el && el.classList.add('hidden'));
  const el = screens[name];
  if (el) el.classList.remove('hidden');

  if (tg) {
    if (SCREENS_WITH_BACK.has(name)) tg.BackButton.show();
    else tg.BackButton.hide();
  }

  const title = SCREEN_TITLES[name];
  if (title) {
    setTopbar(true, title);
  }
  const settingsBtn = document.getElementById('homeSettingsBtn');
  if (settingsBtn) {
    if (name === 'home') settingsBtn.classList.remove('hidden');
    else settingsBtn.classList.add('hidden');
  }

  const hook = SCREEN_HOOKS[name];
  if (typeof hook === 'function') {
    hook();
  }

  // Обновляем активное состояние bottom navigation
  updateBottomNav(name);

  // Восстанавливаем позицию скролла или скроллим вверх
  // Если options.skipScroll === true, не скроллим вообще
  if (options.skipScroll) {
    // Не скроллим
  } else if (restoreScrollPosition(name)) {
    // Позиция восстановлена - дополнительная задержка для асинхронного контента
    setTimeout(() => {
      const savedPosition = scrollPositions.get(name);
      if (savedPosition !== undefined && savedPosition > 0) {
        window.scrollTo({ top: savedPosition, behavior: 'auto' });
      }
    }, 100);
  } else {
    // Скроллим вверх только если позиция не была сохранена
    scrollTopSmooth();
  }
}
export function applySafeInsets() {
  const root = document.querySelector('main.container');
  if (!root) return;
  
  // Определяем боковые отступы в зависимости от платформы
  const cardSpacing = 16;
  
  // Используем системные безопасные зоны
  root.style.paddingTop = `calc(env(safe-area-inset-top, 0px) + 64px)`;
  root.style.paddingLeft = `env(safe-area-inset-left, 0px)`;
  root.style.paddingRight = `env(safe-area-inset-right, 0px)`;
  // Учитываем высоту bottom navigation bar (60px) + safe area + базовый отступ
  root.style.paddingBottom = `calc(env(safe-area-inset-bottom, 0px) + 16px + 60px)`;
  
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

// ===== Закрытие клавиатуры на iOS при тапе вне поля ввода =====
(function installIOSKeyboardClose() {
  // Правильная проверка iOS устройства
  const isIOS = (tg && tg.platform === 'ios') || 
                /iPad|iPhone|iPod/.test(navigator.userAgent) ||
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  if (!isIOS) return; // Если не iOS, ничего не делаем
  
  // Функция для проверки, является ли элемент полем ввода
  function isInputElement(element) {
    if (!element) return false;
    const tag = element.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA';
  }
  
  // Функция для закрытия клавиатуры
  function dismissKeyboard() {
    // Убираем фокус с активного элемента
    const activeElement = document.activeElement;
    if (activeElement && isInputElement(activeElement)) {
      activeElement.blur();
    }
    
    // Дополнительно пытаемся закрыть клавиатуру через программный способ
    if (window.scrollTo) {
      window.scrollTo(0, window.scrollY);
    }
  }
  
  // Обработчик тапа вне поля ввода (touchend более надёжен на iOS)
  document.addEventListener('touchend', function(event) {
    const target = event.target;
    
    // Если тап не по полю ввода или его родительским элементам
    if (!target.closest('INPUT') && !target.closest('TEXTAREA')) {
      // Небольшая задержка для корректной работы
      setTimeout(dismissKeyboard, 10);
    }
  });
  
  // Дополнительный обработчик для touchstart (без passive для лучшего контроля)
  document.addEventListener('touchstart', function(event) {
    const target = event.target;
    
    // Если тап не по полю ввода или его родительским элементам
    if (!target.closest('INPUT') && !target.closest('TEXTAREA')) {
      dismissKeyboard();
    }
  });
  
  // Обработчик для клика мышью (если используется)
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    // Если клик не по полю ввода или его родительским элементам
    if (!target.closest('INPUT') && !target.closest('TEXTAREA')) {
      dismissKeyboard();
    }
  }, { passive: true });
  
  // Обработчик для кнопок - закрываем клавиатуру при нажатии на кнопки
  document.addEventListener('click', function(event) {
    const target = event.target;
    
    // Если клик по кнопке, ссылке или другому интерактивному элементу
    if (target.tagName === 'BUTTON' || 
        target.tagName === 'A' || 
        target.classList.contains('btn') ||
        target.classList.contains('card') ||
        target.classList.contains('list-btn')) {
      dismissKeyboard();
    }
  }, { passive: true });
  
  // Обработчик клавиш для закрытия клавиатуры
  document.addEventListener('keydown', function(event) {
    // Закрываем клавиатуру при нажатии Escape или Enter (для однострочных полей)
    if (event.key === 'Escape') {
      dismissKeyboard();
    } else if (event.key === 'Enter') {
      const activeElement = document.activeElement;
      // Правильная проверка: для INPUT полей, но не для TEXTAREA
      if (activeElement && activeElement.tagName === 'INPUT' && activeElement.tagName !== 'TEXTAREA') {
        dismissKeyboard();
      }
    }
  });
  
  // Дополнительная функция для программного закрытия клавиатуры
  // Можно вызывать из других частей приложения
  window.dismissIOSKeyboard = dismissKeyboard;
})();