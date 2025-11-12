// ui.js
// Управление экранами, верхней панелью, безопасными отступами и умным скроллом к полям ввода.

import { tg, scrollTopSmooth } from './telegram.js';
import { loadProfileOnScreenOpen } from './profile.js';
import { renderMasteryButtons } from './mastery.js';
import { renderTrophiesCollection } from './trophies.js';
import { renderTrophiesButtons } from './trophies_list.js';
import { refreshParticipantsList, resetParticipantSearch } from './participants.js';

// Ссылки на экраны
export const screens = {
  home:               document.getElementById('homeScreen'),
  profile:            document.getElementById('profileScreen'),
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
  profile: 'Профиль',
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
  'profile',
  'waves',
  'participants',
  'participantDetail',
  'builds',
  'buildCreate',
  'buildEdit',
  'buildDetail',
  'buildPublicDetail',
  'whatsNew',
  'feedback',
  'reward',
  'rewardDetail',
  'trophyDetail',
]);

const SCREEN_HOOKS = {
  profile: () => loadProfileOnScreenOpen(),
  participants: () => {
    resetParticipantSearch();
    refreshParticipantsList().catch((err) => {
      console.error('Ошибка обновления списка участников:', err);
    });
  },
  reward: () => {
    renderMasteryButtons();
    renderTrophiesCollection(true);
    renderTrophiesButtons();
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

// Показ экрана
export function showScreen(name) {
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

  const hook = SCREEN_HOOKS[name];
  if (typeof hook === 'function') {
    hook();
  }

  scrollTopSmooth();
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
  root.style.paddingBottom = `calc(env(safe-area-inset-bottom, 0px) + 16px)`;
  
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
  // Импортируем утилиты из telegram.js
  const tg = window.Telegram?.WebApp;
  
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