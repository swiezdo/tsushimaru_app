// ui.js
// Управление экранами, верхней панелью, безопасными отступами и умным скроллом к полям ввода.

import { tg, scrollTopSmooth } from './telegram.js';
import { loadProfileOnScreenOpen } from './profile.js';
import { renderMasteryButtons } from './mastery.js';
import { renderTrophiesCollection } from './trophies.js';
import { renderTrophiesButtons } from './trophies_list.js';
import { renderSeasonTrophy } from './season_trophy.js';
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
  seasonTrophy:       document.getElementById('seasonTrophyScreen'),
  hellmodeQuestDetail: document.getElementById('hellmodeQuestDetailScreen'),
  top100Detail:       document.getElementById('top100DetailScreen'),
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
  seasonTrophy: 'Сезонный трофей',
  hellmodeQuestDetail: 'Задание HellMode',
  top100Detail: 'ТОП-100',
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
  'seasonTrophy',
  'hellmodeQuestDetail',
  'top100Detail',
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
    });
  },
  reward: () => {
    renderSeasonTrophy();
    renderMasteryButtons();
    renderTrophiesButtons();
  },
  whatsNew: () => {
    renderWhatsNewCards();
  },
};

// Топбар
export function setTopbar(visible, title) {
  const tb = document.querySelector('.topbar');
  if (tb) tb.style.display = visible ? 'flex' : 'none';
  const t = document.getElementById('appTitle');
  if (t) {
  if (title) {
      t.textContent = title;
      t.style.display = '';
    } else {
      // Используем неразрывный пробел для сохранения высоты
      t.textContent = '\u00A0';
      t.style.display = '';
    }
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


// Показ экрана
export function showScreen(name, options = {}) {
  // ВСЕГДА сбрасываем скролл ДО переключения экрана
  // Скролл происходит на main.container, а не на window
  if (!options.skipScroll) {
    const mainContainer = document.querySelector('main.container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }
  
  Object.values(screens).forEach((el) => el && el.classList.add('hidden'));
  const el = screens[name];
  if (el) el.classList.remove('hidden');
  
  // ВСЕГДА сбрасываем скролл ПОСЛЕ переключения экрана
  if (!options.skipScroll) {
    const mainContainer = document.querySelector('main.container');
    if (mainContainer) {
      mainContainer.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  if (tg) {
    // Проверяем, не зарегистрирован ли пользователь (навигация скрыта)
    const bottomNav = document.getElementById('bottomNav');
    const isUnregistered = bottomNav && bottomNav.classList.contains('hidden');
    
    // Если пользователь не зарегистрирован и открыта страница редактирования профиля - скрываем кнопку "Назад"
    if (isUnregistered && name === 'profileEdit') {
      tg.BackButton.hide();
    } else if (SCREENS_WITH_BACK.has(name)) {
      tg.BackButton.show();
    } else {
      tg.BackButton.hide();
    }
  }

  const title = SCREEN_TITLES[name];
  if (name === 'home') {
    // На главной странице скрываем только заголовок
    setTopbar(true, '');
  } else if (title) {
    setTopbar(true, title);
  }
  const settingsBtn = document.getElementById('homeSettingsBtn');
  if (settingsBtn) {
    if (name === 'home') settingsBtn.classList.remove('hidden');
    else settingsBtn.classList.add('hidden');
  }
  
  const balanceBtn = document.getElementById('homeBalanceBtn');
  if (balanceBtn) {
    if (name === 'home') balanceBtn.classList.remove('hidden');
    else balanceBtn.classList.add('hidden');
  }

  const hook = SCREEN_HOOKS[name];
  if (typeof hook === 'function') {
    hook();
  }

  // Обновляем активное состояние bottom navigation
  updateBottomNav(name);

  // Дополнительный скролл через requestAnimationFrame и setTimeout для гарантии после рендеринга
  // Если options.skipScroll === true, не скроллим вообще
  if (!options.skipScroll) {
    const mainContainer = document.querySelector('main.container');
    
    // Через requestAnimationFrame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
    
    // Также через setTimeout для гарантии после всех асинхронных операций
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 0);
    
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 50);
    
    setTimeout(() => {
      if (mainContainer) {
        mainContainer.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    }, 100);
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